import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { ENV_SCHEMA, getSchemaForPlatform } from './schema/env-schema.js';
import { validateEnvVars, validateSingleVar } from './validators/env-validator.js';
import { generateToken } from './generators/shared.js';
import { generateSecretsScript, generateDevVars, getDeploySteps } from './generators/cloudflare.js';
import { generateAllDockerFiles } from './generators/docker.js';
import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function startServer(port: number): Promise<import('http').Server> {
  const app = express();
  app.use(express.json());

  // Serve wizard SPA static files - try multiple locations
  const candidates = [
    path.resolve(__dirname, '../wizard'),      // when running from dist/server/
    path.resolve(__dirname, '../dist/wizard'),  // when running from server/ (dev)
    path.resolve(__dirname, '../../dist/wizard'), // fallback
  ];
  let wizardDist = candidates[0];
  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(path.join(candidate, 'index.html'));
      if (stat.isFile()) { wizardDist = candidate; break; }
    } catch {}
  }
  try {
    await fs.access(wizardDist);
    app.use(express.static(wizardDist));
  } catch {
    // In dev mode, wizard might not be built yet
    console.log('Wizard not built yet. Run: npm run build:wizard');
  }

  // --- API Routes ---

  // Get env var schema
  app.get('/api/schema', (req, res) => {
    const platform = req.query.platform as 'cloudflare' | 'docker' | undefined;
    if (platform) {
      // Serialize schema without RegExp (not JSON-serializable)
      const schema = getSchemaForPlatform(platform).map((cat) => ({
        ...cat,
        vars: cat.vars.map((v) => ({
          ...v,
          pattern: v.pattern?.source,
        })),
      }));
      res.json(schema);
    } else {
      const schema = ENV_SCHEMA.map((cat) => ({
        ...cat,
        vars: cat.vars.map((v) => ({
          ...v,
          pattern: v.pattern?.source,
        })),
      }));
      res.json(schema);
    }
  });

  // Validate env vars
  app.post('/api/validate', (req, res) => {
    const { vars, platform } = req.body as {
      vars: Record<string, string>;
      platform: 'cloudflare' | 'docker';
    };
    const result = validateEnvVars(vars, platform);
    res.json(result);
  });

  // Validate a single var
  app.post('/api/validate/single', (req, res) => {
    const { key, value } = req.body as { key: string; value: string };
    const result = validateSingleVar(key, value);
    res.json(result);
  });

  // Generate a random token
  app.post('/api/token/generate', (_req, res) => {
    res.json({ token: generateToken() });
  });

  // Generate config files
  app.post('/api/generate', async (req, res) => {
    const { vars, platform, outputDir, browserEnabled } = req.body as {
      vars: Record<string, string>;
      platform: 'cloudflare' | 'docker';
      outputDir: string;
      browserEnabled?: boolean;
    };

    try {
      const resolvedDir = path.resolve(outputDir);
      await fs.mkdir(resolvedDir, { recursive: true });

      if (platform === 'cloudflare') {
        const secretsScript = generateSecretsScript(vars);
        const devVars = generateDevVars(vars);
        await fs.writeFile(path.join(resolvedDir, 'secrets.sh'), secretsScript, { mode: 0o700 });
        await fs.writeFile(path.join(resolvedDir, '.dev.vars'), devVars, { mode: 0o600 });
        res.json({
          success: true,
          files: ['secrets.sh', '.dev.vars'],
          outputDir: resolvedDir,
        });
      } else {
        const files = generateAllDockerFiles({ vars, browserEnabled: browserEnabled ?? false });
        for (const [filename, content] of Object.entries(files)) {
          const mode = filename === '.env' ? 0o600 : 0o644;
          await fs.writeFile(path.join(resolvedDir, filename), content, { mode });
        }
        res.json({
          success: true,
          files: Object.keys(files),
          outputDir: resolvedDir,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Deploy via SSE (streaming logs)
  app.post('/api/deploy', (req, res) => {
    const { platform, outputDir, vars } = req.body as {
      platform: 'cloudflare' | 'docker';
      outputDir: string;
      vars: Record<string, string>;
    };

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (event: string, data: string) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const sendLog = (msg: string) => send('log', msg);
    const sendStep = (step: string) => send('step', step);
    const sendDone = (msg: string) => {
      send('done', msg);
      res.end();
    };
    const sendError = (msg: string) => {
      send('error', msg);
      res.end();
    };

    const runCommand = (cmd: string, cwd?: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        sendLog(`$ ${cmd}`);
        const child = spawn('bash', ['-c', cmd], {
          cwd,
          env: { ...process.env },
        });

        child.stdout?.on('data', (data: Buffer) => {
          sendLog(data.toString().trim());
        });
        child.stderr?.on('data', (data: Buffer) => {
          sendLog(data.toString().trim());
        });
        child.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Command failed with code ${code}`));
        });
        child.on('error', reject);
      });
    };

    (async () => {
      try {
        const resolvedDir = path.resolve(outputDir);

        if (platform === 'docker') {
          sendStep('Generating Docker files...');
          const files = generateAllDockerFiles({
            vars,
            browserEnabled: !!(vars['CDP_SECRET']?.trim()),
          });
          await fs.mkdir(resolvedDir, { recursive: true });
          for (const [filename, content] of Object.entries(files)) {
            const mode = filename === '.env' ? 0o600 : 0o644;
            await fs.writeFile(path.join(resolvedDir, filename), content, { mode });
            sendLog(`Created ${filename}`);
          }

          sendStep('Starting Docker containers...');
          await runCommand('docker compose up -d', resolvedDir);

          sendStep('Waiting for health check...');
          await new Promise((r) => setTimeout(r, 5000));
          await runCommand('docker compose ps', resolvedDir);

          sendDone(`Moltbot is running! Files saved to ${resolvedDir}`);
        } else {
          // Cloudflare deploy
          sendStep('Checking wrangler authentication...');
          await runCommand('wrangler whoami');

          sendStep('Generating config files...');
          await fs.mkdir(resolvedDir, { recursive: true });
          const secretsScript = generateSecretsScript(vars);
          await fs.writeFile(path.join(resolvedDir, 'secrets.sh'), secretsScript, { mode: 0o700 });

          sendStep('Setting secrets...');
          await runCommand(`bash "${path.join(resolvedDir, 'secrets.sh')}"`);

          sendDone('Secrets configured! Run "npm run deploy" in your moltbot repo to deploy.');
        }
      } catch (error) {
        sendError(error instanceof Error ? error.message : 'Deploy failed');
      }
    })();
  });

  // SPA fallback - serve index.html for all non-API routes
  app.get('/{*path}', async (req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    try {
      const indexPath = path.join(wizardDist, 'index.html');
      await fs.access(indexPath);
      res.sendFile(indexPath);
    } catch {
      res.status(200).send(`
        <html>
          <body style="font-family: system-ui; padding: 2rem; text-align: center;">
            <h1>Moltbot Setup Wizard</h1>
            <p>Wizard UI not built yet. Run: <code>npm run build:wizard</code></p>
            <p>API is available at <a href="/api/schema">/api/schema</a></p>
          </body>
        </html>
      `);
    }
  });

  return new Promise((resolve) => {
    const server = app.listen(port, '127.0.0.1', () => {
      console.log(`Moltbot Setup Wizard running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

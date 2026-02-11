#!/usr/bin/env node

import { startServer } from '../server/index.js';
import open from 'open';

const DEFAULT_PORT = 3456;

function parseArgs(): { port: number } {
  const portArg = process.argv.find((a) => a.startsWith('--port='));
  const port = portArg ? parseInt(portArg.split('=')[1], 10) : DEFAULT_PORT;
  return { port: isNaN(port) ? DEFAULT_PORT : port };
}

async function main() {
  const { port } = parseArgs();

  console.log('');
  console.log('  Moltbot Setup Wizard');
  console.log('  ====================');
  console.log('');

  const server = await startServer(port);
  const url = `http://localhost:${port}`;

  console.log(`  Opening ${url} in your browser...`);
  console.log('  Press Ctrl+C to exit');
  console.log('');

  await open(url);

  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    (server as any).close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});

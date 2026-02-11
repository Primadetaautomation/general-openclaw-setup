const BASE = '/api';

export async function fetchSchema(platform?: 'cloudflare' | 'docker') {
  const url = platform ? `${BASE}/schema?platform=${platform}` : `${BASE}/schema`;
  const res = await fetch(url);
  return res.json();
}

export async function validateVars(vars: Record<string, string>, platform: 'cloudflare' | 'docker') {
  const res = await fetch(`${BASE}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vars, platform }),
  });
  return res.json();
}

export async function generateToken(): Promise<string> {
  const res = await fetch(`${BASE}/token/generate`, { method: 'POST' });
  const data = await res.json();
  return data.token;
}

export async function generateFiles(
  vars: Record<string, string>,
  platform: 'cloudflare' | 'docker',
  outputDir: string,
  browserEnabled?: boolean
) {
  const res = await fetch(`${BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vars, platform, outputDir, browserEnabled }),
  });
  return res.json();
}

export function startDeploy(
  vars: Record<string, string>,
  platform: 'cloudflare' | 'docker',
  outputDir: string,
  onLog: (msg: string) => void,
  onStep: (step: string) => void,
  onDone: (msg: string) => void,
  onError: (msg: string) => void
) {
  // Use fetch + ReadableStream for SSE
  fetch(`${BASE}/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vars, platform, outputDir }),
  }).then(async (response) => {
    const reader = response.body?.getReader();
    if (!reader) return onError('No response stream');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let eventType = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7);
        } else if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          switch (eventType) {
            case 'log': onLog(data); break;
            case 'step': onStep(data); break;
            case 'done': onDone(data); break;
            case 'error': onError(data); break;
          }
        }
      }
    }
  }).catch((err) => {
    onError(err.message || 'Connection failed');
  });
}

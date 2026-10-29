// Builds render/ and saves its WebGL stills to public/3d/*.webp via headless Chrome.
// Usage: node scripts/render-stills.mjs
import { spawn, execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const WebSocket = globalThis.WebSocket ?? createRequire(import.meta.url)('../../node_modules/ws');

execSync('npx vite build --config render/vite.config.js', { stdio: 'ignore' });
const html = '.render-dist/index.html';
writeFileSync(html, readFileSync(html, 'utf8').replace('type="module" crossorigin', 'defer'));
mkdirSync('public/3d', { recursive: true });

const port = 9333 + Math.floor(Math.random() * 500);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--allow-file-access-from-files', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist',
  `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/mintly-render-${port}`, 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 40 && !ws; i++) {
  await sleep(250);
  try { const t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = t.find((x) => x.type === 'page'); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch {}
}
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(String(e.data)); if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
await send('Page.navigate', { url: `file://${process.cwd()}/${html}` });
let out;
for (let i = 0; i < 60 && !out; i++) {
  await sleep(500);
  const r = await send('Runtime.evaluate', { expression: 'window.__out && JSON.stringify(window.__out)', returnByValue: true });
  if (r?.result?.value) out = JSON.parse(r.result.value);
}
for (const [k, v] of Object.entries(out)) {
  writeFileSync(`public/3d/${k}.webp`, Buffer.from(v.split(',')[1], 'base64'));
  console.log(k, Math.round(v.length * 0.75 / 1024), 'KB');
}
chrome.kill();
process.exit(0);

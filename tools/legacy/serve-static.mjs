// Serves a folder of static files over HTTP for baseline checks of the legacy site.
// Usage: node tools/legacy/serve-static.mjs <folder> <port>
// Requests under /api/ answer 404 on purpose: the legacy rooms then run in their offline mode,
// so a baseline run never reaches a paid AI endpoint.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const [, , folder, portArg] = process.argv;
if (!folder || !portArg) {
  console.error('usage: node serve-static.mjs <folder> <port>');
  process.exit(2);
}
const root = path.resolve(folder);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (urlPath.startsWith('/api/')) { res.writeHead(404); res.end('no api in the static baseline'); return; }
  const file = path.join(root, urlPath === '/' ? 'index.html' : urlPath);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(Number(portArg), '127.0.0.1', () => console.log(`serving ${root} at http://127.0.0.1:${portArg}/`));

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const mime = new Map([
  ['.mjs', 'text/javascript; charset=utf-8'], ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'], ['.json', 'application/json; charset=utf-8'],
  ['.glb', 'model/gltf-binary'], ['.gltf', 'model/gltf+json'], ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.svg', 'image/svg+xml'],
  ['.woff2', 'font/woff2'], ['.txt', 'text/plain; charset=utf-8'],
]);

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${host}:${port}`);
    const requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const filePath = path.resolve(root, `.${requested}`);
    if (filePath !== root && !filePath.startsWith(root + path.sep)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const info = await stat(filePath);
    if (!info.isFile()) { response.writeHead(404).end('Not found'); return; }
    const body = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': mime.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': path.extname(filePath) === '.glb' ? 'public, max-age=3600' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(body);
  } catch (error) {
    response.writeHead(error?.code === 'ENOENT' ? 404 : 500).end(error?.code === 'ENOENT' ? 'Not found' : 'Server error');
  }
});

server.listen(port, host, () => {
  process.stdout.write(`Nabd v1.5 available at http://${host}:${port}\n`);
  process.stdout.write('Press Ctrl+C to stop. Append ?debug=1 for developer diagnostics.\n');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

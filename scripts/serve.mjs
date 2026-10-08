// Dev-only static file server, no new dependency: the app's
// `<script type="module">` tags are blocked by most browsers' CORS policy
// when the page is opened directly as a file:// URL, so it needs to be
// served over http:// to actually run.
//
// Usage: npm run serve  (then open http://localhost:5173)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = process.cwd();
const PORT = process.env.PORT || 5173;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const server = createServer(async (req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const safePath = normalize(urlPath === '/' ? '/index.html' : urlPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(ROOT, safePath);

  // Don't serve anything outside the project root.
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    await stat(filePath);
    const data = await readFile(filePath);
    const type = CONTENT_TYPES[extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Serving ${ROOT} at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop.');
});

// Local preview server for the portfolio. Run: node portfolio/serve.mjs [port]
import {createReadStream, statSync} from 'node:fs';
import {createServer} from 'node:http';
import {extname, join, normalize} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.argv[2] || process.env.PORT || 4321);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = join(root, path.endsWith('/') ? path + 'index.html' : path);
  let size;
  try {
    size = statSync(file).size;
  } catch {
    res.writeHead(404).end('Not found');
    return;
  }
  const headers = {'Content-Type': types[extname(file)] || 'application/octet-stream', 'Accept-Ranges': 'bytes'};
  // Browsers ask for byte ranges when seeking video.
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    res.writeHead(206, {...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1});
    createReadStream(file, {start, end}).pipe(res);
    return;
  }
  res.writeHead(200, {...headers, 'Content-Length': size});
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Portfolio at http://localhost:${port}`));

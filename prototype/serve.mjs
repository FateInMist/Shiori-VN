import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, '').replace(/\//g, path.sep));
const port = Number(process.argv[2] || 5188);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };

const API_ORIGIN = 'https://api.vndb.org/kana';
const PROXY_PREFIX = '/kana/';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/* 透明代理：VNDB 的 CORS 只允许 POST/GET，PATCH/DELETE 必须绕到服务端转发 */
async function proxyKana(req, res, rawUrl) {
  const target = API_ORIGIN + '/' + rawUrl.slice(PROXY_PREFIX.length);
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;

  const headers = { 'User-Agent': 'vn-tuji-prototype/0.1' };
  if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
  if (req.headers['authorization']) headers['Authorization'] = req.headers['authorization'];

  try {
    const upstream = await fetch(target, { method: req.method, headers, body });
    const buf = Buffer.from(await upstream.arrayBuffer());
    setCors(res);
    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
    });
    res.end(buf);
  } catch (err) {
    setCors(res);
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('proxy error: ' + err.message);
  }
}

http.createServer((req, res) => {
  const rawUrl = req.url || '/';

  if (rawUrl.startsWith(PROXY_PREFIX)) {
    if (req.method === 'OPTIONS') {
      setCors(res);
      res.writeHead(204);
      res.end();
      return;
    }
    proxyKana(req, res, rawUrl);
    return;
  }

  let p = decodeURIComponent(rawUrl.split('?')[0]);
  if (p === '/' || p === '') p = '/index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); res.end('forbidden'); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}).listen(port, '127.0.0.1', () => console.log('serving ' + root + ' on http://127.0.0.1:' + port));

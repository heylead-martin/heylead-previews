// Dev server for dist/ that applies _headers and _redirects the way Cloudflare Pages does (path rules
// with splats and placeholders, comma-joined duplicates, "! Header" detaching, first-matching redirect).
// Host-specific _headers rules apply when the request Host matches (e.g. foo.pages.dev).
//   node scripts/dev/serve-dist.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const port = Number(process.argv[2] || 4329);
const types = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json'};

const pattern = src => {
  const url = /^https:\/\//.test(src) ? new URL(src.replace(/:(\w+)/g, 'ph-$1')) : null;
  const toRe = s => new RegExp('^' + s.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/ph-\w+|:\w+/g, '[^/.]+').replace(/\*/g, '.*') + '$');
  return url ? {host: toRe(url.hostname), path: toRe(url.pathname)} : {host: null, path: toRe(src)};
};
const headerRules = [];
{
  let cur = null;
  for (const line of fs.readFileSync(path.join(dist, '_headers'), 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    if (!/^\s/.test(line)) headerRules.push(cur = {...pattern(line.trim()), headers: []});
    else cur.headers.push(line.trim());
  }
}
const redirects = fs.readFileSync(path.join(dist, '_redirects'), 'utf8').split('\n').filter(l => l.trim() && !l.startsWith('#')).map(l => {
  const [from, to, status = '302'] = l.trim().split(/\s+/);
  const names = [];
  const re = new RegExp('^' + from.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/:(\w+)/g, (_, n) => (names.push(n), '([^/]+)')).replace(/\*/g, () => (names.push('splat'), '(.*)')) + '$');
  return {re, names, to, status: Number(status)};
});

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  for (const r of redirects) {
    const m = url.pathname.match(r.re);
    if (!m) continue;
    let to = r.to;
    r.names.forEach((n, i) => { to = to.replace(':' + n, m[i + 1]); });
    res.writeHead(r.status, {Location: to});
    return res.end();
  }
  const headers = {};
  for (const rule of headerRules) {
    if (rule.host && !rule.host.test(url.hostname)) continue;
    if (!rule.path.test(url.pathname)) continue;
    for (const h of rule.headers) {
      if (h.startsWith('! ')) { delete headers[h.slice(2).toLowerCase()]; continue; }
      const i = h.indexOf(':'), k = h.slice(0, i).toLowerCase(), v = h.slice(i + 1).trim();
      headers[k] = headers[k] ? `${headers[k]}, ${v}` : v;
    }
  }
  let file = path.join(dist, decodeURIComponent(url.pathname));
  if (!file.startsWith(dist)) { res.writeHead(400); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  let status = 200;
  if (!fs.existsSync(file)) { file = path.join(dist, '404.html'); status = 404; }
  res.writeHead(status, {...headers, 'content-type': types[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`dist on http://localhost:${port}`));

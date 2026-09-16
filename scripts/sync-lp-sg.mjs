#!/usr/bin/env node
/**
 * Copy only the /lp-sg/ hub (folder index) into this GitHub Pages repo.
 * Individual landers stay public on heylead.com.
 *
 * Usage:
 *   node scripts/sync-lp-sg.mjs /path/to/heylead/static-build/site/dist/lp-sg
 *   node scripts/sync-lp-sg.mjs --from-live   (fails if heylead.com/lp-sg/ 302s)
 */
import { mkdirSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'lp-sg');
const LIVE = 'https://heylead.com';
const PREVIEWS = 'https://previews.heylead.com';

const SLUGS = [''];

const AUTH_SNIPPET = `<script src="/auth-config.js"></script>
<script src="/auth.js"></script>
<script>
(function () {
  var API = ${JSON.stringify(LIVE)};
  var _fetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    try {
      if (typeof input === 'string' && input.indexOf('/api/') === 0) {
        input = API + input;
      } else if (input && typeof Request !== 'undefined' && input instanceof Request) {
        var u = input.url;
        if (u.indexOf(location.origin + '/api/') === 0) {
          input = new Request(API + u.slice(location.origin.length), input);
        }
      }
    } catch (e) {}
    return _fetch(input, init);
  };
})();
</script>
`;

function isHubPath(path) {
  const p = String(path || '').split('?')[0].split('#')[0];
  return p === '/lp-sg' || p === '/lp-sg/';
}

function keepRelative(path) {
  return (
    isHubPath(path) ||
    path.startsWith('/auth') ||
    path.startsWith('/login') ||
    path.startsWith('/logout')
  );
}

function rewriteUrl(value) {
  if (!value) return value;
  if (value.startsWith('https://heylead.com/lp-sg')) {
    const path = value.slice(LIVE.length);
    if (isHubPath(path)) return PREVIEWS + path;
    return value;
  }
  if (value.startsWith(LIVE + '/')) {
    const path = value.slice(LIVE.length);
    if (keepRelative(path)) return PREVIEWS + path;
    return value;
  }
  if (value.startsWith('/') && !value.startsWith('//')) {
    if (keepRelative(value)) return value;
    return LIVE + value;
  }
  return value;
}

function rewriteHtml(html) {
  let out = html.replace(/https:\/\/heylead\.com\/lp-sg\/?(?=["'#?\s<]|$)/g, PREVIEWS + '/lp-sg/');
  out = out.replace(/\b(href|src|action)=("|')([^"']+)\2/g, (m, attr, q, url) => {
    return attr + '=' + q + rewriteUrl(url) + q;
  });
  out = out.replace(
    /thankYouUrl:\s*(['"])\/sg\/thank-you\/\1/g,
    "thankYouUrl: 'https://heylead.com/sg/thank-you/'",
  );
  out = out.replace(
    /<meta name="robots" content="[^"]*"/g,
    '<meta name="robots" content="noindex, nofollow, noarchive"',
  );
  if (!/auth-config\.js/.test(out)) {
    out = out.replace(/<head[^>]*>/i, (open) => open + '\n' + AUTH_SNIPPET);
  }
  return out;
}

async function fetchLive(slug) {
  const path = slug ? '/lp-sg/' + slug + '/' : '/lp-sg/';
  const res = await fetch(LIVE + path, { redirect: 'manual' });
  if (res.status >= 300 && res.status < 400) {
    throw new Error(
      'GET ' + path + ' -> ' + res.status + ' ' + (res.headers.get('location') || '') +
        '. Pass a local dist/lp-sg path instead of --from-live.',
    );
  }
  if (!res.ok) throw new Error('GET ' + path + ' -> ' + res.status);
  return res.text();
}

function writePage(relDir, html) {
  const dest = join(OUT, relDir, 'index.html');
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, rewriteHtml(html));
  return dest;
}

async function fromLive() {
  let n = 0;
  for (const slug of SLUGS) {
    const html = await fetchLive(slug);
    const rel = slug;
    writePage(rel, html);
    n++;
    console.log('wrote lp-sg/' + (rel ? rel + '/' : '') + 'index.html');
  }
  return n;
}

function fromDir(src) {
  const hub = join(src, 'index.html');
  if (!statSync(hub).isFile()) throw new Error('Missing hub index at ' + hub);
  writePage('', readFileSync(hub, 'utf8'));
  console.log('wrote lp-sg/index.html');
  return 1;
}

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/sync-lp-sg.mjs /path/to/dist/lp-sg');
  process.exit(1);
}
const count = arg === '--from-live' ? await fromLive() : fromDir(arg);
console.log('sync-lp-sg: ' + count + ' pages -> ' + OUT);

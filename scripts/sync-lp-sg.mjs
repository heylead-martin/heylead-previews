#!/usr/bin/env node
/**
 * Copy HeyLead /lp-sg/ landers into this GitHub Pages repo so they are
 * visible at previews.heylead.com/lp-sg/ (login) and not on public heylead.com.
 *
 * Usage:
 *   node scripts/sync-lp-sg.mjs --from-live
 *   node scripts/sync-lp-sg.mjs /path/to/heylead/static-build/site/dist/lp-sg
 */
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'lp-sg');
const LIVE = 'https://heylead.com';
const PREVIEWS = 'https://previews.heylead.com';

const SLUGS = [
  '',
  'seo',
  'sem',
  'meta-ads',
  'website-optimization',
  'website-development',
  'website-performance',
  'leads',
];

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

function keepRelative(path) {
  return (
    path === '/lp-sg' ||
    path.startsWith('/lp-sg/') ||
    path.startsWith('/auth') ||
    path.startsWith('/login') ||
    path.startsWith('/logout')
  );
}

function rewriteUrl(value) {
  if (!value) return value;
  if (value.startsWith('https://heylead.com/lp-sg')) {
    return PREVIEWS + value.slice(LIVE.length);
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
  let out = html.replace(/https:\/\/heylead\.com\/lp-sg/g, PREVIEWS + '/lp-sg');
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
  const res = await fetch(LIVE + path, { redirect: 'follow' });
  if (!res.ok) throw new Error('GET ' + path + ' -> ' + res.status);
  return res.text();
}

function walkHtml(dir, base = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkHtml(p, base, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
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
  const files = walkHtml(src);
  if (!files.length) throw new Error('No HTML in ' + src);
  let n = 0;
  for (const file of files) {
    const rel = relative(src, dirname(file));
    writePage(rel === '.' ? '' : rel, readFileSync(file, 'utf8'));
    n++;
    console.log('wrote lp-sg/' + (rel === '.' ? '' : rel + '/') + 'index.html');
  }
  return n;
}

const arg = process.argv[2] || '--from-live';
const count = arg === '--from-live' ? await fromLive() : fromDir(arg);
console.log('sync-lp-sg: ' + count + ' pages -> ' + OUT);

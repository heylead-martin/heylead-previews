import {defineConfig} from 'astro/config';
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {SITE_URL} from './src/config/site.mjs';
import {redirectsFile} from './src/config/retired.mjs';

// Cloudflare Pages _redirects: generated 301s for withdrawn listings followed by public/_redirects
// (Astro skips "_" route files, so the merged file is written after the build). A listing that is
// published again gets no redirect.
const cloudflareRedirects = {
  name: 'homezypro-redirects',
  hooks: {
    'astro:build:done': async ({dir}) => {
      const {companies} = JSON.parse(await readFile(new URL('./src/data/companies.json', import.meta.url), 'utf8'));
      const published = new Set(companies.filter(c => c.publish !== false).map(c => c.slug));
      const staticRules = await readFile(new URL('./public/_redirects', import.meta.url), 'utf8');
      await writeFile(fileURLToPath(new URL('_redirects', dir)), redirectsFile(published, staticRules));
    }
  }
};

// Static output only (Cloudflare Pages). No adapter, no SSR.
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'always',
  build: {format: 'directory', inlineStylesheets: 'never'},
  compressHTML: false,
  devToolbar: {enabled: false},
  integrations: [cloudflareRedirects],
  vite: {build: {assetsInlineLimit: 0}}
});

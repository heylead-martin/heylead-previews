import {defineConfig} from 'astro/config';
import {SITE_URL} from './src/config/site.mjs';

// Static output only (Cloudflare Pages). No adapter, no SSR.
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'always',
  build: {format: 'directory', inlineStylesheets: 'never'},
  compressHTML: false,
  devToolbar: {enabled: false},
  vite: {build: {assetsInlineLimit: 0}}
});

/* Renders the site's character stills: a poster for every cast card and a
   face for every studio avatar, as WebP files the page shows as plain
   images. Drawing them in the visitor's browser instead would compile a
   shader per character while the page is opening.

     npm run posters

   Writes apps/playground/public/posters/<id>.webp and <id>-face.webp, and
   manifest.json with a key per character. The site build fails when a key
   no longer matches the character's spec or shader, so a changed character
   can't ship with an old picture. Rendering uses a Chromium-family browser
   already on the machine, on its software renderer (as `wobnimo preview`
   does), so the stills come out the same everywhere. */

import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const root = new URL('..', import.meta.url).pathname;
const out = `${root}apps/playground/public/posters`;
const bundle = (entry, format) =>
  build({ bundle: true, write: false, format, platform: format === 'esm' ? 'node' : 'browser', target: 'es2022', tsconfig: `${root}tsconfig.json`, entryPoints: [entry] });
const load = async (entry) => import(`data:text/javascript;base64,${Buffer.from((await bundle(entry, 'esm')).outputFiles[0].text).toString('base64')}`);

const { findBrowser } = await load(`${root}packages/wobnimo/src/cli/browser.ts`);
const { posterKeys } = await load(`${root}scripts/_catalog.ts`);
const page = (await bundle(`${root}scripts/_posters.ts`, 'iife')).outputFiles[0].text;

const executablePath = findBrowser(process.env.WOBNIMO_BROWSER);
if (!executablePath) throw new Error('No Chromium-family browser found. Install Chrome or set WOBNIMO_BROWSER to one.');
const browser = await chromium.launch({ executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const tab = await browser.newPage();
tab.on('pageerror', (e) => console.error(e.message));
await tab.setContent(`<!doctype html><meta charset="utf-8"><script>${page.replace(/<\/script/gi, '<\\/script')}</script>`);

await mkdir(out, { recursive: true });
const manifest = {};
let bytes = 0;
for (const [id, key] of Object.entries(posterKeys)) {
  const { poster, face } = await tab.evaluate((id) => window.renderPoster(id), id);
  for (const [file, url] of [[`${id}.webp`, poster], [`${id}-face.webp`, face]]) {
    const data = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    bytes += data.length;
    await writeFile(`${out}/${file}`, data);
  }
  manifest[id] = key;
  console.log(`  ${id}`);
}
await writeFile(`${out}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
await browser.close();
console.log(`${Object.keys(manifest).length} characters · ${(bytes / 1024).toFixed(0)} KB of stills`);

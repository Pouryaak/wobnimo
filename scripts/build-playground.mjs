/* Builds the playground as one self-contained HTML file, and measures the
   engine on its own (minified, gzipped) so the number on the page is real. */

import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const root = new URL('..', import.meta.url).pathname;
const common = { bundle: true, minify: true, write: false, target: 'es2022', tsconfig: `${root}tsconfig.json`, legalComments: 'none' };

const engine = await build({ ...common, entryPoints: [`${root}packages/engine/src/index.ts`], format: 'esm' });
const engineBytes = gzipSync(engine.outputFiles[0].contents).length;

const app = await build({
  ...common,
  entryPoints: [`${root}apps/playground/src/main.ts`],
  format: 'iife',
  define: { __ENGINE_GZIP_BYTES__: String(engineBytes) },
});
const js = app.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = await readFile(`${root}apps/playground/src/styles.css`, 'utf8');
const html = (await readFile(`${root}apps/playground/index.html`, 'utf8'))
  .replace('/*__CSS__*/', () => css)
  .replace('/*__JS__*/', () => js);

await mkdir(`${root}dist`, { recursive: true });
await writeFile(`${root}dist/playground.html`, html);
console.log(`engine ${(engineBytes / 1024).toFixed(1)} KB gzipped · playground ${(html.length / 1024).toFixed(1)} KB`);

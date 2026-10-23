/* Builds the playground as one self-contained HTML file, and measures the
   engine on its own (minified, gzipped) so the number on the page is real.

   dist/playground.html   the page body, for hosts that supply the document shell
   dist/site/index.html   a complete document, for GitHub Pages or any static host */

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

/* the page's title, metadata and styles come before its first element */
const split = html.indexOf('<div class="page">');
const site = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${html.slice(0, split).trim()}
</head>
<body>
${html.slice(split).trim()}
</body>
</html>
`;

await mkdir(`${root}dist/site`, { recursive: true });
await writeFile(`${root}dist/playground.html`, html);
await writeFile(`${root}dist/site/index.html`, site);
console.log(`engine ${(engineBytes / 1024).toFixed(1)} KB gzipped · playground ${(html.length / 1024).toFixed(1)} KB`);

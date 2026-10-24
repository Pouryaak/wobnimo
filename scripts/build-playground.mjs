/* Builds the playground as one self-contained HTML file, and measures the
   engine on its own (minified, gzipped) so the number on the page is real.

   dist/playground.html   the page body, for hosts that supply the document shell
   dist/site/index.html   a complete document, for GitHub Pages or any static host

   Images in apps/playground/public are copied next to both. */

import { build } from 'esbuild';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const root = new URL('..', import.meta.url).pathname;
const common = { bundle: true, minify: true, write: false, target: 'es2022', tsconfig: `${root}tsconfig.json`, legalComments: 'none' };

const engine = await build({ ...common, entryPoints: [`${root}packages/engine/src/index.ts`], format: 'esm' });
const engineBytes = gzipSync(engine.outputFiles[0].contents).length;

/* pull the cast and the states from source so llms.txt can't drift from the code */
const data = await build({ bundle: true, write: false, format: 'esm', target: 'es2022', tsconfig: `${root}tsconfig.json`, entryPoints: [`${root}scripts/_catalog.ts`] });
const { characters, states } = await import(`data:text/javascript;base64,${Buffer.from(data.outputFiles[0].text).toString('base64')}`);

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

const WHEN = {
  idle: 'waiting for the user',
  thinking: 'a request is sent, no reply yet',
  listening: 'the user is typing or talking',
  speaking: 'a reply is streaming in',
  sleeping: 'idle for a couple of minutes',
  working: 'running a tool, a build or a long task',
  error: 'something failed',
  surprised: 'an unexpected event',
  celebrating: 'a task finished, tests passed',
  sad: 'it could not help',
};
const kb = ((engineBytes / 1024).toFixed(1));
const llms = `# Wobnimo

> Ten animated mascots on one featherweight web animation engine (~${kb} KB gzipped, zero dependencies). Drop-in web component, first-class React wrapper, and agent-ready. Use it to give an app or AI assistant a face that reacts to what it is doing.

## Install

One tag, no build step:
\`\`\`html
<script type="module" src="https://cdn.jsdelivr.net/npm/wobnimo@0.1/dist/wobnimo.js"></script>
<wobnimo-mascot character="mochi" state="thinking"></wobnimo-mascot>
\`\`\`

With a bundler: \`npm i wobnimo\`
- React/Next: \`import { Mascot } from 'wobnimo/react'\` then \`<Mascot character="mochi" state="thinking" />\` (add "use client" in Next app-router files).
- Anywhere else: \`import 'wobnimo/element'\` then \`<wobnimo-mascot character="mochi" state="idle"></wobnimo-mascot>\`.
- In code: \`import { mount } from 'wobnimo'\`; \`import { mochi } from 'wobnimo/characters/mochi'\`; \`mount(el, mochi).setState('thinking')\`.

Import one character (~1.2 KB each) from \`wobnimo/characters/<id>\`, or the whole cast from \`wobnimo/characters\`.

## AI chat, one prop

With the Vercel AI SDK, pass the useChat \`status\` straight in; the mascot thinks, speaks, celebrates and errors for you:
\`\`\`tsx
const { status } = useChat();
<Mascot character="mochi" status={status} />
\`\`\`
With the element, set the \`status\` attribute to submitted | streaming | ready | error.

## Characters

${characters.map((c) => `- ${c.id} (${c.name}): ${c.tagline}`).join('\n')}

## States (set via the state prop/attribute or mascot.setState)

${states.map((s) => `- ${s}: ${WHEN[s] ?? ''}`).join('\n')}

## Customize

- Recolour by material name: \`palette={{ shell: '#e0457b' }}\` (React) or \`palette="shell:#e0457b"\` (attribute). Material names are per character.
- Make a variant or a new character from data with \`variant()\` and \`defineCharacter()\` from \`wobnimo\`.
- Draw a still (avatar, thumbnail) with \`snapshot(spec, { state, size })\`.

## Notes

- Unknown character or state names throw at runtime and list the valid ones.
- Honours prefers-reduced-motion, sleeps off-screen, shares one WebGL2 context across all mascots on a page.
- Live demo and copy-paste install: https://pouryaak.github.io/wobnimo/
`;

await mkdir(`${root}dist/site`, { recursive: true });
await writeFile(`${root}dist/playground.html`, html);
await writeFile(`${root}dist/site/index.html`, site);
/* images and other static files sit next to the page in both outputs */
await cp(`${root}apps/playground/public`, `${root}dist/site`, { recursive: true });
await cp(`${root}apps/playground/public`, `${root}dist`, { recursive: true });
await writeFile(`${root}dist/site/llms.txt`, llms);
await writeFile(`${root}dist/llms.txt`, llms);
console.log(`engine ${(engineBytes / 1024).toFixed(1)} KB gzipped · playground ${(html.length / 1024).toFixed(1)} KB`);

/* Builds the site's pages, each one self-contained HTML file, and measures
   the engine on its own (minified, gzipped) so the number on the page is real.

   dist/playground.html        the main page's body, for hosts that supply the document shell
   dist/site/index.html        the main page, a complete document for GitHub Pages or any static host
   dist/site/studio/index.html the studio, where a mascot is built from a sentence

   Images in apps/playground/public are copied next to both. The character
   stills there are rendered by `npm run posters`; the build stops if any
   of them is out of date. */

import { build } from 'esbuild';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const root = new URL('..', import.meta.url).pathname;
const common = { bundle: true, minify: true, write: false, target: 'es2022', tsconfig: `${root}tsconfig.json`, legalComments: 'none' };

const engine = await build({ ...common, entryPoints: [`${root}packages/engine/src/index.ts`], format: 'esm' });
const engineBytes = gzipSync(engine.outputFiles[0].contents).length;

/* pull the cast and the states from source so llms.txt can't drift from the code */
const data = await build({ bundle: true, write: false, format: 'esm', platform: 'node', target: 'es2022', tsconfig: `${root}tsconfig.json`, entryPoints: [`${root}scripts/_catalog.ts`] });
const { characters, states, posterKeys, specGzipAverage } = await import(`data:text/javascript;base64,${Buffer.from(data.outputFiles[0].text).toString('base64')}`);

/* every still must match the character as it is now */
const manifest = JSON.parse(await readFile(`${root}apps/playground/public/posters/manifest.json`, 'utf8').catch(() => '{}'));
const stale = Object.keys(posterKeys).filter((id) => manifest[id] !== posterKeys[id]);
if (stale.length) throw new Error(`Character stills are out of date for ${stale.join(', ')}. Run: npm run posters`);

/** One page: its script bundled, its styles and script inlined, and the
    document shell for static hosts. `base` is the way back to the site's
    root from where the page is served, for its fonts and images. */
async function page({ entry, template, styles, base = '' }) {
  const app = await build({
    ...common,
    entryPoints: [`${apps}${entry}`],
    format: 'iife',
    define: {
      __ENGINE_GZIP_BYTES__: String(engineBytes),
      __SPEC_GZIP_BYTES__: String(Math.round(specGzipAverage)),
      /* the key goes on each still's URL, so a re-rendered one is never served from an old cache */
      __POSTER_KEYS__: JSON.stringify(posterKeys),
      __ASSET_ROOT__: JSON.stringify(base),
      /* where the studio's brain lives (apps/studio-api); without it the studio runs its demo */
      __STUDIO_API__: JSON.stringify(process.env.STUDIO_API_URL ?? ''),
    },
  });
  const js = app.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const css = (await Promise.all(styles.map((f) => readFile(`${apps}${f}`, 'utf8')))).join('\n').replaceAll('url(fonts/', `url(${base}fonts/`);
  const body = (await readFile(`${apps}${template}`, 'utf8'))
    .replace('/*__CSS__*/', () => css)
    .replace('/*__JS__*/', () => js);

  /* the page's title, metadata and styles come before its first element */
  const split = body.indexOf('<div class="page');
  const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${body.slice(0, split).trim()}
</head>
<body>
${body.slice(split).trim()}
</body>
</html>
`;
  return { body, doc, bytes: js.length + css.length };
}

const apps = `${root}apps/playground/`;
const site = await page({ entry: 'src/main.ts', template: 'index.html', styles: ['src/shared/base.css', 'src/styles.css'] });
const studio = await page({ entry: 'src/studio/main.ts', template: 'studio.html', styles: ['src/shared/base.css', 'src/studio/studio.css'], base: '../' });

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

> Twenty animated mascots on one featherweight web animation engine (~${kb} KB gzipped, zero dependencies). Drop-in web component, first-class React wrapper, and agent-ready. Use it to give an app or AI assistant a face that reacts to what it is doing.

## Install

One tag, no build step:
\`\`\`html
<script type="module" src="https://cdn.jsdelivr.net/npm/wobnimo@0.2/dist/wobnimo.js"></script>
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

## Make your own character

A character is one TypeScript file exporting a CharacterSpec (plain data: materials, bones, SDF parts, paints, eyes, face, anchors, acting). To have an agent design one from a sentence:
1. \`npx wobnimo skill\` adds the wobnimo-mascot skill to .claude/skills and .agents/skills (or \`npx skills add Pouryaak/wobnimo\`). Read its SKILL.md and follow it.
2. \`npx wobnimo new <id>\` writes mascots/<id>.ts, a starter that passes every check.
3. \`npx wobnimo check <file>\` measures the real 3D shape and lists errors and warnings, each with the exact fix. Repeat until clean.
4. \`npx wobnimo preview <file>\` renders a contact sheet PNG (front, side, back, face close-up, every state, a 56px avatar); \`--live\` opens a preview that reloads on save.
5. Use it: \`<Mascot character={mySpec} />\`, \`element.spec = mySpec\`, or \`mount(el, mySpec)\`.
Skill source: https://github.com/Pouryaak/wobnimo/tree/main/skills/wobnimo-mascot

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
await mkdir(`${root}dist/site/studio`, { recursive: true });
await writeFile(`${root}dist/playground.html`, site.body);
await writeFile(`${root}dist/site/index.html`, site.doc);
await writeFile(`${root}dist/site/studio/index.html`, studio.doc);
/* images and other static files sit next to the page in both outputs */
await cp(`${root}apps/playground/public`, `${root}dist/site`, { recursive: true });
await cp(`${root}apps/playground/public`, `${root}dist`, { recursive: true });
await writeFile(`${root}dist/site/llms.txt`, llms);
await writeFile(`${root}dist/llms.txt`, llms);
console.log(`engine ${(engineBytes / 1024).toFixed(1)} KB gzipped · site ${(site.body.length / 1024).toFixed(1)} KB · studio ${(studio.doc.length / 1024).toFixed(1)} KB`);

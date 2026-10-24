import { defineConfig } from 'tsup';

/* One package, several entry points, so nobody pays for what they don't
   import. Everything from the workspace (@wobnimo/engine, /characters) is
   bundled in; React stays external and optional. The CDN file is a second
   build: one self-contained ES module for a <script type="module">. The
   CLI is a third: Node only, with the checker, which no browser entry
   carries. */

const entry = {
  index: 'src/index.ts',
  element: 'src/element.ts',
  react: 'src/react.tsx',
  'characters/index': 'src/characters/index.ts',
  'characters/volt': 'src/characters/volt.ts',
  'characters/pip': 'src/characters/pip.ts',
  'characters/mochi': 'src/characters/mochi.ts',
  'characters/boo': 'src/characters/boo.ts',
  'characters/inky': 'src/characters/inky.ts',
  'characters/miso': 'src/characters/miso.ts',
  'characters/tad': 'src/characters/tad.ts',
  'characters/pebble': 'src/characters/pebble.ts',
  'characters/rex': 'src/characters/rex.ts',
  'characters/microduck': 'src/characters/microduck.ts',
  'characters/drift': 'src/characters/drift.ts',
  'characters/cacti': 'src/characters/cacti.ts',
  'characters/latte': 'src/characters/latte.ts',
  'characters/bumble': 'src/characters/bumble.ts',
  'characters/swirl': 'src/characters/swirl.ts',
  'characters/ember': 'src/characters/ember.ts',
  'characters/cap': 'src/characters/cap.ts',
  'characters/berry': 'src/characters/berry.ts',
  'characters/bao': 'src/characters/bao.ts',
  'characters/hop': 'src/characters/hop.ts',
};

export default defineConfig([
  {
    entry,
    format: 'esm',
    dts: true,
    treeshake: true,
    /* no shared chunks: each entry stands alone, so importing one character
       pulls only that character's data, not all ten. The engine lives in the
       core entry; character specs are pure data and carry none of it. */
    splitting: false,
    clean: true,
    minify: true,
    external: ['react'],
    outExtension: () => ({ js: '.js' }),
  },
  {
    entry: { wobnimo: 'src/cdn.ts' },
    format: 'esm',
    dts: false,
    treeshake: true,
    minify: true,
    outExtension: () => ({ js: '.js' }),
  },
  {
    entry: { cli: 'src/cli/index.ts' },
    format: 'esm',
    platform: 'node',
    target: 'node20',
    dts: false,
    treeshake: true,
    minify: false,
    banner: { js: '#!/usr/bin/env node' },
    outExtension: () => ({ js: '.js' }),
  },
]);

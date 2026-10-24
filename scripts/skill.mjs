/* Keeps the mascot-design skill in step with the cast.

     node scripts/skill.mjs                  rewrite skills/wobnimo-mascot/examples from the characters
     node scripts/skill.mjs --copy <dir>     the same, then copy the whole skill to <dir>

   The examples are the characters' own source with the workspace import
   swapped for the published package, so an agent reads exactly what ships.
   The package build copies the skill in, which is how `npx wobnimo skill`
   finds it. */

import { cpSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'packages', 'characters', 'src');
const skill = join(root, 'skills', 'wobnimo-mascot');
const examples = join(skill, 'examples');

rmSync(examples, { recursive: true, force: true });
cpSync(source, examples, { recursive: true, filter: (p) => !p.endsWith('index.ts') });

for (const file of readdirSync(examples)) {
  const path = join(examples, file);
  const id = file.replace(/\.ts$/, '');
  const code = readFileSync(path, 'utf8').replaceAll("from '@wobnimo/engine'", "from 'wobnimo'");
  writeFileSync(path, `${code.trimEnd()}\n\nexport default ${id};\n`);
}

const at = process.argv.indexOf('--copy');
if (at > 0) {
  const dest = resolve(process.argv[at + 1] ?? 'skill');
  rmSync(dest, { recursive: true, force: true });
  cpSync(skill, dest, { recursive: true });
}

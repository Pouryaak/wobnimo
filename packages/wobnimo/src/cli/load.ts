/* Loading a spec file the way an agent writes one: a .ts or .js module
   that exports a CharacterSpec (default or named), or plain .json. */

import { readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { CharacterSpec } from '@wobnimo/engine';

export class LoadError extends Error {}

const looksLikeSpec = (v: unknown): v is CharacterSpec =>
  !!v && typeof v === 'object' && Array.isArray((v as CharacterSpec).parts) && typeof (v as CharacterSpec).materials === 'object';

/** The spec in `file`. `name` picks one export when a file has several. */
export async function loadSpec(file: string, name?: string): Promise<{ spec: CharacterSpec; path: string }> {
  const path = resolve(file);
  const ext = extname(path).toLowerCase();
  let exports: Record<string, unknown>;
  try {
    if (ext === '.json') {
      /* a JSON file is the spec itself; whatever is wrong with it, the checker says */
      const spec = JSON.parse(readFileSync(path, 'utf8'));
      if (spec && typeof spec === 'object' && !Array.isArray(spec)) return { spec, path };
      throw new LoadError(`${file} must hold one character spec as a JSON object.`);
    } else {
      /* a fresh URL each time, so a watcher sees edits instead of the module cache */
      exports = await import(`${pathToFileURL(path).href}?t=${Date.now()}`);
    }
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT' || (err.code === 'ERR_MODULE_NOT_FOUND' && String(err.message).includes(path))) throw new LoadError(`No file at ${path}.`);
    if (err.code === 'ERR_UNKNOWN_FILE_EXTENSION' && /\.[mc]?ts$/.test(ext)) throw new LoadError(TS_HELP);
    if (err instanceof SyntaxError && /\.[mc]?ts$/.test(ext) && !runsTypeScript()) throw new LoadError(`${err.message}\n${TS_HELP}`);
    if (err instanceof LoadError) throw err;
    throw new LoadError(`Could not load ${file}: ${err.message}`);
  }

  if (name) {
    if (!looksLikeSpec(exports[name])) throw new LoadError(`${file} has no character export named "${name}". Character exports: ${specExports(exports).join(', ') || 'none'}.`);
    return { spec: exports[name] as CharacterSpec, path };
  }
  if (looksLikeSpec(exports.default)) return { spec: exports.default, path };
  const found = specExports(exports);
  if (found.length === 1) return { spec: exports[found[0]] as CharacterSpec, path };
  if (found.length > 1) throw new LoadError(`${file} exports several characters (${found.join(', ')}). Pick one with --export <name>.`);
  throw new LoadError(`${file} does not export a character spec. End the file with \`export default <yourCharacter>;\`.`);
}

function specExports(exports: Record<string, unknown>): string[] {
  return Object.keys(exports).filter((k) => k !== 'default' && looksLikeSpec(exports[k]));
}

const TS_HELP = `This version of Node (${process.versions.node}) cannot run TypeScript files directly.
Use Node 22.18 or newer, or save the spec as .mjs (same code without type annotations) or .json.
Type-only imports must say so: \`import type { CharacterSpec } from 'wobnimo'\`.`;

const [major, minor] = process.versions.node.split('.').map(Number);
const stripsByDefault = major > 23 || (major === 23 && minor >= 6) || (major === 22 && minor >= 18);
const stripsWithFlag = major > 22 || (major === 22 && minor >= 6);
const flagged = () => process.execArgv.some((a) => a.includes('strip-types')) || !!process.env.NODE_OPTIONS?.includes('strip-types');

function runsTypeScript(): boolean {
  return stripsByDefault || (stripsWithFlag && flagged());
}

/** Node 22.6–22.17 can run TypeScript behind a flag; newer versions do it by default. */
export function needsTypeStripFlag(file: string): boolean {
  return /\.[mc]?ts$/i.test(file) && !stripsByDefault && stripsWithFlag && !flagged();
}

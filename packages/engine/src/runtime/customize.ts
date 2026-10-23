/* Making a character your own without writing a spec from scratch. Every
   helper returns a new spec and leaves the original alone, so the
   compiler's cache keeps working and the cast stays reusable. */

import type { CompiledCharacter } from '../compiler/compile';
import { linear } from '../spec/color';
import type { CharacterSpec, Hex } from '../spec/types';

/** New colours for materials, by name. Unknown names are an error, so typos don't fail silently. */
export type Palette = Record<string, Hex>;

const HEX = /^#[0-9a-f]{6}$/i;

function check(id: string, names: string[], name: string, color: string) {
  if (!names.includes(name)) throw new Error(`${id}: palette names material "${name}". Materials are: ${names.join(', ')}.`);
  if (!HEX.test(color)) throw new Error(`${id}: palette colour for "${name}" must look like #rrggbb, got "${color}".`);
}

/** A copy of the spec with new material colours. */
export function recolor(spec: CharacterSpec, palette: Palette): CharacterSpec {
  const materials = { ...spec.materials };
  const names = Object.keys(materials);
  for (const [name, color] of Object.entries(palette)) {
    check(spec.id, names, name, color);
    materials[name] = { ...materials[name], color };
  }
  return { ...spec, materials };
}

/**
 * The compiled character's colours with a palette applied, ready for the
 * renderer. Colours are uniforms, so this is how a live mascot recolours
 * without building a new shader.
 */
export function albedo(character: CompiledCharacter, palette: Palette | undefined): Float32Array {
  const out = character.albedo.slice();
  if (!palette) return out;
  for (const [name, color] of Object.entries(palette)) {
    check(character.spec.id, character.materials, name, color);
    out.set(linear(color), character.materials.indexOf(name) * 3);
  }
  return out;
}

/**
 * A new character from an existing one: a different id and name, colours,
 * temperament, or anything else at the top level of the spec.
 */
export function variant(
  spec: CharacterSpec,
  changes: Partial<Omit<CharacterSpec, 'materials'>> & { palette?: Palette },
): CharacterSpec {
  const { palette, ...rest } = changes;
  const next: CharacterSpec = { ...spec, ...rest, motion: { ...spec.motion, ...rest.motion } };
  return palette ? recolor(next, palette) : next;
}

/** Identity, typed: write a spec with full autocompletion and checking. */
export const defineCharacter = (spec: CharacterSpec): CharacterSpec => spec;

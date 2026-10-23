/* Making a character your own without writing a spec from scratch. Every
   helper returns a new spec and leaves the original alone, so the
   compiler's cache keeps working and the cast stays reusable. */

import type { CompiledCharacter } from '../compiler/compile';
import { hex, linear } from '../spec/color';
import type { CharacterSpec, Hex, Vec3 } from '../spec/types';

/** New colours for materials, by name. Unknown names are an error, so typos don't fail silently. */
export type Palette = Record<string, Hex>;

const HEX = /^#[0-9a-f]{6}$/i;

function check(id: string, names: string[], name: string, color: string) {
  if (!names.includes(name)) throw new Error(`${id}: palette names material "${name}". Materials are: ${names.join(', ')}.`);
  if (!HEX.test(color)) throw new Error(`${id}: palette colour for "${name}" must look like #rrggbb, got "${color}".`);
}

/**
 * The palette with every shade filled in: a material that is a `shadeOf`
 * a recoloured one takes the new colour, scaled by how it differed from
 * the original. Entries the palette names itself always win.
 */
function expand(spec: CharacterSpec, palette: Palette): Map<string, Vec3> {
  const names = Object.keys(spec.materials);
  const out = new Map<string, Vec3>();
  for (const [name, color] of Object.entries(palette)) {
    check(spec.id, names, name, color);
    out.set(name, linear(color));
  }
  for (const [name, m] of Object.entries(spec.materials)) {
    const base = m.shadeOf;
    if (!base || out.has(name) || !(base in palette)) continue;
    const from = linear(spec.materials[base].color);
    const own = linear(m.color);
    const to = out.get(base)!;
    out.set(name, [0, 1, 2].map((k) => Math.min(1, from[k] > 1e-3 ? (to[k] * own[k]) / from[k] : own[k])) as Vec3);
  }
  return out;
}

/** A copy of the spec with new material colours (and their shades). */
export function recolor(spec: CharacterSpec, palette: Palette): CharacterSpec {
  const materials = { ...spec.materials };
  for (const [name, color] of expand(spec, palette)) {
    materials[name] = { ...materials[name], color: name in palette ? palette[name] : hex(color) };
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
  for (const [name, color] of expand(character.spec, palette)) out.set(color, character.materials.indexOf(name) * 3);
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

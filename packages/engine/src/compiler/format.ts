/* Turning numbers into GLSL literals. */

import type { Vec2, Vec3 } from '../spec/types';
import { fromEuler, mat4 } from '../math/mat4';

export const f = (n: number) => {
  const s = Number(n.toFixed(5)).toString();
  return s.includes('.') || s.includes('e') ? s : `${s}.0`;
};
export const v2 = (v: Vec2) => `vec2(${f(v[0])}, ${f(v[1])})`;
export const v3 = (v: Vec3) => `vec3(${f(v[0])}, ${f(v[1])}, ${f(v[2])})`;

/** The inverse of a part's rotation (its transpose), as a GLSL mat3 literal. */
export function inverseRotation(rot: Vec3): string {
  const m = fromEuler(mat4(), rot[0], rot[1], rot[2]);
  /* column-major mat3 of the transpose: column c is row c of m */
  const cols = [0, 1, 2].map((c) => [m[c], m[4 + c], m[8 + c]]);
  return `mat3(${cols.flat().map(f).join(', ')})`;
}

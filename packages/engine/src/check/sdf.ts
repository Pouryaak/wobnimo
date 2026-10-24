/* The CPU twin of the shader's distance functions (glsl/prelude.ts), so a
   spec can be measured without a GPU: in Node, in a CLI, in a test. They
   must stay in step with the GLSL; every one is the same formula. */

import type { PartSpec, Vec3 } from '../spec/types';

const len2 = (x: number, y: number) => Math.hypot(x, y);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function sdEllipsoid(p: Vec3, r: Vec3): number {
  const k0 = Math.hypot(p[0] / r[0], p[1] / r[1], p[2] / r[2]);
  const k1 = Math.hypot(p[0] / (r[0] * r[0]), p[1] / (r[1] * r[1]), p[2] / (r[2] * r[2]));
  return (k0 * (k0 - 1)) / Math.max(k1, 1e-6);
}

export function sdRoundBox(p: Vec3, b: Vec3, r: number): number {
  const qx = Math.abs(p[0]) - b[0] + r, qy = Math.abs(p[1]) - b[1] + r, qz = Math.abs(p[2]) - b[2] + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
}

export function sdCapsule(p: Vec3, a: Vec3, b: Vec3, r: number): number {
  const pa = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const ba = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const h = clamp((pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2]) / (ba[0] * ba[0] + ba[1] * ba[1] + ba[2] * ba[2] || 1e-9), 0, 1);
  return Math.hypot(pa[0] - ba[0] * h, pa[1] - ba[1] * h, pa[2] - ba[2] * h) - r;
}

export function sdRoundCone(p: Vec3, a: Vec3, b: Vec3, r1: number, r2: number): number {
  const ba = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const l2 = ba[0] * ba[0] + ba[1] * ba[1] + ba[2] * ba[2] || 1e-9;
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const pa = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const y = pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2];
  const z = y - l2;
  const xv = [pa[0] * l2 - ba[0] * y, pa[1] * l2 - ba[1] * y, pa[2] * l2 - ba[2] * y];
  const x2 = xv[0] * xv[0] + xv[1] * xv[1] + xv[2] * xv[2];
  const y2 = y * y * l2;
  const z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
  return (Math.sqrt((x2 * a2 * il2)) + y * rr) * il2 - r1;
}

/** Along y, with rounded rims. */
export function sdCylinder(p: Vec3, r: number, h: number, rr: number): number {
  const dx = len2(p[0], p[2]) - r + rr;
  const dy = Math.abs(p[1]) - h + rr;
  return Math.min(Math.max(dx, dy), 0) + len2(Math.max(dx, 0), Math.max(dy, 0)) - rr;
}

function sdRoundRect(x: number, y: number, b: [number, number], r: number): number {
  const qx = Math.abs(x) - b[0] + r, qy = Math.abs(y) - b[1] + r;
  return len2(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

export function sdFrame(p: Vec3, b: [number, number], corner: number, w: number, depth: number): number {
  const ring = Math.abs(sdRoundRect(p[0], p[1], b, corner)) - w;
  const ez = Math.abs(p[2]) - depth;
  return Math.min(Math.max(ring, ez), 0) + len2(Math.max(ring, 0), Math.max(ez, 0));
}

export function sdPlate(p: Vec3, b: [number, number], corner: number, depth: number): number {
  const e = sdRoundRect(p[0], p[1], b, corner);
  const ez = Math.abs(p[2]) - depth;
  return Math.min(Math.max(e, ez), 0) + len2(Math.max(e, 0), Math.max(ez, 0));
}

export function smin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

export const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);

/** A solid part's distance in its own space, before clipping. Hems are not solids and return Infinity. */
export function partDistance(part: PartSpec, l: Vec3): number {
  switch (part.shape) {
    case 'sphere':
      return Math.hypot(l[0], l[1], l[2]) - part.radius;
    case 'ellipsoid':
      return sdEllipsoid(l, part.radii);
    case 'roundBox':
      return sdRoundBox(l, part.half, part.round);
    case 'capsule':
      return sdCapsule(l, part.from, part.to, part.radius);
    case 'roundCone':
      return sdRoundCone(l, part.from, part.to, part.r1, part.r2);
    case 'cylinder':
      return sdCylinder(l, part.radius, part.half, part.round);
    case 'frame':
      return sdFrame(l, part.half, part.corner, part.width, part.depth);
    case 'plate':
      return sdPlate(l, part.half, part.corner, part.depth);
    case 'hem':
      return Infinity;
  }
}

/** A box around the part in its own space, as [min, max], for sampling its surface. */
export function partBox(part: PartSpec): [Vec3, Vec3] | null {
  const sym = (x: number, y: number, z: number): [Vec3, Vec3] => [[-x, -y, -z], [x, y, z]];
  const seg = (a: Vec3, b: Vec3, r: number): [Vec3, Vec3] => [
    [Math.min(a[0], b[0]) - r, Math.min(a[1], b[1]) - r, Math.min(a[2], b[2]) - r],
    [Math.max(a[0], b[0]) + r, Math.max(a[1], b[1]) + r, Math.max(a[2], b[2]) + r],
  ];
  switch (part.shape) {
    case 'sphere':
      return sym(part.radius, part.radius, part.radius);
    case 'ellipsoid':
      return sym(...part.radii);
    case 'roundBox':
      return sym(...part.half);
    case 'capsule':
      return seg(part.from, part.to, part.radius);
    case 'roundCone':
      return seg(part.from, part.to, Math.max(part.r1, part.r2));
    case 'cylinder':
      return sym(part.radius, part.half, part.radius);
    case 'frame':
      return sym(part.half[0] + part.width, part.half[1] + part.width, part.depth);
    case 'plate':
      return sym(part.half[0], part.half[1], part.depth);
    case 'hem':
      return null;
  }
}

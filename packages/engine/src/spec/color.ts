import type { Hex, Vec3 } from './types';

/** `#rrggbb` (sRGB) to linear light, which is what the shader lights in. */
export function linear(hex: Hex): Vec3 {
  const n = parseInt(hex.replace('#', ''), 16);
  const c = (v: number) => Math.pow(v / 255, 2.2);
  return [c((n >> 16) & 255), c((n >> 8) & 255), c(n & 255)];
}

/** Linear light back to `#rrggbb`. */
export function hex(c: Vec3): Hex {
  return `#${c.map((v) => Math.round(Math.pow(Math.min(Math.max(v, 0), 1), 1 / 2.2) * 255).toString(16).padStart(2, '0')).join('')}`;
}

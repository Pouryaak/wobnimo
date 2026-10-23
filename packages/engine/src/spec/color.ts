import type { Hex, Vec3 } from './types';

/** `#rrggbb` (sRGB) to linear light, which is what the shader lights in. */
export function linear(hex: Hex): Vec3 {
  const n = parseInt(hex.replace('#', ''), 16);
  const c = (v: number) => Math.pow(v / 255, 2.2);
  return [c((n >> 16) & 255), c((n >> 8) & 255), c(n & 255)];
}

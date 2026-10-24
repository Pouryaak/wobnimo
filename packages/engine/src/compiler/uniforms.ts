/* The contract between the runtime and every compiled shader. One list,
   so the GLSL header and the renderer's uniform lookups cannot drift. */

import { MAX_PARTICLES } from '../behavior/fx';

export const UNIFORMS = {
  uResolution: 'vec2',
  uTime: 'float',
  /** Camera: target height, distance, tan(fov / 2), pitch. */
  uCamera: 'vec4',
  /** Bounding sphere: centre, radius. */
  uBound: 'vec4',
  /** World → bone space for every bone, root first. */
  uBones: 'mat4[]',
  /** The root's smallest scale, which keeps squashed distances conservative. */
  uScaleFix: 'float',
  /** blink, lid, squint, smile */
  uFaceA: 'vec4',
  /** talk, gaze x, gaze y, lid tilt */
  uFaceB: 'vec4',
  /** state, previous state, cross-fade, glitch */
  uFaceC: 'vec4',
  /** seconds in the state, mouth roundness */
  uFaceD: 'vec4',
  /** The state's light, for bulbs and lamps. */
  uGlow: 'vec3',
  uShadow: 'vec3',
  /** Strength of the floor shadow and light pool; 0 leaves no floor at all. */
  uFloor: 'float',
  /** How far the root is above the floor. */
  uLift: 'float',
  /** How strongly the state's light pools on the floor. */
  uGlowPool: 'float',
  uExposure: 'float',
  /** Every material's base colour, linear RGB, so recolouring needs no recompile. */
  uAlbedo: 'vec3[materials]',
  /** Effect particles: position + size; glyph, alpha, rotation, glow; colour, seed. */
  uFxA: 'vec4[fx]',
  uFxB: 'vec4[fx]',
  uFxC: 'vec4[fx]',
  uFxCount: 'int',
  /** Parts shown, face on, paints on: only read by shaders compiled with `reveal`. */
  uReveal: 'vec3',
} as const;

export type UniformName = keyof typeof UNIFORMS;

export function uniformHeader(boneCount: number, materialCount: number): string {
  return Object.entries(UNIFORMS)
    .map(([name, type]) => {
      if (type === 'mat4[]') return `uniform mat4 ${name}[${boneCount}];`;
      if (type === 'vec3[materials]') return `uniform vec3 ${name}[${Math.max(1, materialCount)}];`;
      if (type === 'vec4[fx]') return `uniform vec4 ${name}[${MAX_PARTICLES}];`;
      return `uniform ${type} ${name};`;
    })
    .join('\n');
}

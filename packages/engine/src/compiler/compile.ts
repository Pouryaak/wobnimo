/* Spec → shader. Each character gets a fragment shader specialised to its
   own body: its parts become straight-line distance code with constants
   baked in, so the GPU runs no interpreter and no loops over a scene. */

import { linear } from '../spec/color';
import type { CharacterSpec } from '../spec/types';
import { emitMap } from './emit-map';
import { emitMaterials } from './emit-materials';
import { LIGHTING } from './glsl/lighting';
import { MAIN } from './glsl/main';
import { PARTICLES } from './glsl/particles';
import { PRELUDE } from './glsl/prelude';
import { SCREEN_FACE } from './glsl/screen-face';
import type { BoneActing } from '../rig/rig';
import type { Vec3 } from '../spec/types';
import { resolve, type ResolvedBone } from './resolve';
import { uniformHeader } from './uniforms';

export interface CompiledCharacter {
  spec: CharacterSpec;
  bones: ResolvedBone[];
  acting: BoneActing;
  anchors: Record<string, { bone: number; at: Vec3 }>;
  fragment: string;
  /** Material names, in the order of their colours in `albedo`. */
  materials: string[];
  /** The spec's material colours, linear RGB, three floats each. */
  albedo: Float32Array;
  stats: { parts: number; bones: number; materials: number; shaderLines: number };
}

export const VERTEX_SHADER = /* glsl */ `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export function compile(spec: CharacterSpec): CompiledCharacter {
  const r = resolve(spec);
  const fragment = [
    '#version 300 es',
    'precision highp float;',
    'precision highp int;',
    uniformHeader(r.bones.length, r.materials.length),
    'out vec4 fragColor;',
    /* the size of a pixel at the current hit, for antialiasing painted detail */
    'float gPixel = 0.001;',
    /* a zero the compiler cannot see through, so loops calling map() are not unrolled */
    '#define ZERO (min(int(uTime), 0))',
    PRELUDE,
    emitMap(r),
    LIGHTING,
    spec.face?.kind === 'screen' ? SCREEN_FACE : '',
    emitMaterials(r),
    PARTICLES,
    MAIN,
  ].join('\n');

  return {
    spec,
    bones: r.bones,
    acting: r.acting,
    anchors: r.anchors,
    fragment,
    materials: r.materials.map((m) => m.name),
    albedo: new Float32Array(r.materials.flatMap((m) => linear(m.spec.color))),
    stats: {
      parts: spec.parts.length + (spec.eyes ? 2 : 0),
      bones: r.bones.length,
      materials: r.materials.length,
      shaderLines: fragment.split('\n').length,
    },
  };
}

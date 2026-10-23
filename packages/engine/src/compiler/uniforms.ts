/* The contract between the runtime and every compiled shader. One list,
   so the GLSL header and the renderer's uniform lookups cannot drift. */

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
  /** seconds in the state */
  uFaceD: 'vec4',
  /** The state's light, for bulbs and lamps. */
  uGlow: 'vec3',
  uShadow: 'vec3',
  /** How far the root is above the floor. */
  uLift: 'float',
  uExposure: 'float',
} as const;

export type UniformName = keyof typeof UNIFORMS;

export function uniformHeader(boneCount: number): string {
  return Object.entries(UNIFORMS)
    .map(([name, type]) =>
      type === 'mat4[]' ? `uniform mat4 ${name}[${boneCount}];` : `uniform ${type} ${name};`,
    )
    .join('\n');
}

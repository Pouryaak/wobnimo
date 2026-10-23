/* The public API. Most apps need only `mount` (or the <wobnimo-mascot>
   element) and a character; the rest is for building characters and
   for other renderers. */

export { Mascot, mount, compileCached, type MascotOptions, type MascotEvents } from './runtime/mascot';
export { defineMascotElement } from './runtime/element';
export { recolor, albedo, variant, defineCharacter, type Palette } from './runtime/customize';
export { STATES, EXPRESSIONS, type MascotState } from './behavior/states';
export { compile, type CompiledCharacter } from './compiler/compile';
export { SpecError } from './compiler/resolve';
export { Brain, type Pose, type BeatEvent } from './behavior/brain';
export { DEFAULT_FX, Fx } from './behavior/fx';
export { Rig } from './rig/rig';
export type { Renderer, Frame } from './render/renderer';
export { WebGL2Renderer } from './render/webgl2';
export type * from './spec/types';

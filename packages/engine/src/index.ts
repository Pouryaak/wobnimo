export { Mascot, compileCached, type MascotOptions } from './runtime/mascot';
export { compile, type CompiledCharacter } from './compiler/compile';
export { SpecError } from './compiler/resolve';
export { STATES, type MascotState } from './behavior/states';
export { Brain, type Pose } from './behavior/brain';
export { Rig } from './rig/rig';
export type { Renderer, Frame } from './render/renderer';
export { WebGL2Renderer } from './render/webgl2';
export type * from './spec/types';

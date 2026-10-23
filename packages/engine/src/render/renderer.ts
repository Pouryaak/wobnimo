/* What the runtime needs from a GPU backend. WebGL2 is the only one
   today; a WebGPU backend implements the same interface and can take the
   same compiled characters once the compiler also emits WGSL. */

import type { Pose } from '../behavior/brain';
import type { Fx } from '../behavior/fx';
import type { CompiledCharacter } from '../compiler/compile';
import type { Vec3 } from '../spec/types';

export interface Frame {
  pose: Pose;
  bones: Float32Array;
  fx: Fx;
  /** Material colours, laid out like `CompiledCharacter.albedo`. */
  albedo: Float32Array;
  time: number;
  /** Device pixels. */
  width: number;
  height: number;
  shadow: Vec3;
  exposure: number;
}

export interface Renderer {
  /** Compiles (or reuses) the character's program; cheap to call again with the same character. */
  load(character: CompiledCharacter): void;
  render(frame: Frame): void;
  dispose(): void;
}

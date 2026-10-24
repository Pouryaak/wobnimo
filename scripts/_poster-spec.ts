/* How the site's character stills are drawn, shared by the script that
   renders them (posters.mjs) and the build that checks they're current. */
import { compile, type CharacterSpec, type SnapshotOptions } from '@wobnimo/engine';

/** Cast posters are 240 CSS px; drawn at 2x, so they stay sharp on every screen. */
export const POSTER_SIZE = 240;
export const POSTER_RATIO = 2;
/** Studio avatars: 68 CSS px, at 2x. */
export const FACE_SIZE = 136;

export function posterOptions(index: number): SnapshotOptions {
  return { size: POSTER_SIZE, pixelRatio: POSTER_RATIO, seed: 0.4 + index * 0.07, framing: 1.04 };
}

/** Everything a still depends on: the spec, the shader the engine builds for it, and how it is shot. */
export function posterInput(spec: CharacterSpec, index: number): string {
  return JSON.stringify([spec, compile(spec).fragment, posterOptions(index), FACE_SIZE]);
}

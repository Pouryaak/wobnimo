/* A still of a character: for avatars, thumbnails, posters and pickers.
   It settles the character into a state and draws one frame, with no
   animation loop left running and nothing added to the page, so a gallery
   of stills costs nothing once it's drawn. */

import { Brain } from '../behavior/brain';
import { Fx } from '../behavior/fx';
import type { MascotState } from '../behavior/states';
import { fromEuler, mat4, multiply } from '../math/mat4';
import { rng } from '../math/scalar';
import { WebGL2Renderer } from '../render/webgl2';
import { Rig } from '../rig/rig';
import type { CharacterSpec } from '../spec/types';
import { albedo, type Palette } from './customize';
import { compileCached } from './mascot';

export interface SnapshotOptions {
  state?: MascotState;
  /** CSS pixels, square. Default 256. */
  size?: number;
  /** Device pixels per CSS pixel. Default the screen's, at most 2. */
  pixelRatio?: number;
  framing?: number;
  /** Strength of the floor shadow, 0–1. Default 1. */
  floor?: number;
  palette?: Palette;
  seed?: number;
  /** Turns the character about its vertical axis, in radians: π/2 shows its left side, π its back. */
  turn?: number;
  /** How long the state has been held when the picture is taken, in seconds. Default 1.5. */
  settle?: number;
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/** Draws the character once onto a new canvas, resolving when the frame is there. */
export async function snapshot(spec: CharacterSpec, options: SnapshotOptions = {}): Promise<HTMLCanvasElement> {
  const ratio = options.pixelRatio ?? Math.min(devicePixelRatio || 1, 2);
  const size = Math.max(1, Math.round((options.size ?? 256) * ratio));
  const canvas = document.createElement('canvas');
  const character = compileCached(spec);
  const renderer = new WebGL2Renderer(canvas);
  renderer.load(character);

  /* let the springs settle where the state puts them, the way a mascot does with reduced motion */
  const brain = new Brain(spec.motion, options.seed ?? 0.5);
  brain.setState(options.state ?? 'idle');
  for (let i = 0, n = Math.round((options.settle ?? 1.5) * 60); i < n; i++) brain.update(1 / 60);
  const pose = brain.pose;
  if (options.turn) multiply(pose.root, fromEuler(mat4(), 0, options.turn, 0), pose.root);
  const rig = new Rig(character.bones, character.acting);
  rig.update(pose.root, pose.channels, pose.weights, 0, 0);
  const fx = new Fx(character, rng(0));
  fx.count = 0;

  const frame = {
    pose,
    bones: rig.inverse,
    fx,
    albedo: albedo(character, options.palette),
    time: 0,
    width: size,
    height: size,
    shadow: [0.05, 0.06, 0.12] as [number, number, number],
    floor: options.floor ?? 1,
    exposure: 1,
    framing: options.framing ?? 1,
  };
  while (!renderer.render(frame)) await nextFrame();
  renderer.dispose();
  return canvas;
}

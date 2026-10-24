import type { CharacterSpec } from '@wobnimo/engine';

/** A chubby panda. */
export const bao: CharacterSpec = {
  id: 'bao',
  name: 'Bao',
  tagline: 'A chubby panda cub: round ears, eye patches, and a belly made for sitting',
  accent: '#2f3b4c',
  frame: { target: 0.46, radius: 0.62 },
  bound: { y: 0.45, radius: 0.57 },
  motion: { hop: 0.1, squash: 1.2, snap: 0.9, talkSquash: 0.4 },
  materials: {
    white: { color: '#f6f3ec', f0: 0.03, spec: 0.4, shininess: 20, rim: 1, sheen: 0.6, surface: { kind: 'fur', scale: 100, strength: 0.3, bone: 'head' } },
    whiteBody: { color: '#f6f3ec', shadeOf: 'white', f0: 0.03, spec: 0.4, shininess: 20, rim: 1, sheen: 0.6, surface: { kind: 'fur', scale: 100, strength: 0.3 } },
    black: { color: '#26252b', f0: 0.03, spec: 0.4, shininess: 20, rim: 0.9, sheen: 0.6, surface: { kind: 'fur', scale: 100, strength: 0.3 } },
    nose: { color: '#1b1a1f', f0: 0.06, spec: 1.8, shininess: 200, rim: 0.3, gloss: 0.9 },
  },
  bones: [
    { name: 'body', pivot: [0, 0, 0], drive: { ry: [['yaw', 0.2]], rz: [['roll', 0.35]] }, wave: { rz: [0.02, 0.5, 0] } },
    { name: 'head', parent: 'body', pivot: [0, 0.48, 0.02], drive: { rx: [['pitch', -1]], ry: [['yaw', 0.8]], rz: [['roll', 0.7]] } },
    { name: 'armL', parent: 'body', pivot: [-0.22, 0.38, 0.06], rest: { rz: -0.4 }, drive: { rz: [['flap', -1]] } },
    { name: 'armR', parent: 'body', pivot: [0.22, 0.38, 0.06], rest: { rz: 0.4 }, drive: { rz: [['flap', 1]] } },
  ],
  parts: [
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.26, 0], radii: [0.29, 0.27, 0.26], material: 'whiteBody' },
    /* sitting legs, black, out front */
    { bone: 'body', shape: 'ellipsoid', at: [-0.15, 0.08, 0.14], radii: [0.1, 0.08, 0.12], blend: 0.05, material: 'black' },
    { bone: 'body', shape: 'ellipsoid', at: [0.15, 0.08, 0.14], radii: [0.1, 0.08, 0.12], blend: 0.05, material: 'black' },
    /* a black band over the shoulders */
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.42, -0.01], radii: [0.27, 0.07, 0.24], blend: 0.05, material: 'black' },
    { bone: 'armL', shape: 'capsule', from: [0, 0, 0], to: [-0.04, -0.16, 0.06], radius: 0.07, blend: 0.04, material: 'black' },
    { bone: 'armR', shape: 'capsule', from: [0, 0, 0], to: [0.04, -0.16, 0.06], radius: 0.07, blend: 0.04, material: 'black' },
    /* a big round head and round ears */
    { bone: 'head', shape: 'ellipsoid', at: [0, 0.14, 0], radii: [0.28, 0.24, 0.24], blend: 0.1, material: 'white' },
    { bone: 'head', shape: 'ellipsoid', at: [0, 0.06, 0.18], radii: [0.1, 0.07, 0.08], blend: 0.06, material: 'white' },
    { bone: 'head', shape: 'ellipsoid', at: [0, 0.09, 0.26], radii: [0.035, 0.022, 0.02], material: 'nose' },
    { bone: 'head', shape: 'sphere', at: [-0.2, 0.33, -0.02], radius: 0.075, blend: 0.03, material: 'black' },
    { bone: 'head', shape: 'sphere', at: [0.2, 0.33, -0.02], radius: 0.075, blend: 0.03, material: 'black' },
  ],
  paints: [
    /* droopy eye patches */
    { bone: 'head', on: ['white'], kind: 'ellipse', at: [-0.1, 0.15, 0.2], radii: [0.06, 0.08], color: '#26252b', soft: 0.2 },
    { bone: 'head', on: ['white'], kind: 'ellipse', at: [0.1, 0.15, 0.2], radii: [0.06, 0.08], color: '#26252b', soft: 0.2 },
    { bone: 'head', on: ['white'], kind: 'sphere', at: [-0.17, 0.05, 0.18], radius: 0.04, color: '#ffb3c1', soft: 0.6, opacity: 0.7 },
    { bone: 'head', on: ['white'], kind: 'sphere', at: [0.17, 0.05, 0.18], radius: 0.04, color: '#ffb3c1', soft: 0.6, opacity: 0.7 },
  ],
  eyes: { kind: 'ball', bone: 'head', at: [[-0.095, 0.16, 0.21], [0.095, 0.16, 0.21]], radius: 0.04, iris: '#3a2a20', irisSize: 0.7, pupilSize: 0.5, lid: 'black' },
  face: { kind: 'mouth', bone: 'head', on: ['white'], at: [0, 0.035, 0.25], width: 0.04, color: '#26252b', tongue: '#ff8fa3' },
  anchors: {
    top: { bone: 'head', at: [0.15, 0.45, 0.05] },
    mouth: { bone: 'head', at: [0, 0.035, 0.27] },
    ear: { bone: 'head', at: [-0.22, 0.33, 0] },
    feet: { bone: 'root', at: [0, 0.02, 0.18] },
  },
  acting: {
    idle: { armL: { rz: [0, 0.05, 0.5, 0] } },
    thinking: { armR: { rz: 1.5, rx: -1.2, ry: -0.4 }, head: { rz: 0.1 } },
    listening: { armL: { rz: -0.6, rx: -0.4 } },
    speaking: { armL: { rz: [-0.2, 0.2, 1.2, 0] }, armR: { rz: [0.2, 0.2, 1.2, 1.4] } },
    sleeping: { head: { rx: 0.25, rz: 0.15 } },
    working: { armL: { rx: [-0.8, 0.2, 5, 0] }, armR: { rx: [-0.8, 0.2, 5, Math.PI] } },
    error: { armL: { rz: -1.6, rx: -0.6 }, armR: { rz: 1.6, rx: -0.6 } },
    surprised: { armL: { rz: -1.1 }, armR: { rz: 1.1 } },
    celebrating: { armL: { rz: [-2.2, 0.3, 4, 0] }, armR: { rz: [2.2, 0.3, 4, Math.PI] } },
    sad: { head: { rx: 0.3 }, armL: { rz: 0.1 }, armR: { rz: -0.1 } },
    happy: { armL: { rz: [-1.5, 0.3, 3, 0] }, armR: { rz: [1.5, 0.3, 3, 1] } },
  },
  fx: {
    happy: [{ glyph: 'heart', anchor: 'top', rate: 1.2, velocity: [0, 0.22, 0.04], jitter: 0.1, life: [1, 1.3], size: [0.04, 0.06], color: '#ff86b0' }],
  },
};

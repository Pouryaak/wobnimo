import type { BoneSpec, CharacterSpec, PartSpec } from '@wobnimo/engine';

/* The cloud is a cluster of puffs. Each one sits on its own soft spring, so
   the whole cloud wobbles a little out of step with itself. */
const PUFFS: Array<{ at: [number, number, number]; radius: number }> = [
  { at: [-0.29, 0.36, -0.02], radius: 0.2 },
  { at: [0.3, 0.35, -0.02], radius: 0.19 },
  { at: [-0.15, 0.6, -0.03], radius: 0.21 },
  { at: [0.14, 0.63, -0.05], radius: 0.19 },
  { at: [0.0, 0.7, -0.12], radius: 0.16 },
  { at: [-0.13, 0.22, 0.06], radius: 0.16 },
  { at: [0.14, 0.22, 0.06], radius: 0.16 },
  { at: [0.0, 0.42, -0.2], radius: 0.24 },
];

/** A little rain cloud: a soft cluster of puffs that floats, glows from inside and rains when it's sad. */
export const nimbus: CharacterSpec = {
  id: 'nimbus',
  name: 'Nimbus',
  tagline: 'A floating cloud made of wobbling puffs, lit from inside; it rains when it is sad and crackles when it errors',
  accent: '#7aa7ff',
  frame: { target: 0.66, radius: 0.74 },
  bound: { y: 0.44, radius: 0.66 },
  motion: { float: 0.2, hop: 0.1, squash: 1.3, snap: 0.85, look: 0.7, talkSquash: 0.55 },
  materials: {
    /* vapour: bright, soft and lit through, with a lumpy, rippled surface */
    cloud: {
      color: '#f6f8ff', f0: 0.02, spec: 0.2, shininess: 10, rim: 1, sheen: 0.45, gloss: 0.1, sss: 0.75, sssColor: '#cfe0ff',
      surface: { kind: 'ripple', scale: 13, strength: 0.4 },
    },
    eye: { color: '#26304a', f0: 0.08, spec: 2.2, shininess: 300, rim: 0.2, gloss: 0.95 },
  },
  bones: [
    { name: 'body', pivot: [0, 0.3, 0], drive: { ry: [['yaw', 0.35]], rz: [['roll', 0.4]], rx: [['pitch', -0.5]] } },
    ...PUFFS.map(({ at }, i): BoneSpec => ({
      name: `puff${i}`, parent: 'body', pivot: [at[0], at[1] - 0.3, at[2]],
      wave: { rx: [0.05, 0.3 + i * 0.04, i], rz: [0.05, 0.27 + i * 0.03, i * 2] },
      jiggle: { axis: [at[0], 0.4, 0], length: 0.12, freq: 2.2 + i * 0.15, damping: 0.18, maxAngle: 0.35 },
    })),
    /* two stubby puff arms */
    { name: 'armL', parent: 'body', pivot: [-0.38, 0.02, 0.1], drive: { rz: [['flap', -1.2]] }, jiggle: { axis: [-1, 0, 0], length: 0.1, freq: 3, damping: 0.25, maxAngle: 0.5 } },
    { name: 'armR', parent: 'body', pivot: [0.38, 0.02, 0.1], drive: { rz: [['flap', 1.2]] }, jiggle: { axis: [1, 0, 0], length: 0.1, freq: 3, damping: 0.25, maxAngle: 0.5 } },
  ],
  parts: [
    /* the core puff carries the face; the rest blend into it */
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.14, 0.04], radii: [0.32, 0.27, 0.27], material: 'cloud' },
    ...PUFFS.map(({ radius }, i): PartSpec => ({ bone: `puff${i}`, shape: 'sphere', at: [0, 0, 0], radius, blend: 0.1, material: 'cloud' })),
    { bone: 'armL', shape: 'sphere', at: [-0.06, -0.02, 0], radius: 0.085, blend: 0.07, material: 'cloud' },
    { bone: 'armR', shape: 'sphere', at: [0.06, -0.02, 0], radius: 0.085, blend: 0.07, material: 'cloud' },
  ],
  paints: [
    { bone: 'body', on: ['cloud'], kind: 'sphere', at: [-0.19, 0.06, 0.27], radius: 0.06, color: '#ffa8c4', soft: 0.6, opacity: 0.8 },
    { bone: 'body', on: ['cloud'], kind: 'sphere', at: [0.19, 0.06, 0.27], radius: 0.06, color: '#ffa8c4', soft: 0.6, opacity: 0.8 },
    /* the underside is a touch greyer, like a real cumulus */
    { bone: 'body', on: ['cloud'], kind: 'ellipse', at: [0, -0.16, 0.2], radii: [0.42, 0.1], color: '#d4ddf2', soft: 0.9, opacity: 0.8 },
  ],
  eyes: {
    kind: 'bead',
    bone: 'body',
    at: [[-0.1, 0.15, 0.3], [0.1, 0.15, 0.3]],
    radii: [0.04, 0.058, 0.028],
    material: 'eye',
  },
  face: {
    kind: 'mouth',
    bone: 'body',
    on: ['cloud'],
    at: [0, 0.06, 0.31],
    width: 0.05,
    color: '#4a2a44',
    tongue: '#ff8fae',
  },
  anchors: {
    top: { bone: 'body', at: [0.14, 0.48, 0.02] },
    mouth: { bone: 'body', at: [0, 0.06, 0.33] },
    ear: { bone: 'body', at: [-0.42, 0.12, 0] },
    feet: { bone: 'root', at: [0, 0.02, 0.08] },
    belly: { bone: 'body', at: [0, -0.15, 0.04] },
  },
  acting: {
    /* one stubby arm to the chin */
    thinking: { armR: { rz: 1.4, rx: -0.6 } },
    listening: { armL: { rz: -1.2, rx: -0.3 } },
    speaking: {
      armL: { rz: [-0.2, 0.2, 1.4, 0] },
      armR: { rz: [0.2, 0.2, 1.4, 1.8] },
    },
    sleeping: { armL: { rz: 0.3 }, armR: { rz: -0.3 } },
    working: {
      armL: { rx: [-0.8, 0.2, 6, 0] },
      armR: { rx: [-0.8, 0.2, 6, Math.PI] },
    },
    error: {
      armL: { rz: [-1.4, 0.12, 11, 0] },
      armR: { rz: [1.4, 0.12, 11, 1] },
    },
    surprised: { armL: { rz: -1.9 }, armR: { rz: 1.9 } },
    celebrating: {
      armL: { rz: [-1.9, 0.4, 4, 0] },
      armR: { rz: [1.9, 0.4, 4, Math.PI] },
    },
    sad: { armL: { rz: 0.35 }, armR: { rz: -0.35 } },
    happy: {
      armL: { rz: [-1.4, 0.5, 6, 0] },
      armR: { rz: [1.4, 0.5, 6, 1.2] },
    },
  },
  fx: {
    /* it is the rain cloud: when it's sad, it rains from its own belly */
    replace: ['sad', 'land'],
    sad: [
      { glyph: 'drop', anchor: 'belly', rate: 16, spread: 0.24, velocity: [0, -0.5, 0], gravity: 2, life: [0.35, 0.5], size: [0.022, 0.016], color: '#6aa8ff', align: true },
    ],
    /* and when it errors, it crackles with lightning */
    error: [
      { glyph: 'spark', anchor: 'belly', rate: 7, spread: 0.2, velocity: [0, -0.6, 0], jitter: 0.5, gravity: 1, life: [0.12, 0.22], size: [0.07, 0.02], color: '#ffe066', glow: true, align: true },
    ],
    /* a sprinkle of tiny rainbow sparkles to celebrate */
    celebrating: [
      { glyph: 'sparkle', anchor: 'belly', rate: 5, spread: 0.3, velocity: [0, -0.15, 0], jitter: 0.1, wobble: 0.05, life: [0.9, 1.2], size: [0.045, 0], spin: 2, color: '#a7d8ff', glow: true },
    ],
    sleeping: [
      { glyph: 'drop', anchor: 'belly', rate: 0.6, spread: 0.2, velocity: [0, -0.15, 0], gravity: 1, life: [0.6, 0.8], size: [0.016, 0.012], color: '#9cc4ff', align: true },
    ],
    land: [],
  },
};

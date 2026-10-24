import type { BoneSpec, CharacterSpec, PaintSpec, PartSpec } from 'wobnimo';

/* The soft back spikes: one jiggling bone each, running from the crown down the tail. */
const SPIKES: Array<{ parent: string; at: [number, number, number]; tilt: number; size: number }> = [
  { parent: 'head', at: [0, 0.43, 0.05], tilt: -0.1, size: 0.075 },
  { parent: 'head', at: [0, 0.41, -0.1], tilt: -0.5, size: 0.09 },
  { parent: 'head', at: [0, 0.3, -0.24], tilt: -1.0, size: 0.085 },
  { parent: 'body', at: [0, 0.5, -0.24], tilt: -1.2, size: 0.08 },
  { parent: 'body', at: [0, 0.34, -0.3], tilt: -1.45, size: 0.07 },
  { parent: 'tail0', at: [0, 0.12, 0.07], tilt: 0, size: 0.06 },
  { parent: 'tail1', at: [0, 0.1, 0.05], tilt: 0, size: 0.045 },
];

/** A baby T. rex: pebbly scales, a toothless grin, tiny arms and a tail that wags. */
export const rex: CharacterSpec = {
  id: 'rex',
  name: 'Rex',
  tagline: 'A baby T. rex with pebbly scales, wobbly back spikes, tiny arms and a wagging tail',
  accent: '#4fb86a',
  frame: { target: 0.52, radius: 0.76 },
  bound: { y: 0.46, radius: 0.86 },
  motion: { hop: 0.15, squash: 1.15, snap: 1.05, talkSquash: 0.35 },
  materials: {
    /* a soft vinyl-toy hide: satin, with pebbled scales and darker seams */
    hide: {
      color: '#78cf7f', f0: 0.04, spec: 0.7, shininess: 40, rim: 0.7, gloss: 0.35, sss: 0.2, sssColor: '#c8ffb0',
      surface: { kind: 'scales', scale: 24, strength: 0.5, color: '#4b9f5d', bone: 'head' },
    },
    bodyHide: {
      color: '#78cf7f', shadeOf: 'hide', f0: 0.04, spec: 0.7, shininess: 40, rim: 0.7, gloss: 0.35, sss: 0.2, sssColor: '#c8ffb0',
      surface: { kind: 'scales', scale: 24, strength: 0.5, color: '#4b9f5d' },
    },
    belly: { color: '#fff0c4', f0: 0.04, spec: 0.5, shininess: 30, rim: 0.5, gloss: 0.3, sss: 0.25, sssColor: '#fff6d8' },
    spike: { color: '#ff9b4a', f0: 0.05, spec: 0.9, shininess: 60, rim: 0.5, gloss: 0.5, sss: 0.35, sssColor: '#ffc58f' },
    claw: { color: '#fff6e2', f0: 0.05, spec: 1, shininess: 80, rim: 0.3, gloss: 0.6 },
  },
  bones: [
    { name: 'body', pivot: [0, 0, 0], drive: { ry: [['yaw', 0.25]], rz: [['roll', 0.3]] } },
    { name: 'head', parent: 'body', pivot: [0, 0.56, 0.06], drive: { rx: [['pitch', -1]], ry: [['yaw', 0.8]], rz: [['roll', 0.7]] } },
    /* tiny arms, held up in front of the chest */
    { name: 'armL', parent: 'body', pivot: [-0.15, 0.42, 0.25], rest: { rx: -0.6 }, drive: { rx: [['flap', -0.9]], rz: [['flap', -0.5]] } },
    { name: 'armR', parent: 'body', pivot: [0.15, 0.42, 0.25], rest: { rx: -0.6 }, drive: { rx: [['flap', -0.9]], rz: [['flap', 0.5]] } },
    /* the tail sweeps out behind and to the side, so it shows from the front */
    { name: 'tail0', parent: 'body', pivot: [0.08, 0.17, -0.24], rest: { rx: -1.25, rz: -0.6 }, wave: { rz: [0.2, 0.5, 0] }, jiggle: { axis: [0, 1, 0], length: 0.18, freq: 2.2, damping: 0.25, maxAngle: 0.6 } },
    { name: 'tail1', parent: 'tail0', pivot: [0, 0.18, 0], rest: { rx: 0.2 }, wave: { rz: [0.2, 0.5, 0.8] }, jiggle: { axis: [0, 1, 0], length: 0.15, freq: 2, damping: 0.22, maxAngle: 0.7 } },
    { name: 'tail2', parent: 'tail1', pivot: [0, 0.15, 0], rest: { rx: 0.15 }, wave: { rz: [0.25, 0.5, 1.6] }, jiggle: { axis: [0, 1, 0], length: 0.12, freq: 1.8, damping: 0.2, maxAngle: 0.8 } },
    ...SPIKES.map(({ parent, at, tilt }, i): BoneSpec => ({
      name: `spike${i}`, parent, pivot: at, rest: { rx: tilt },
      jiggle: { axis: [0, 1, 0], length: 0.08, freq: 4 + i * 0.3, damping: 0.12, maxAngle: 0.45 },
    })),
  ],
  parts: [
    /* a pear of a body on two chunky thighs */
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.3, -0.02], radii: [0.3, 0.3, 0.28], material: 'bodyHide' },
    { bone: 'body', shape: 'ellipsoid', at: [-0.19, 0.15, -0.02], radii: [0.13, 0.15, 0.17], blend: 0.08, material: 'bodyHide' },
    { bone: 'body', shape: 'ellipsoid', at: [0.19, 0.15, -0.02], radii: [0.13, 0.15, 0.17], blend: 0.08, material: 'bodyHide' },
    /* feet with three blunt claws each */
    ...[-1, 1].flatMap((s): PartSpec[] => [
      { bone: 'body', shape: 'ellipsoid', at: [s * 0.2, 0.045, 0.1], radii: [0.1, 0.05, 0.13], blend: 0.05, material: 'bodyHide' },
      ...[-1, 0, 1].map((t): PartSpec => ({
        bone: 'body', shape: 'ellipsoid', at: [s * 0.2 + t * 0.05, 0.03, 0.225 - Math.abs(t) * 0.015], radii: [0.022, 0.022, 0.026], blend: 0.012, material: 'claw',
      })),
    ]),
    /* a big round head with a wide, soft snout */
    { bone: 'head', shape: 'ellipsoid', at: [0, 0.2, -0.02], radii: [0.29, 0.25, 0.27], blend: 0.12, material: 'hide' },
    { bone: 'head', shape: 'ellipsoid', at: [0, 0.1, 0.17], radii: [0.23, 0.14, 0.18], blend: 0.1, material: 'hide' },
    /* nostrils */
    { bone: 'head', shape: 'sphere', at: [-0.047, 0.162, 0.322], radius: 0.014, op: 'sub', blend: 0.01, material: 'hide' },
    { bone: 'head', shape: 'sphere', at: [0.047, 0.162, 0.322], radius: 0.014, op: 'sub', blend: 0.01, material: 'hide' },
    /* tiny arms with two little claws */
    ...([['armL', -1], ['armR', 1]] as const).flatMap(([bone, s]): PartSpec[] => [
      { bone, shape: 'capsule', from: [0, 0, 0], to: [s * 0.01, -0.1, 0.03], radius: 0.042, blend: 0.04, material: 'bodyHide' },
      { bone, shape: 'sphere', at: [s * -0.014, -0.135, 0.05], radius: 0.015, blend: 0.01, material: 'claw' },
      { bone, shape: 'sphere', at: [s * 0.02, -0.135, 0.045], radius: 0.015, blend: 0.01, material: 'claw' },
    ]),
    /* the tail, tapering */
    { bone: 'tail0', shape: 'roundCone', from: [0, 0, 0], to: [0, 0.18, 0], r1: 0.12, r2: 0.09, blend: 0.06, material: 'bodyHide' },
    { bone: 'tail1', shape: 'roundCone', from: [0, 0, 0], to: [0, 0.15, 0], r1: 0.09, r2: 0.06, blend: 0.03, material: 'bodyHide' },
    { bone: 'tail2', shape: 'roundCone', from: [0, 0, 0], to: [0, 0.12, 0], r1: 0.06, r2: 0.03, blend: 0.03, material: 'bodyHide' },
    /* soft orange spikes */
    ...SPIKES.map(({ size }, i): PartSpec => ({
      bone: `spike${i}`, shape: 'roundCone', from: [0, -0.02, 0], to: [0, size * 1.1, 0], r1: size * 0.65, r2: size * 0.15, blend: 0.025, material: 'spike',
    })),
  ],
  paints: [
    /* a cream belly and chin, freckles on the snout, blushing cheeks */
    { bone: 'body', on: ['bodyHide'], kind: 'ellipse', at: [0, 0.24, 0.08], radii: [0.16, 0.2], color: '#fff0c4', soft: 0.2 },
    { bone: 'head', on: ['hide'], kind: 'ellipse', at: [0, -0.01, 0.15], radii: [0.17, 0.06], color: '#fff0c4', soft: 0.35 },
    { bone: 'head', on: ['hide'], kind: 'sphere', at: [-0.2, 0.12, 0.24], radius: 0.055, color: '#ff9a9a', soft: 0.6, opacity: 0.7 },
    { bone: 'head', on: ['hide'], kind: 'sphere', at: [0.2, 0.12, 0.24], radius: 0.055, color: '#ff9a9a', soft: 0.6, opacity: 0.7 },
    ...[[-0.083, 0.204, 0.289], [-0.109, 0.181, 0.297], [0.083, 0.204, 0.289], [0.109, 0.181, 0.297]].map(([x, y, z]): PaintSpec => ({
      bone: 'head', on: ['hide'], kind: 'sphere', at: [x, y, z], radius: 0.009, color: '#3f8a4f', soft: 0.3,
    })),
  ],
  eyes: {
    kind: 'ball',
    bone: 'head',
    at: [[-0.13, 0.26, 0.19], [0.13, 0.26, 0.19]],
    radius: 0.085,
    iris: '#e0942f',
    irisSize: 0.78,
    pupilSize: 0.46,
    pupilAspect: 0.75,
    lid: 'hide',
  },
  /* a wide, toothless grin across the snout */
  face: {
    kind: 'mouth',
    bone: 'head',
    on: ['hide'],
    at: [0, 0.06, 0.34],
    width: 0.1,
    color: '#5b1f2b',
    tongue: '#ff7f93',
  },
  anchors: {
    top: { bone: 'head', at: [0.16, 0.44, 0.06] },
    mouth: { bone: 'head', at: [0, 0.06, 0.37] },
    ear: { bone: 'head', at: [-0.3, 0.22, 0] },
    feet: { bone: 'root', at: [0, 0.02, 0.15] },
    tail: { bone: 'tail2', at: [0, 0.12, 0] },
  },
  acting: {
    idle: { tail0: { rz: [-0.6, 0.12, 0.45, 0] } },
    /* a tiny claw tapping the chin, which it can't quite reach */
    thinking: {
      armR: { rx: [-1.3, 0.08, 2.5, 0], rz: 0.3 },
      tail2: { rx: [0.15, 0.3, 1.4, 0] },
    },
    listening: {
      armL: { rx: -1.1, rz: -0.6 },
      tail0: { rz: -0.4 },
    },
    speaking: {
      armL: { rx: [-0.6, 0.25, 1.6, 0] },
      armR: { rx: [-0.6, 0.25, 1.6, 2] },
      tail0: { rz: [-0.6, 0.18, 0.9, 0] },
    },
    /* curled up: arms tucked, the tail wrapped round the front */
    sleeping: {
      armL: { rx: 0.1, rz: 0.2 },
      armR: { rx: 0.1, rz: -0.2 },
      tail0: { rz: -1.3, rx: -1.0 },
      tail1: { rx: 0.4 },
    },
    /* scribbling with both little hands */
    working: {
      armL: { rx: [-0.9, 0.15, 7, 0] },
      armR: { rx: [-0.9, 0.15, 7, Math.PI] },
      head: { rx: 0.12 },
      tail2: { rx: [0.15, 0.2, 2, 0] },
    },
    /* arms flailing, tail stiff, every spike on end */
    error: {
      armL: { rx: [-1.6, 0.35, 9, 0], rz: -0.4 },
      armR: { rx: [-1.6, 0.35, 9, 1.4], rz: 0.4 },
      tail0: { rz: [-0.5, 0.06, 12, 0], rx: -1.45 },
      spike1: { rx: -0.2 },
      spike2: { rx: -0.6 },
      spike3: { rx: -0.8 },
    },
    surprised: {
      armL: { rx: -1.9, rz: -0.6 },
      armR: { rx: -1.9, rz: 0.6 },
      tail0: { rx: -1.5 },
    },
    /* a happy stomp with tiny arms in the air and a wagging tail */
    celebrating: {
      armL: { rx: [-2.2, 0.3, 4, 0], rz: -0.5 },
      armR: { rx: [-2.2, 0.3, 4, Math.PI], rz: 0.5 },
      tail0: { rz: [-0.6, 0.55, 3, 0] },
    },
    sad: {
      armL: { rx: 0.2 },
      armR: { rx: 0.2 },
      tail0: { rx: -0.95, rz: -0.4 },
      tail1: { rx: 0.35 },
    },
    happy: {
      armL: { rx: [-1.4, 0.4, 6, 0] },
      armR: { rx: [-1.4, 0.4, 6, 1.4] },
      tail0: { rz: [-0.6, 0.5, 4, 0] },
    },
  },
  fx: {
    /* a little roar on surprise */
    'enter:surprised': [
      { glyph: 'arc', anchor: 'mouth', rate: 3, offset: [0.08, 0, 0.05], mirror: true, velocity: [0.3, 0.05, 0.1], jitter: 0.04, life: [0.5, 0.6], size: [0.04, 0.11], color: '#7fd18a' },
    ],
  },
};

export default rex;

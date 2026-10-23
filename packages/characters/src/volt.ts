import type { BoneSpec, CharacterSpec, PartSpec } from '@wobnimo/engine';

/* A jointed arm: shoulder, elbow, and a claw hand. `side` is -1 for the
   arm on screen left, 1 for screen right. */
function arm(side: -1 | 1): BoneSpec[] {
  const s = side < 0 ? 'L' : 'R';
  return [
    { name: `shoulder${s}`, parent: 'body', pivot: [0.385 * side, 0.47, 0.02], drive: { rz: [['flap', 0.5 * side]] } },
    {
      name: `fore${s}`, parent: `shoulder${s}`, pivot: [0, -0.17, 0],
      jiggle: { axis: [0, -1, 0], length: 0.16, freq: 3.2, damping: 0.35, maxAngle: 0.3 },
    },
  ];
}

function armParts(side: -1 | 1): PartSpec[] {
  const s = side < 0 ? 'L' : 'R';
  return [
    { bone: `shoulder${s}`, shape: 'sphere', radius: 0.074, material: 'trim' },
    { bone: `shoulder${s}`, shape: 'capsule', from: [0, -0.02, 0], to: [0, -0.15, 0], radius: 0.058, material: 'shell' },
    { bone: `fore${s}`, shape: 'sphere', radius: 0.052, material: 'trim' },
    { bone: `fore${s}`, shape: 'capsule', from: [0, -0.02, 0], to: [0, -0.12, 0], radius: 0.052, material: 'shell' },
    /* a claw: a ball with a bite out of it */
    { bone: `fore${s}`, shape: 'sphere', at: [0, -0.175, 0], radius: 0.066, material: 'trim' },
    { bone: `fore${s}`, shape: 'sphere', op: 'sub', blend: 0.012, at: [0, -0.235, 0.012], radius: 0.036, material: 'trim' },
  ];
}

/* knob ears that spin like gears when it thinks; two studs make the turn readable */
function earParts(side: -1 | 1): PartSpec[] {
  const s = side < 0 ? 'L' : 'R';
  return [
    { bone: `ear${s}`, shape: 'cylinder', rot: [0, 0, 1.5708], radius: 0.112, half: 0.03, round: 0.018, material: 'trim' },
    { bone: `ear${s}`, shape: 'cylinder', at: [0.045 * side, 0, 0], rot: [0, 0, 1.5708], radius: 0.058, half: 0.035, round: 0.018, material: 'trim' },
    { bone: `ear${s}`, shape: 'sphere', at: [0.035 * side, 0.078, 0], radius: 0.02, material: 'metal' },
    { bone: `ear${s}`, shape: 'sphere', at: [0.035 * side, -0.078, 0], radius: 0.02, material: 'metal' },
  ];
}

/** A glossy TV-headed robot: LED face, jointed arms with claws, gear ears, sprung antenna. */
export const volt: CharacterSpec = {
  id: 'volt',
  name: 'Volt',
  tagline: 'LED face, claw hands, gear ears, a sprung antenna',
  accent: '#3b63d9',
  frame: { target: 0.86, radius: 1.02 },
  bound: { y: 0.86, radius: 1.12 },
  motion: { hop: 0.16, squash: 1, snap: 1 },
  glowPool: 0.35,
  materials: {
    shell: { color: '#2f56c4', f0: 0.05, spec: 0.7, shininess: 70, rim: 0.55, gloss: 0.55 },
    trim: { color: '#c3cce3', f0: 0.07, spec: 0.8, shininess: 90, metal: 0.25, rim: 0.4, gloss: 0.5 },
    metal: { color: '#8f98ae', f0: 0.45, spec: 1, shininess: 120, metal: 0.85, rim: 0.3, gloss: 0.7 },
    rubber: { color: '#151a28', f0: 0.03, spec: 0.15, shininess: 12, rim: 0.2 },
    screen: { color: '#03060c', f0: 0.045, spec: 1.6, shininess: 260, rim: 0.1, gloss: 1 },
    bulb: { color: '#f2f5ff', f0: 0.04, spec: 0.6, shininess: 40, rim: 0.3, glows: true, emitStrength: 1.4, sss: 0.4, sssColor: '#ffffff' },
    lamp: { color: '#e9eeff', f0: 0.05, spec: 1, shininess: 80, glows: true, emitStrength: 1.1, gloss: 0.9 },
    ring: { color: '#d8e4ff', f0: 0.04, spec: 0.4, shininess: 30, glows: true, emitStrength: 1.6 },
  },
  bones: [
    { name: 'body', pivot: [0, 0, 0], drive: { ry: [['yaw', 0.2]], rz: [['roll', 0.25]] } },
    { name: 'head', parent: 'body', pivot: [0, 0.64, 0], drive: { rx: [['pitch', -1]], ry: [['yaw', 0.8]], rz: [['roll', 0.75]] } },
    { name: 'antenna', parent: 'head', pivot: [0, 0.755, 0], jiggle: { axis: [0, 1, 0], length: 0.26, freq: 2.3, damping: 0.11 } },
    { name: 'earL', parent: 'head', pivot: [-0.585, 0.37, 0] },
    { name: 'earR', parent: 'head', pivot: [0.585, 0.37, 0] },
    ...arm(-1),
    ...arm(1),
  ],
  parts: [
    /* the body: a soft puck on two feet, a lamp and a speaker grille in the chest */
    { bone: 'body', shape: 'roundBox', at: [0, 0.32, 0], half: [0.35, 0.27, 0.28], round: 0.22, material: 'shell' },
    { bone: 'body', shape: 'roundBox', at: [0, 0.38, 0.27], half: [0.15, 0.08, 0.03], round: 0.06, material: 'rubber' },
    { bone: 'body', shape: 'sphere', at: [0, 0.38, 0.285], radius: 0.04, material: 'lamp' },
    { bone: 'body', shape: 'plate', op: 'sub', blend: 0.006, at: [0, 0.225, 0.3], half: [0.075, 0.009], corner: 0.009, depth: 0.03, material: 'shell' },
    { bone: 'body', shape: 'plate', op: 'sub', blend: 0.006, at: [0, 0.19, 0.295], half: [0.075, 0.009], corner: 0.009, depth: 0.03, material: 'shell' },
    { bone: 'body', shape: 'plate', op: 'sub', blend: 0.006, at: [0, 0.155, 0.285], half: [0.06, 0.009], corner: 0.009, depth: 0.03, material: 'shell' },
    { bone: 'body', shape: 'roundBox', at: [-0.17, 0.035, 0.05], half: [0.11, 0.035, 0.14], round: 0.035, material: 'trim' },
    { bone: 'body', shape: 'roundBox', at: [0.17, 0.035, 0.05], half: [0.11, 0.035, 0.14], round: 0.035, material: 'trim' },
    { bone: 'body', shape: 'cylinder', at: [0, 0.62, 0], radius: 0.075, half: 0.06, round: 0.02, material: 'metal' },

    /* the head: a shell with a rolled lip into the screen, a gasket and the glass */
    { bone: 'head', shape: 'roundBox', at: [0, 0.37, 0], half: [0.56, 0.37, 0.35], round: 0.17, material: 'shell' },
    { bone: 'head', shape: 'roundBox', op: 'sub', blend: 0.035, at: [0, 0.37, 0.41], half: [0.45, 0.28, 0.1], round: 0.12, material: 'shell' },
    { bone: 'head', shape: 'plate', at: [0, 0.37, 0.31], half: [0.45, 0.28], corner: 0.12, depth: 0.012, material: 'screen' },
    { bone: 'head', shape: 'frame', at: [0, 0.37, 0.3], half: [0.448, 0.278], corner: 0.118, width: 0.014, depth: 0.018, material: 'rubber' },
    /* glowing rings where the ears meet the head */
    { bone: 'head', shape: 'cylinder', at: [-0.555, 0.37, 0], rot: [0, 0, 1.5708], radius: 0.122, half: 0.012, round: 0.006, material: 'ring' },
    { bone: 'head', shape: 'cylinder', at: [0.555, 0.37, 0], rot: [0, 0, 1.5708], radius: 0.122, half: 0.012, round: 0.006, material: 'ring' },
    ...earParts(-1),
    ...earParts(1),
    /* the antenna's collar, stem and bulb */
    { bone: 'head', shape: 'cylinder', at: [0, 0.745, 0], radius: 0.065, half: 0.025, round: 0.012, material: 'trim' },
    { bone: 'antenna', shape: 'capsule', from: [0, 0, 0], to: [0, 0.2, 0], radius: 0.016, material: 'metal' },
    { bone: 'antenna', shape: 'sphere', at: [0, 0.25, 0], radius: 0.055, material: 'bulb' },

    ...armParts(-1),
    ...armParts(1),
  ],
  face: {
    kind: 'screen',
    bone: 'head',
    material: 'screen',
    center: [0, 0.37],
    half: [0.44, 0.27],
    corner: 0.11,
    cell: 0.034,
    color: '#c4ecff',
  },
  anchors: {
    top: { bone: 'head', at: [0.3, 0.78, 0.1] },
    mouth: { bone: 'head', at: [0, 0.22, 0.34] },
    ear: { bone: 'head', at: [-0.66, 0.37, 0] },
    feet: { bone: 'root', at: [0, 0.02, 0.06] },
    antenna: { bone: 'antenna', at: [0, 0.25, 0] },
  },
  acting: {
    idle: {
      shoulderL: { rz: [-0.08, 0.04, 0.45, 0], rx: [0, 0.06, 0.35, 1] },
      shoulderR: { rz: [0.08, 0.04, 0.45, 1.6], rx: [0, 0.06, 0.35, 2.4] },
      foreL: { rx: -0.25 },
      foreR: { rx: -0.25 },
    },
    /* the thinker: one claw up to the chin and tapping, the other arm across the belly */
    thinking: {
      shoulderR: { rx: -1.5, ry: -0.8, rz: -0.1 },
      foreR: { rx: [-0.95, 0.1, 1.8, 0] },
      shoulderL: { rx: -1.0, ry: 0.8, rz: -0.3 },
      foreL: { rx: -0.8 },
      earL: { rx: [0, 0, 0, 0, 5] },
      earR: { rx: [0, 0, 0, 0, -5] },
    },
    /* a claw cupped up by the ear */
    listening: {
      shoulderL: { rx: 0.1, ry: 0.3, rz: -2.8 },
      foreL: { rx: -0.6 },
      shoulderR: { rz: 0.14, rx: 0.05 },
      foreR: { rx: -0.3 },
      earL: { rx: [0.3, 0.15, 0.8, 0] },
    },
    /* talking with its hands */
    speaking: {
      shoulderL: { rx: [-0.55, 0.32, 0.72, 0], rz: [-0.28, 0.12, 0.5, 0] },
      foreL: { rx: [-0.85, 0.38, 1.44, 0.6] },
      shoulderR: { rx: [-0.45, 0.32, 0.72, 2.2], rz: [0.28, 0.12, 0.5, 1] },
      foreR: { rx: [-0.95, 0.38, 1.44, 2.8] },
      earL: { rx: [0, 0, 0, 0, 1.4] },
      earR: { rx: [0, 0, 0, 0, -1.4] },
    },
    sleeping: {
      shoulderL: { rz: -0.03, rx: -0.3 },
      shoulderR: { rz: 0.03, rx: -0.3 },
      foreL: { rx: -0.4 },
      foreR: { rx: -0.4 },
    },
    /* typing: arms forward, claws tapping in turn, ears turning like drives */
    working: {
      shoulderL: { rx: -0.85, rz: -0.12 },
      shoulderR: { rx: -0.85, rz: 0.12 },
      foreL: { rx: [-0.95, 0.2, 6, 0] },
      foreR: { rx: [-0.95, 0.2, 6, Math.PI] },
      earL: { rx: [0, 0, 0, 0, 3] },
      earR: { rx: [0, 0, 0, 0, -3] },
    },
    /* arms thrown out, shaking; the ears seize up */
    error: {
      shoulderL: { rz: [-0.95, 0.1, 11, 0], rx: -0.2 },
      shoulderR: { rz: [0.95, 0.1, 11, 1], rx: -0.2 },
      foreL: { rx: -1.1 },
      foreR: { rx: -1.1 },
    },
    surprised: {
      shoulderL: { rz: -1.55, rx: -0.3 },
      shoulderR: { rz: 1.55, rx: -0.3 },
      foreL: { rx: -0.35 },
      foreR: { rx: -0.35 },
    },
    /* fists pumping overhead, ears spinning */
    celebrating: {
      shoulderL: { rz: [-2.55, 0.28, 4, 0] },
      shoulderR: { rz: [2.55, 0.28, 4, Math.PI] },
      foreL: { rz: [0.2, 0.4, 8, 0] },
      foreR: { rz: [-0.2, 0.4, 8, Math.PI] },
      earL: { rx: [0, 0, 0, 0, 12] },
      earR: { rx: [0, 0, 0, 0, -12] },
    },
    /* arms hanging, a little behind the body */
    sad: {
      shoulderL: { rz: 0.04, rx: 0.22 },
      shoulderR: { rz: -0.04, rx: 0.22 },
      foreL: { rx: -0.05 },
      foreR: { rx: -0.05 },
    },
    /* both arms up, claws waving */
    happy: {
      shoulderL: { rz: [-2.5, 0.22, 2.2, 0] },
      foreL: { rz: [0.1, 0.5, 4.2, 0] },
      shoulderR: { rz: [2.5, 0.22, 2.2, 1.5] },
      foreR: { rz: [-0.1, 0.5, 4.2, 2] },
      earL: { rx: [0, 0, 0, 0, 10] },
      earR: { rx: [0, 0, 0, 0, -10] },
    },
  },
  fx: {
    replace: ['syllable'],
    /* sound comes out of the sides of the screen */
    syllable: [{ glyph: 'arc', anchor: 'mouth', rate: 2, offset: [0.5, 0.1, -0.1], mirror: true, velocity: [0.26, 0.02, 0.02], jitter: 0.02, life: [0.55, 0.7], size: [0.04, 0.1], rotation: 0, color: '#6aaee6' }],
    /* signal rings off the antenna while it thinks and listens */
    thinking: [{ glyph: 'ring', anchor: 'antenna', rate: 1.3, velocity: [0, 0.02, 0], life: [0.9, 1.1], size: [0.03, 0.17], color: '#ffb347', glow: true }],
    listening: [{ glyph: 'ring', anchor: 'antenna', rate: 1.1, velocity: [0, 0, 0], life: [1, 1.2], size: [0.2, 0.03], color: '#62e39a', glow: true }],
    land: [{ glyph: 'spark', anchor: 'feet', rate: 6, spread: 0.12, velocity: [0, 0.6, 0], jitter: 1.1, gravity: 3, life: [0.25, 0.42], size: [0.035, 0.02], color: '#ffd27a', glow: true, align: true }],
    'enter:happy': [{ glyph: 'spark', anchor: 'antenna', rate: 8, velocity: [0, 0.5, 0], jitter: 1.4, gravity: 2, life: [0.3, 0.5], size: [0.04, 0.02], color: '#ffe08a', glow: true, align: true }],
  },
};

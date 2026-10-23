import type { CharacterSpec, PaintSpec, PartSpec } from '@wobnimo/engine';

/* a quarter turn: servo axles and side plates are mostly turned by one */
const R = Math.PI / 2;

/**
 * A little bipedal robot duck: a white helmet head with an orange bill and
 * camera-lens eyes, a stack of servos for a neck, bracket legs and chunky
 * orange boots. Everything moves on servos, so it snaps and holds.
 */
export const microduck: CharacterSpec = {
  id: 'microduck',
  name: 'Microduck',
  tagline: 'A bipedal robot duck: servo neck, lens eyes, a bill that clacks when it talks, and boots it marches in',
  accent: '#ff6a1f',
  frame: { target: 0.57, radius: 0.8 },
  bound: { y: 0.58, radius: 0.88 },
  motion: { hop: 0.12, squash: 0.45, snap: 1.4, look: 0.9, snapLook: 1, talkSquash: 0.12 },
  materials: {
    /* injection-moulded plastic: satin, with a faint printed grain */
    shell: {
      color: '#f3f1ec', f0: 0.04, spec: 1.1, shininess: 70, rim: 0.55, gloss: 0.5, sss: 0.12, sssColor: '#ffffff',
      surface: { kind: 'ripple', scale: 70, strength: 0.12, bone: 'head' },
    },
    bodyShell: {
      color: '#f3f1ec', shadeOf: 'shell', f0: 0.04, spec: 1.1, shininess: 70, rim: 0.55, gloss: 0.5, sss: 0.12, sssColor: '#ffffff',
      surface: { kind: 'ripple', scale: 70, strength: 0.12, bone: 'body' },
    },
    bill: { color: '#ff5f1f', f0: 0.05, spec: 1.3, shininess: 90, rim: 0.45, gloss: 0.65, sss: 0.2, sssColor: '#ffb27a' },
    ring: { color: '#ff8410', f0: 0.05, spec: 1.3, shininess: 90, rim: 0.4, gloss: 0.65, sss: 0.15, sssColor: '#ffd08a' },
    boot: { color: '#ff5a24', f0: 0.04, spec: 0.9, shininess: 50, rim: 0.4, gloss: 0.4, sss: 0.15, sssColor: '#ffb08a' },
    sole: { color: '#ffb12e', f0: 0.04, spec: 0.7, shininess: 40, rim: 0.3, gloss: 0.3 },
    /* anodised servo housings and brackets */
    servo: { color: '#2a2d33', f0: 0.06, spec: 1.2, shininess: 80, rim: 0.5, gloss: 0.55, metal: 0.25 },
    horn: { color: '#a3a9b1', f0: 0.3, spec: 1.6, shininess: 120, rim: 0.4, gloss: 0.7, metal: 0.8 },
    /* glass camera lenses */
    lens: { color: '#101318', f0: 0.12, spec: 2.6, shininess: 420, rim: 0.3, gloss: 1 },
    mouth: { color: '#3b1510', f0: 0.04, spec: 0.5, shininess: 30, rim: 0 },
    /* a status light on the chest that takes the state's colour */
    led: { color: '#ffffff', f0: 0.05, spec: 1, shininess: 120, rim: 0, glows: true },
  },
  bones: [
    /* it stands three-quarters on, like the photos of the real thing, so
       one lens looks straight out and the long head reads in profile */
    { name: 'hips', pivot: [0, 0, 0], rest: { ry: 0.55 } },
    /* the legs hang from the hips, not the body, so the boots stay planted
       when the body turns and rolls */
    { name: 'legL', parent: 'hips', pivot: [-0.12, 0.36, 0] },
    { name: 'shinL', parent: 'legL', pivot: [0, -0.15, 0] },
    { name: 'legR', parent: 'hips', pivot: [0.12, 0.36, 0] },
    { name: 'shinR', parent: 'legR', pivot: [0, -0.15, 0] },
    { name: 'body', parent: 'hips', pivot: [0, 0.39, 0], drive: { ry: [['yaw', 0.2]], rz: [['roll', 0.4]] } },
    /* a two-servo neck shares the nod and the turn with the head */
    { name: 'neck0', parent: 'body', pivot: [0, 0.19, 0.04], drive: { rx: [['pitch', -0.15]], ry: [['yaw', 0.25]] } },
    {
      name: 'neck1', parent: 'neck0', pivot: [0, 0.09, 0], drive: { rx: [['pitch', -0.1]], ry: [['yaw', 0.2]] },
      jiggle: { axis: [0, 1, 0], length: 0.2, freq: 3.4, damping: 0.35, maxAngle: 0.16 },
    },
    { name: 'head', parent: 'neck1', pivot: [0, 0.09, 0], drive: { rx: [['pitch', -0.35]], ry: [['yaw', 0.55]], rz: [['roll', 0.6]] } },
    /* the lower bill hinges at the back and drops to talk */
    { name: 'jaw', parent: 'head', pivot: [0, 0.063, -0.18], drive: { rx: [['talk', 0.24]] } },
  ],
  parts: [
    /* ── head: a rounded hood over a bill of two flat plates ── */
    { bone: 'head', shape: 'roundBox', at: [0, 0.245, 0.05], half: [0.2, 0.17, 0.3], round: 0.16, clip: { normal: [0, -1, 0], offset: 0.145 }, material: 'shell' },
    /* the bill is two flat orange plates, like the real one: the top plate
       is fixed under the hood and runs out past it, the lower one hinges
       at the back and drops to talk. Behind them, a dark throat */
    { bone: 'head', shape: 'roundBox', at: [0, 0.085, 0.1], half: [0.208, 0.022, 0.32], round: 0.016, material: 'bill' },
    { bone: 'head', shape: 'roundBox', at: [0, 0.045, -0.06], half: [0.17, 0.035, 0.12], round: 0.02, material: 'mouth' },
    { bone: 'jaw', shape: 'roundBox', at: [0, -0.017, 0.27], half: [0.192, 0.018, 0.285], round: 0.014, material: 'bill' },
    /* lens eyes in orange rings on the flat sides of the hood, turned a little to the front */
    { bone: 'head', shape: 'cylinder', at: [-0.205, 0.225, 0.15], rot: [R, -1.05, 0], radius: 0.08, half: 0.026, round: 0.016, material: 'ring' },
    { bone: 'head', shape: 'cylinder', at: [0.205, 0.225, 0.15], rot: [R, 1.05, 0], radius: 0.08, half: 0.026, round: 0.016, material: 'ring' },
    /* a dark sensor hole above and ahead of each eye */
    { bone: 'head', shape: 'sphere', at: [-0.2, 0.31, 0.25], radius: 0.016, material: 'servo' },
    { bone: 'head', shape: 'sphere', at: [0.2, 0.31, 0.25], radius: 0.016, material: 'servo' },
    /* the bracket the neck bolts into */
    { bone: 'head', shape: 'roundBox', at: [0, 0.01, 0], half: [0.07, 0.035, 0.07], round: 0.016, material: 'servo' },

    /* ── neck: two stacked servos with silver horns ── */
    { bone: 'neck0', shape: 'roundBox', at: [0, 0.045, 0], half: [0.048, 0.047, 0.042], round: 0.016, material: 'servo' },
    { bone: 'neck0', shape: 'cylinder', at: [0, 0.02, 0], rot: [0, 0, R], radius: 0.026, half: 0.057, round: 0.01, material: 'horn' },
    { bone: 'neck1', shape: 'roundBox', at: [0, 0.045, 0], half: [0.045, 0.047, 0.04], round: 0.016, material: 'servo' },
    { bone: 'neck1', shape: 'cylinder', at: [0, 0.02, 0], rot: [0, 0, R], radius: 0.024, half: 0.053, round: 0.01, material: 'horn' },

    /* ── body: a rounded box on a servo hip block ── */
    { bone: 'body', shape: 'roundBox', at: [0, 0.1, -0.01], half: [0.19, 0.1, 0.15], round: 0.085, material: 'bodyShell' },
    { bone: 'body', shape: 'capsule', from: [-0.03, 0.12, 0.14], to: [0.03, 0.12, 0.14], radius: 0.014, material: 'led' },
    { bone: 'hips', shape: 'roundBox', at: [0, 0.37, 0], half: [0.15, 0.04, 0.09], round: 0.02, material: 'servo' },
    { bone: 'hips', shape: 'cylinder', at: [-0.16, 0.36, 0], rot: [0, 0, R], radius: 0.045, half: 0.026, round: 0.012, material: 'horn' },
    { bone: 'hips', shape: 'cylinder', at: [0.16, 0.36, 0], rot: [0, 0, R], radius: 0.045, half: 0.026, round: 0.012, material: 'horn' },

    /* ── legs: brackets, knee servos with white guards, chunky boots ── */
    ...([['legL', 'shinL', -1], ['legR', 'shinR', 1]] as const).flatMap(([leg, shin, s]): PartSpec[] => [
      { bone: leg, shape: 'roundBox', at: [0, -0.075, 0], half: [0.038, 0.07, 0.042], round: 0.015, material: 'servo' },
      { bone: leg, shape: 'cylinder', at: [0, -0.15, 0], rot: [0, 0, R], radius: 0.036, half: 0.05, round: 0.012, material: 'horn' },
      { bone: leg, shape: 'plate', at: [s * 0.056, -0.1, -0.005], rot: [s * R, s * Math.PI / 4, R], half: [0.058, 0.058], corner: 0.034, depth: 0.012, material: 'bodyShell' },
      { bone: shin, shape: 'roundBox', at: [0, -0.06, 0], half: [0.034, 0.055, 0.038], round: 0.014, material: 'servo' },
      { bone: shin, shape: 'roundBox', at: [0, -0.135, 0.005], half: [0.048, 0.036, 0.052], round: 0.016, material: 'servo' },
      { bone: shin, shape: 'roundBox', at: [0, -0.17, 0.045], half: [0.074, 0.04, 0.108], round: 0.038, material: 'boot' },
      { bone: shin, shape: 'roundBox', at: [0, -0.196, 0.045], half: [0.079, 0.014, 0.113], round: 0.012, material: 'sole' },
    ]),
  ],
  paints: [
    /* little red rivets on the bill and vent dots on the boots */
    ...[-1, 1].flatMap((s): PaintSpec[] => [
      { bone: 'head', on: ['bill'], kind: 'sphere', at: [s * 0.208, 0.085, -0.13], radius: 0.013, color: '#c8261a', soft: 0.2 },
      { bone: 'head', on: ['bill'], kind: 'sphere', at: [s * 0.208, 0.085, -0.18], radius: 0.013, color: '#c8261a', soft: 0.2 },
    ]),
    ...['shinL', 'shinR'].flatMap((bone) =>
      [[-0.03, 0.1], [0.03, 0.1], [0, 0.13], [-0.03, 0.06], [0.03, 0.06]].map(([x, z]): PaintSpec => ({
        bone, on: ['boot'], kind: 'sphere', at: [x, -0.13, z], radius: 0.011, color: '#c23a14', soft: 0.25,
      })),
    ),
    /* screw heads at the corners of the body */
    ...[-1, 1].map((s): PaintSpec => ({ bone: 'body', on: ['bodyShell'], kind: 'sphere', at: [s * 0.15, 0.03, 0.13], radius: 0.009, color: '#8d9198', soft: 0.2 })),
  ],
  /* the dark lens behind each ring: it narrows to blink */
  eyes: {
    kind: 'bead',
    bone: 'head',
    at: [[-0.228, 0.225, 0.165], [0.228, 0.225, 0.165]],
    radii: [0.048, 0.048, 0.048],
    material: 'lens',
  },
  anchors: {
    top: { bone: 'head', at: [0.1, 0.42, 0.08] },
    mouth: { bone: 'head', at: [0, 0.06, 0.45] },
    ear: { bone: 'head', at: [-0.24, 0.2, 0.05] },
    feet: { bone: 'root', at: [0, 0.02, 0.08] },
    chest: { bone: 'body', at: [0, 0.12, 0.16] },
    neck: { bone: 'neck0', at: [0.05, 0.08, 0.05] },
  },
  acting: {
    /* weight shifting from boot to boot, the head bobbing on its servos */
    idle: {
      body: { rz: [0, 0.03, 0.45, 0] },
      neck0: { rx: [0, 0.04, 0.9, 0] },
    },
    /* head cocked, bill ajar, one boot tapping */
    thinking: {
      head: { rz: 0.22, rx: -0.1 },
      jaw: { rx: 0.06 },
      legR: { rx: [-0.05, 0.05, 2.4, 0] },
      shinR: { rx: [0.05, 0.05, 2.4, Math.PI] },
    },
    /* one lens turned to the sound */
    listening: {
      head: { rz: -0.24, ry: 0.2 },
      neck0: { rx: 0.1 },
    },
    speaking: {
      neck0: { rx: [0, 0.05, 1.6, 0] },
      body: { rz: [0, 0.03, 0.8, 0] },
    },
    /* powered down: the neck folds and the head rests on its chest */
    sleeping: {
      neck0: { rx: 0.08 },
      neck1: { rx: 0.05 },
      head: { rz: 0.12 },
      legL: { rx: -0.12 },
      shinL: { rx: 0.24 },
      legR: { rx: -0.12 },
      shinR: { rx: 0.24 },
    },
    /* pecking at a keyboard */
    working: {
      neck0: { rx: [0.1, 0.06, 4.2, 0] },
      neck1: { rx: [0.04, 0.04, 4.2, 0.6] },
      jaw: { rx: [0.03, 0.03, 8.4, 0] },
    },
    /* a fault: knock-kneed, bill hanging, head twitching on a stuck servo */
    error: {
      head: { rz: [0.2, 0.06, 9, 0] },
      jaw: { rx: 0.06 },
      legL: { rz: 0.1 },
      legR: { rz: -0.1 },
      neck0: { rx: 0.12 },
    },
    /* the neck shoots up and the bill drops open */
    surprised: {
      neck0: { rx: -0.15 },
      head: { rx: 0.05 },
    },
    /* marching in place, head bopping side to side */
    celebrating: {
      legL: { rx: [-0.25, 0.25, 2.4, 0] },
      shinL: { rx: [0.25, 0.25, 2.4, Math.PI] },
      legR: { rx: [-0.25, 0.25, 2.4, Math.PI] },
      shinR: { rx: [0.25, 0.25, 2.4, 0] },
      head: { rz: [0, 0.2, 1.2, 0] },
    },
    /* the neck sinks and the knees give a little */
    sad: {
      head: { rz: -0.1 },
      legL: { rx: -0.08 },
      shinL: { rx: 0.16 },
      legR: { rx: -0.08 },
      shinR: { rx: 0.16 },
    },
    /* a happy stomp and a clack of the bill */
    happy: {
      legL: { rx: [-0.2, 0.2, 4, 0] },
      shinL: { rx: [0.2, 0.2, 4, Math.PI] },
      legR: { rx: [-0.2, 0.2, 4, Math.PI] },
      shinR: { rx: [0.2, 0.2, 4, 0] },
      jaw: { rx: [0.08, 0.08, 8, 0] },
    },
  },
  fx: {
    /* a robot shorts out with sparks from its neck */
    error: [
      { glyph: 'spark', anchor: 'neck', rate: 5, spread: 0.03, velocity: [0.25, 0.3, 0.1], jitter: 0.8, gravity: 2, life: [0.2, 0.35], size: [0.03, 0.012], color: '#ffd166', glow: true, align: true },
    ],
    working: [
      { glyph: 'dot', anchor: 'chest', rate: 1.6, offset: [0, 0.02, 0.02], spread: 0.03, velocity: [0, 0.1, 0.06], jitter: 0.02, life: [0.7, 0.9], size: [0.012, 0.004], color: '#ffb27a', glow: true },
    ],
  },
};

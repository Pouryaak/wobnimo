import type { CharacterSpec } from '@wobnimo/engine';

/** A plush cat: soft fur, big green eyes, ears that talk and a tail that never stops. */
export const miso: CharacterSpec = {
  id: 'miso',
  name: 'Miso',
  tagline: 'A plush tabby with velvet fur, swivelling ears and a tail that never sits still',
  accent: '#e38b3c',
  frame: { target: 0.56, radius: 0.72 },
  bound: { y: 0.52, radius: 0.88 },
  motion: { hop: 0.14, squash: 1.2, snap: 1.1, talkSquash: 0.3 },
  materials: {
    /* matte plush: almost no highlight, a velvet glow at the edges where
       the fibres catch the light, and a little light through the fluff */
    fur: { color: '#eaa15c', f0: 0.015, spec: 0.06, shininess: 6, rim: 1.1, sheen: 0.95, gloss: 0, sss: 0.18, sssColor: '#ffcf9e' },
    cream: { color: '#fbe8d0', f0: 0.015, spec: 0.06, shininess: 6, rim: 1, sheen: 0.9, gloss: 0, sss: 0.18, sssColor: '#ffe6cc' },
    pink: { color: '#ff9fb2', f0: 0.04, spec: 0.5, shininess: 40, rim: 0.4, sss: 0.4, sssColor: '#ffc4cf' },
    nose: { color: '#f27a93', f0: 0.06, spec: 1.6, shininess: 160, rim: 0.3, gloss: 0.8 },
    whisker: { color: '#fff8ee', f0: 0.04, spec: 0.6, shininess: 60, rim: 0.5 },
  },
  bones: [
    { name: 'body', pivot: [0, 0, 0], drive: { ry: [['yaw', 0.2]], rz: [['roll', 0.25]] } },
    { name: 'head', parent: 'body', pivot: [0, 0.5, 0.02], drive: { rx: [['pitch', -1]], ry: [['yaw', 0.85]], rz: [['roll', 0.8]] } },
    /* ears twitch on their own every so often, and flick with every hop */
    {
      name: 'earL', parent: 'head', pivot: [-0.19, 0.38, -0.02], rest: { rz: 0.32 }, wave: { rx: [0.06, 0.37, 0] },
      jiggle: { axis: [0, 1, 0], length: 0.16, freq: 3.2, damping: 0.16, maxAngle: 0.5 },
    },
    {
      name: 'earR', parent: 'head', pivot: [0.19, 0.38, -0.02], rest: { rz: -0.32 }, wave: { rx: [0.06, 0.29, 2] },
      jiggle: { axis: [0, 1, 0], length: 0.16, freq: 3.2, damping: 0.16, maxAngle: 0.5 },
    },
    { name: 'pawL', parent: 'body', pivot: [-0.13, 0.22, 0.17], drive: { rx: [['flap', -1.2]], rz: [['flap', -0.4]] } },
    { name: 'pawR', parent: 'body', pivot: [0.13, 0.22, 0.17], drive: { rx: [['flap', -1.2]], rz: [['flap', 0.4]] } },
    /* the tail: three links, each lagging the one before */
    { name: 'tail0', parent: 'body', pivot: [0.12, 0.1, -0.24], rest: { rx: -0.5, rz: -0.5 }, wave: { rz: [0.25, 0.45, 0] }, jiggle: { axis: [0, 1, 0], length: 0.16, freq: 2, damping: 0.25, maxAngle: 0.7 } },
    { name: 'tail1', parent: 'tail0', pivot: [0, 0.16, 0], rest: { rx: -0.3 }, wave: { rz: [0.2, 0.45, 0.8] }, jiggle: { axis: [0, 1, 0], length: 0.15, freq: 1.8, damping: 0.22, maxAngle: 0.8 } },
    { name: 'tail2', parent: 'tail1', pivot: [0, 0.15, 0], rest: { rx: 0.25 }, wave: { rz: [0.3, 0.45, 1.6] }, jiggle: { axis: [0, 1, 0], length: 0.13, freq: 1.6, damping: 0.2, maxAngle: 0.9 } },
  ],
  parts: [
    /* a round sitting body with haunches and big back feet */
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.25, -0.02], radii: [0.29, 0.26, 0.26], material: 'fur' },
    { bone: 'body', shape: 'ellipsoid', at: [-0.17, 0.13, -0.02], radii: [0.14, 0.13, 0.19], blend: 0.08, material: 'fur' },
    { bone: 'body', shape: 'ellipsoid', at: [0.17, 0.13, -0.02], radii: [0.14, 0.13, 0.19], blend: 0.08, material: 'fur' },
    { bone: 'body', shape: 'ellipsoid', at: [-0.17, 0.04, 0.14], radii: [0.085, 0.05, 0.11], blend: 0.03, material: 'cream' },
    { bone: 'body', shape: 'ellipsoid', at: [0.17, 0.04, 0.14], radii: [0.085, 0.05, 0.11], blend: 0.03, material: 'cream' },
    /* a big head with chubby cheeks and a muzzle */
    { bone: 'head', shape: 'ellipsoid', at: [0, 0.2, 0], radii: [0.34, 0.28, 0.29], blend: 0.1, material: 'fur' },
    { bone: 'head', shape: 'sphere', at: [-0.17, 0.1, 0.12], radius: 0.15, blend: 0.1, material: 'fur' },
    { bone: 'head', shape: 'sphere', at: [0.17, 0.1, 0.12], radius: 0.15, blend: 0.1, material: 'fur' },
    { bone: 'head', shape: 'ellipsoid', at: [0, 0.09, 0.22], radii: [0.12, 0.075, 0.08], blend: 0.05, material: 'cream' },
    { bone: 'head', shape: 'ellipsoid', at: [0, 0.135, 0.3], rot: [0.3, 0, 0], radii: [0.032, 0.02, 0.018], blend: 0.01, material: 'nose' },
    /* ears, with pink insides */
    { bone: 'earL', shape: 'roundCone', from: [0, 0, 0], to: [0, 0.15, 0], r1: 0.1, r2: 0.022, blend: 0.05, material: 'fur' },
    { bone: 'earL', shape: 'ellipsoid', at: [0, 0.055, 0.045], radii: [0.05, 0.075, 0.03], material: 'pink' },
    { bone: 'earR', shape: 'roundCone', from: [0, 0, 0], to: [0, 0.15, 0], r1: 0.1, r2: 0.022, blend: 0.05, material: 'fur' },
    { bone: 'earR', shape: 'ellipsoid', at: [0, 0.055, 0.045], radii: [0.05, 0.075, 0.03], material: 'pink' },
    /* front paws, cream mittens */
    { bone: 'pawL', shape: 'capsule', from: [0, 0, 0], to: [0, -0.15, 0.03], radius: 0.065, blend: 0.05, material: 'fur' },
    { bone: 'pawL', shape: 'ellipsoid', at: [0, -0.17, 0.05], radii: [0.07, 0.05, 0.075], blend: 0.03, material: 'cream' },
    { bone: 'pawR', shape: 'capsule', from: [0, 0, 0], to: [0, -0.15, 0.03], radius: 0.065, blend: 0.05, material: 'fur' },
    { bone: 'pawR', shape: 'ellipsoid', at: [0, -0.17, 0.05], radii: [0.07, 0.05, 0.075], blend: 0.03, material: 'cream' },
    /* the tail, thick at the root, with a cream tip */
    { bone: 'tail0', shape: 'roundCone', from: [0, 0, 0], to: [0, 0.16, 0], r1: 0.055, r2: 0.05, blend: 0.04, material: 'fur' },
    { bone: 'tail1', shape: 'roundCone', from: [0, 0, 0], to: [0, 0.15, 0], r1: 0.05, r2: 0.047, blend: 0.02, material: 'fur' },
    { bone: 'tail2', shape: 'roundCone', from: [0, 0, 0], to: [0, 0.12, 0], r1: 0.047, r2: 0.04, blend: 0.02, material: 'cream' },
    /* whiskers */
    { bone: 'head', shape: 'capsule', from: [-0.13, 0.1, 0.27], to: [-0.33, 0.13, 0.24], radius: 0.005, material: 'whisker' },
    { bone: 'head', shape: 'capsule', from: [-0.13, 0.08, 0.27], to: [-0.33, 0.06, 0.23], radius: 0.005, material: 'whisker' },
    { bone: 'head', shape: 'capsule', from: [0.13, 0.1, 0.27], to: [0.33, 0.13, 0.24], radius: 0.005, material: 'whisker' },
    { bone: 'head', shape: 'capsule', from: [0.13, 0.08, 0.27], to: [0.33, 0.06, 0.23], radius: 0.005, material: 'whisker' },
  ],
  paints: [
    /* tabby stripes on the forehead and a cream belly */
    { bone: 'head', on: ['fur'], kind: 'ellipse', at: [0, 0.4, 0.2], radii: [0.022, 0.08], color: '#c4733a', soft: 0.5 },
    { bone: 'head', on: ['fur'], kind: 'ellipse', at: [-0.075, 0.38, 0.2], radii: [0.018, 0.065], color: '#c4733a', soft: 0.5 },
    { bone: 'head', on: ['fur'], kind: 'ellipse', at: [0.075, 0.38, 0.2], radii: [0.018, 0.065], color: '#c4733a', soft: 0.5 },
    { bone: 'body', on: ['fur'], kind: 'ellipse', at: [0, 0.24, 0.2], radii: [0.17, 0.2], color: '#fbe8d0', soft: 0.35 },
    { bone: 'head', on: ['fur'], kind: 'sphere', at: [-0.21, 0.1, 0.24], radius: 0.06, color: '#ff9db0', soft: 0.6, opacity: 0.75 },
    { bone: 'head', on: ['fur'], kind: 'sphere', at: [0.21, 0.1, 0.24], radius: 0.06, color: '#ff9db0', soft: 0.6, opacity: 0.75 },
  ],
  eyes: {
    kind: 'ball',
    bone: 'head',
    at: [[-0.125, 0.22, 0.2], [0.125, 0.22, 0.2]],
    radius: 0.088,
    iris: '#8ccf4d',
    irisSize: 0.78,
    pupilSize: 0.42,
    pupilAspect: 0.5,
    lid: 'fur',
  },
  face: {
    kind: 'mouth',
    bone: 'head',
    on: ['cream'],
    at: [0, 0.06, 0.29],
    width: 0.045,
    color: '#5b2630',
    tongue: '#ff8ea3',
  },
  anchors: {
    top: { bone: 'head', at: [0.2, 0.42, 0.08] },
    mouth: { bone: 'head', at: [0, 0.06, 0.32] },
    ear: { bone: 'head', at: [-0.34, 0.25, 0] },
    feet: { bone: 'root', at: [0, 0.03, 0.18] },
    tail: { bone: 'tail2', at: [0, 0.12, 0] },
  },
  acting: {
    idle: { tail0: { rz: [-0.5, 0.15, 0.4, 0] } },
    /* a paw up to the chin, the tail tip tapping */
    thinking: {
      pawR: { rx: -1.75, rz: 0.35 },
      tail2: { rx: [0.25, 0.3, 1.6, 0] },
      earL: { ry: 0.5 },
    },
    /* both ears swivel forward, one turned to catch the sound */
    listening: {
      earL: { rx: -0.35, ry: -0.6 },
      earR: { rx: -0.35 },
      tail0: { rz: -0.35 },
    },
    speaking: {
      pawL: { rx: [-0.4, 0.25, 1.2, 0] },
      pawR: { rx: [-0.3, 0.25, 1.2, 1.9] },
      tail0: { rz: [-0.5, 0.2, 0.9, 0] },
    },
    /* ears folded flat, tail wrapped round the front */
    sleeping: {
      earL: { rz: 0.5, rx: 0.4 },
      earR: { rz: -0.5, rx: 0.4 },
      tail0: { rx: 0.4, rz: -1.2 },
      tail1: { rx: 0.5 },
    },
    /* kneading: making biscuits, paw after paw */
    working: {
      pawL: { rx: [-0.35, 0.3, 3.4, 0] },
      pawR: { rx: [-0.35, 0.3, 3.4, Math.PI] },
      earL: { rx: -0.25 },
      earR: { rx: -0.25 },
      tail2: { rx: [0.25, 0.2, 1.7, 0] },
    },
    /* airplane ears and a tail stood straight up, bristling */
    error: {
      earL: { rz: 1.1, rx: 0.3 },
      earR: { rz: -1.1, rx: 0.3 },
      tail0: { rx: [-0.9, 0.05, 12, 0], rz: 0 },
      tail1: { rx: 0.3 },
      tail2: { rx: 0.2 },
    },
    surprised: {
      earL: { rz: -0.1, rx: -0.2 },
      earR: { rz: 0.1, rx: -0.2 },
      pawL: { rx: -1.4, rz: -0.4 },
      pawR: { rx: -1.4, rz: 0.4 },
      tail0: { rx: -0.9, rz: 0 },
    },
    celebrating: {
      pawL: { rx: [-2.2, 0.35, 4, 0], rz: -0.5 },
      pawR: { rx: [-2.2, 0.35, 4, Math.PI], rz: 0.5 },
      tail0: { rz: [-0.4, 0.5, 2.6, 0] },
    },
    /* ears droop out to the sides, the tail lies flat on the floor */
    sad: {
      earL: { rz: 0.95, rx: 0.35 },
      earR: { rz: -0.95, rx: 0.35 },
      tail0: { rx: 0.7, rz: -0.8 },
      tail1: { rx: 0.3 },
      tail2: { rx: 0.1 },
    },
    happy: {
      pawL: { rx: [-1.6, 0.3, 5, 0] },
      pawR: { rx: [-1.6, 0.3, 5, 1.4] },
      tail0: { rz: [-0.5, 0.45, 3, 0] },
    },
  },
  fx: {
    happy: [{ glyph: 'heart', anchor: 'top', rate: 1.2, spread: 0.15, velocity: [0, 0.22, 0.05], jitter: 0.12, wobble: 0.06, life: [1, 1.3], size: [0.04, 0.07], color: '#ff86a2' }],
  },
};

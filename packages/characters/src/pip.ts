import type { CharacterSpec } from '@animo/engine';

/** A round songbird chick: soft feathers, flapping wings, a beak that talks. */
export const pip: CharacterSpec = {
  id: 'pip',
  name: 'Pip',
  tagline: 'Sings with a real beak, snaps its head like a bird, flaps',
  accent: '#e8892a',
  frame: { target: 0.66, radius: 0.86 },
  bound: { y: 0.62, radius: 0.92 },
  motion: { hop: 0.13, squash: 1.1, snap: 1.25, snapLook: 1, talkSquash: 0.5 },
  materials: {
    feather: { color: '#f4a63c', f0: 0.03, spec: 0.22, shininess: 14, rim: 0.9, sheen: 0.55 },
    wing: { color: '#d8692a', f0: 0.03, spec: 0.25, shininess: 16, rim: 0.8, sheen: 0.5 },
    beak: { color: '#ff7a45', f0: 0.05, spec: 0.9, shininess: 70, rim: 0.4, gloss: 0.6 },
    feet: { color: '#e9683b', f0: 0.04, spec: 0.6, shininess: 40, rim: 0.3 },
    mouth: { color: '#6b1a26', f0: 0.04, spec: 0.6, shininess: 40, rim: 0 },
    tongue: { color: '#ff7f91', f0: 0.05, spec: 1, shininess: 60, rim: 0.2, gloss: 0.6 },
  },
  bones: [
    { name: 'body', pivot: [0, 0, 0], drive: { rz: [['roll', 0.3]], rx: [['pitch', -0.12]] } },
    { name: 'head', parent: 'body', pivot: [0, 0.62, 0], drive: { rx: [['pitch', -1]], ry: [['yaw', 0.9]], rz: [['roll', 0.8]] } },
    /* the beak opens both ways: the jaw drops and the top lifts a little */
    { name: 'beak', parent: 'head', pivot: [0, 0.155, 0.31], drive: { rx: [['talk', -0.2]] } },
    { name: 'jaw', parent: 'head', pivot: [0, 0.122, 0.315], drive: { rx: [['talk', 0.85]] } },
    { name: 'tuft', parent: 'head', pivot: [0, 0.5, 0.04], rest: { rx: 0.25 }, jiggle: { axis: [0, 1, 0], length: 0.14, freq: 3, damping: 0.14 } },
    {
      name: 'wingL', parent: 'body', pivot: [-0.38, 0.6, -0.02],
      drive: { rz: [['flap', -1.5]] }, wave: { rz: [0.04, 0.8, 0] },
      jiggle: { axis: [0, -1, 0], length: 0.3, freq: 3.2, damping: 0.3, maxAngle: 0.5 },
    },
    {
      name: 'wingR', parent: 'body', pivot: [0.38, 0.6, -0.02],
      drive: { rz: [['flap', 1.5]] }, wave: { rz: [-0.04, 0.8, 1.1] },
      jiggle: { axis: [0, -1, 0], length: 0.3, freq: 3.2, damping: 0.3, maxAngle: 0.5 },
    },
    { name: 'tail', parent: 'body', pivot: [0, 0.3, -0.36], rest: { rx: -0.95 }, jiggle: { axis: [0, 1, 0], length: 0.18, freq: 2.6, damping: 0.18 } },
  ],
  parts: [
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.42, 0], radii: [0.45, 0.41, 0.42], material: 'feather' },
    { bone: 'head', shape: 'sphere', at: [0, 0.18, 0.03], radius: 0.35, blend: 0.18, material: 'feather' },
    /* inside the beak: a dark mouth and a tongue, seen only when it opens */
    { bone: 'head', shape: 'sphere', at: [0, 0.128, 0.322], radius: 0.044, material: 'mouth' },
    /* a beak in two halves that hinge apart */
    { bone: 'beak', shape: 'roundCone', from: [0, 0, 0], to: [0, -0.018, 0.15], r1: 0.062, r2: 0.01, material: 'beak' },
    { bone: 'jaw', shape: 'roundCone', from: [0, -0.018, 0.0], to: [0, -0.032, 0.105], r1: 0.044, r2: 0.009, material: 'beak' },
    { bone: 'jaw', shape: 'ellipsoid', at: [0, 0.018, 0.035], radii: [0.025, 0.012, 0.032], material: 'tongue' },
    /* a tuft of three feathers */
    { bone: 'tuft', shape: 'roundCone', from: [0, -0.04, 0], to: [0.015, 0.12, 0.03], r1: 0.045, r2: 0.01, blend: 0.03, material: 'feather' },
    { bone: 'tuft', shape: 'roundCone', from: [0, -0.04, -0.02], to: [-0.05, 0.08, -0.05], r1: 0.035, r2: 0.008, blend: 0.03, material: 'feather' },
    { bone: 'tuft', shape: 'roundCone', from: [0, -0.04, -0.02], to: [0.06, 0.07, -0.04], r1: 0.03, r2: 0.008, blend: 0.03, material: 'feather' },
    /* wings hinge at the shoulder and lie against the body */
    { bone: 'wingL', shape: 'ellipsoid', at: [-0.02, -0.17, 0], rot: [0, 0, -0.18], radii: [0.08, 0.23, 0.2], blend: 0.02, material: 'wing' },
    { bone: 'wingR', shape: 'ellipsoid', at: [0.02, -0.17, 0], rot: [0, 0, 0.18], radii: [0.08, 0.23, 0.2], blend: 0.02, material: 'wing' },
    { bone: 'tail', shape: 'ellipsoid', at: [0, 0.1, 0], radii: [0.14, 0.12, 0.035], blend: 0.04, material: 'wing' },
    /* three toes a foot */
    { bone: 'root', shape: 'capsule', from: [-0.15, 0.03, 0.12], to: [-0.2, 0.025, 0.25], radius: 0.026, material: 'feet' },
    { bone: 'root', shape: 'capsule', from: [-0.15, 0.03, 0.12], to: [-0.12, 0.025, 0.26], radius: 0.026, material: 'feet' },
    { bone: 'root', shape: 'capsule', from: [-0.15, 0.03, 0.12], to: [-0.15, 0.06, 0.02], radius: 0.03, blend: 0.02, material: 'feet' },
    { bone: 'root', shape: 'capsule', from: [0.15, 0.03, 0.12], to: [0.2, 0.025, 0.25], radius: 0.026, material: 'feet' },
    { bone: 'root', shape: 'capsule', from: [0.15, 0.03, 0.12], to: [0.12, 0.025, 0.26], radius: 0.026, material: 'feet' },
    { bone: 'root', shape: 'capsule', from: [0.15, 0.03, 0.12], to: [0.15, 0.06, 0.02], radius: 0.03, blend: 0.02, material: 'feet' },
  ],
  paints: [
    { bone: 'body', on: ['feather'], kind: 'ellipse', at: [0, 0.3, 0], radii: [0.29, 0.28], color: '#fde7c0', soft: 0.07 },
    { bone: 'head', on: ['feather'], kind: 'sphere', at: [-0.22, 0.08, 0.27], radius: 0.075, color: '#ff8c8c', soft: 0.6, opacity: 0.75 },
    { bone: 'head', on: ['feather'], kind: 'sphere', at: [0.22, 0.08, 0.27], radius: 0.075, color: '#ff8c8c', soft: 0.6, opacity: 0.75 },
  ],
  eyes: {
    kind: 'ball',
    bone: 'head',
    at: [[-0.14, 0.24, 0.3], [0.14, 0.24, 0.3]],
    radius: 0.078,
    iris: '#4a2a12',
    irisSize: 0.72,
    pupilSize: 0.42,
    lid: 'feather',
  },
  anchors: {
    top: { bone: 'head', at: [0.14, 0.5, 0.1] },
    mouth: { bone: 'head', at: [0, 0.13, 0.47] },
    ear: { bone: 'head', at: [-0.32, 0.22, 0] },
    feet: { bone: 'root', at: [0, 0.02, 0.12] },
    chest: { bone: 'body', at: [0, 0.45, 0.32] },
  },
  acting: {
    idle: {
      tail: { rx: [0, 0.14, 1.3, 0] },
    },
    /* a wing tip to the chin */
    thinking: {
      wingR: { rz: 1.05, rx: -0.95, ry: -0.35 },
      tuft: { rx: 0.25 },
      tail: { rx: [0, 0.08, 0.5, 0] },
    },
    /* a wing cupped by the ear, the tuft perked */
    listening: {
      wingL: { rz: -1.1, rx: -0.55 },
      tuft: { rx: -0.4 },
      head: { rz: 0.12 },
    },
    /* singing: chin up, wings fluttering, tail keeping time */
    speaking: {
      head: { rx: [-0.14, 0.05, 1.1, 0] },
      wingL: { rz: [-0.18, 0.14, 2.3, 0] },
      wingR: { rz: [0.18, 0.14, 2.3, 1.2] },
      tail: { rx: [0, 0.22, 2.3, 0.5] },
    },
    /* fluffed up, head tucked, wings folded in front */
    sleeping: {
      wingL: { ry: 0.5, rz: 0.12 },
      wingR: { ry: -0.5, rz: -0.12 },
      tuft: { rx: 0.75 },
    },
    happy: {
      wingL: { rz: [-0.9, 0.75, 7, 0] },
      wingR: { rz: [0.9, 0.75, 7, 0] },
      tail: { rx: [0, 0.3, 5, 0] },
      tuft: { rx: [0, 0.2, 5, 0] },
    },
  },
  fx: {
    replace: ['syllable'],
    /* it sings: a note on every other syllable */
    syllable: [
      { glyph: 'note', anchor: 'mouth', rate: 1, offset: [0.06, 0.04, 0.04], velocity: [0.14, 0.2, 0.05], jitter: 0.06, wobble: 0.07, life: [1.1, 1.5], size: [0.045, 0.075], rotation: -0.15, color: '#f08a3c' },
    ],
    happy: [{ glyph: 'note', anchor: 'mouth', rate: 1.6, velocity: [0, 0.24, 0.05], jitter: 0.25, wobble: 0.07, life: [1, 1.3], size: [0.04, 0.07], rotation: 0.15, color: '#e8664a' }],
    'enter:happy': [
      { glyph: 'feather', anchor: 'chest', rate: 4, spread: 0.12, velocity: [0, 0.18, 0.12], jitter: 0.45, gravity: 0.12, drag: 1.4, wobble: 0.14, life: [1.8, 2.4], size: [0.05, 0.05], spin: 1.6, color: '#f6b04a' },
    ],
  },
};

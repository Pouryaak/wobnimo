import type { CharacterSpec } from '@wobnimo/engine';

/** A floating ghost with a rippling hem and little arms. */
export const boo: CharacterSpec = {
  id: 'boo',
  name: 'Boo',
  tagline: 'Floats, glows from inside, trails motes, a hem that ripples',
  accent: '#8a6cf0',
  frame: { target: 0.78, radius: 0.92 },
  bound: { y: 0.72, radius: 0.72 },
  motion: { float: 0.22, hop: 0.12, squash: 0.8, snap: 0.8, talkSquash: 0.6 },
  glowPool: 0.55,
  materials: {
    ghost: { color: '#eceaff', f0: 0.04, spec: 0.5, shininess: 30, rim: 1.4, sss: 0.4, sssColor: '#b9a4ff', emit: '#6f52d9', emitStrength: 0.06 },
    bead: { color: '#1b1430', f0: 0.06, spec: 2.2, shininess: 400, rim: 0.2, gloss: 1 },
  },
  bones: [
    { name: 'body', pivot: [0, 0, 0], drive: { rx: [['pitch', -0.5]], ry: [['yaw', 0.7]], rz: [['roll', 0.6]] }, wave: { rz: [0.03, 0.45, 0] } },
    {
      name: 'armL', parent: 'body', pivot: [-0.36, 0.74, 0.04],
      drive: { rz: [['flap', -1.2]] }, wave: { rz: [0.08, 0.7, 0] },
      jiggle: { axis: [-0.8, -0.6, 0], length: 0.15, freq: 2, damping: 0.2, maxAngle: 0.7 },
    },
    {
      name: 'armR', parent: 'body', pivot: [0.36, 0.74, 0.04],
      drive: { rz: [['flap', 1.2]] }, wave: { rz: [-0.08, 0.7, 1.6] },
      jiggle: { axis: [0.8, -0.6, 0], length: 0.15, freq: 2, damping: 0.2, maxAngle: 0.7 },
    },
  ],
  parts: [
    { bone: 'body', shape: 'sphere', at: [0, 0.88, 0], radius: 0.4, material: 'ghost' },
    { bone: 'body', shape: 'roundCone', from: [0, 0.88, 0], to: [0, 0.4, 0], r1: 0.4, r2: 0.47, material: 'ghost' },
    { bone: 'body', shape: 'hem', y: 0.34, amplitude: 0.045, waves: 6, speed: 2.4, blend: 0.05, material: 'ghost' },
    { bone: 'armL', shape: 'capsule', from: [0, 0, 0], to: [-0.12, -0.09, 0.02], radius: 0.07, blend: 0.08, material: 'ghost' },
    { bone: 'armR', shape: 'capsule', from: [0, 0, 0], to: [0.12, -0.09, 0.02], radius: 0.07, blend: 0.08, material: 'ghost' },
  ],
  paints: [
    { bone: 'body', on: ['ghost'], kind: 'sphere', at: [-0.24, 0.78, 0.31], radius: 0.07, color: '#ffa3c4', soft: 0.6, opacity: 0.7 },
    { bone: 'body', on: ['ghost'], kind: 'sphere', at: [0.24, 0.78, 0.31], radius: 0.07, color: '#ffa3c4', soft: 0.6, opacity: 0.7 },
  ],
  eyes: {
    kind: 'bead',
    bone: 'body',
    at: [[-0.135, 0.9, 0.375], [0.135, 0.9, 0.375]],
    radii: [0.048, 0.072, 0.03],
    material: 'bead',
  },
  face: {
    kind: 'mouth',
    bone: 'body',
    on: ['ghost'],
    at: [0, 0.77, 0.38],
    width: 0.075,
    color: '#2a1a4a',
    tongue: '#ff7fa6',
  },
  anchors: {
    top: { bone: 'body', at: [0.16, 1.2, 0.1] },
    mouth: { bone: 'body', at: [0, 0.77, 0.4] },
    ear: { bone: 'body', at: [-0.42, 0.92, 0] },
    center: { bone: 'body', at: [0, 0.8, 0] },
  },
  acting: {
    idle: { armL: { rz: [0, 0.1, 0.7, 0] }, armR: { rz: [0, 0.1, 0.7, 1.3] } },
    thinking: { armR: { ry: -1.1, rz: 0.9 }, armL: { rz: 0.25 } },
    listening: { armL: { rz: -1, rx: -0.35 } },
    speaking: {
      armL: { rz: [-0.3, 0.3, 1.2, 0], rx: [-0.3, 0.2, 0.9, 0] },
      armR: { rz: [0.3, 0.3, 1.2, 1.7], rx: [-0.3, 0.2, 0.9, 2.2] },
    },
    sleeping: { armL: { rz: 0.4 }, armR: { rz: -0.4 }, body: { rz: 0.08 } },
    working: { armL: { rx: [-0.6, 0.15, 6, 0], rz: -0.3 }, armR: { rx: [-0.6, 0.15, 6, Math.PI], rz: 0.3 } },
    error: { armL: { rz: [-1.0, 0.25, 10, 0] }, armR: { rz: [1.0, 0.25, 10, 1] } },
    /* hands to its cheeks */
    surprised: { armL: { rz: -1.4, rx: -0.4 }, armR: { rz: 1.4, rx: -0.4 } },
    celebrating: { armL: { rz: [-1.6, 0.3, 4, 0] }, armR: { rz: [1.6, 0.3, 4, Math.PI] } },
    sad: { armL: { rz: 0.5 }, armR: { rz: -0.5 }, body: { rz: 0.05 } },
    happy: { armL: { rz: [-1.3, 0.35, 3, 0] }, armR: { rz: [1.3, 0.35, 3, 1.2] } },
  },
  fx: {
    /* glowing motes drift around it all the time */
    ambient: [{ glyph: 'mote', anchor: 'center', rate: 1.3, spread: 0.5, velocity: [0, 0.07, 0], jitter: 0.06, wobble: 0.09, life: [2.2, 3.2], size: [0.04, 0.02], color: '#b49cff', glow: true }],
    happy: [{ glyph: 'heart', anchor: 'top', rate: 1.2, spread: 0.2, velocity: [0, 0.22, 0.05], jitter: 0.12, wobble: 0.06, life: [1, 1.3], size: [0.04, 0.07], color: '#ff86b0' }],
  },
};

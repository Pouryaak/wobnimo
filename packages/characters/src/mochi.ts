import type { CharacterSpec } from '@wobnimo/engine';

/** A drop of jelly with a sprout on top: all squash, stretch and wobble. */
export const mochi: CharacterSpec = {
  id: 'mochi',
  name: 'Mochi',
  tagline: 'Translucent jelly that squashes and splashes, with a propeller sprout',
  accent: '#1fae8a',
  frame: { target: 0.56, radius: 0.8 },
  bound: { y: 0.5, radius: 0.82 },
  motion: { hop: 0.17, squash: 1.9, snap: 0.9, talkSquash: 1.3 },
  materials: {
    jelly: { color: '#3fcf9f', f0: 0.06, spec: 1.6, shininess: 140, rim: 0.7, sss: 0.55, sssColor: '#9effd9', gloss: 0.9 },
    bead: { color: '#120d18', f0: 0.06, spec: 2.2, shininess: 400, rim: 0.2, gloss: 1 },
    leaf: { color: '#5bbf3a', f0: 0.04, spec: 0.7, shininess: 50, rim: 0.6, sss: 0.25, sssColor: '#c8ff7a' },
  },
  bones: [
    { name: 'body', pivot: [0, 0, 0], drive: { rx: [['pitch', -0.35]], ry: [['yaw', 0.55]], rz: [['roll', 0.6]] } },
    { name: 'sprout', parent: 'body', pivot: [0, 0.83, -0.02], jiggle: { axis: [0, 1, 0], length: 0.16, freq: 2.2, damping: 0.09 } },
  ],
  parts: [
    { bone: 'body', shape: 'sphere', at: [0, 0.41, 0], radius: 0.42, material: 'jelly' },
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.17, 0], radii: [0.5, 0.17, 0.47], blend: 0.24, material: 'jelly' },
    { bone: 'body', shape: 'roundCone', from: [0, 0.62, 0], to: [0, 0.83, -0.02], r1: 0.17, r2: 0.035, blend: 0.22, material: 'jelly' },
    { bone: 'sprout', shape: 'capsule', from: [0, -0.02, 0], to: [0, 0.09, 0], radius: 0.014, material: 'leaf' },
    { bone: 'sprout', shape: 'ellipsoid', at: [-0.065, 0.11, 0], rot: [0, 0.3, 0.5], radii: [0.075, 0.018, 0.042], blend: 0.015, material: 'leaf' },
    { bone: 'sprout', shape: 'ellipsoid', at: [0.07, 0.12, 0], rot: [0, -0.3, -0.45], radii: [0.08, 0.018, 0.045], blend: 0.015, material: 'leaf' },
  ],
  paints: [
    { bone: 'body', on: ['jelly'], kind: 'sphere', at: [-0.25, 0.32, 0.31], radius: 0.07, color: '#ff8fa8', soft: 0.6, opacity: 0.8 },
    { bone: 'body', on: ['jelly'], kind: 'sphere', at: [0.25, 0.32, 0.31], radius: 0.07, color: '#ff8fa8', soft: 0.6, opacity: 0.8 },
  ],
  eyes: {
    kind: 'bead',
    bone: 'body',
    at: [[-0.14, 0.43, 0.385], [0.14, 0.43, 0.385]],
    radii: [0.045, 0.066, 0.03],
    material: 'bead',
  },
  face: {
    kind: 'mouth',
    bone: 'body',
    on: ['jelly'],
    at: [0, 0.32, 0.4],
    width: 0.065,
    color: '#173528',
    tongue: '#ff7d97',
  },
  anchors: {
    top: { bone: 'body', at: [0.16, 0.86, 0.1] },
    mouth: { bone: 'body', at: [0, 0.32, 0.42] },
    ear: { bone: 'body', at: [-0.42, 0.45, 0] },
    feet: { bone: 'root', at: [0, 0.05, 0.25] },
  },
  acting: {
    idle: { sprout: { rz: [0, 0.1, 0.6, 0] } },
    /* the sprout spins like a propeller while it thinks */
    thinking: { sprout: { rx: -0.15, ry: [0, 0, 0, 0, 7] } },
    listening: { sprout: { rx: -0.4, rz: 0.15 } },
    speaking: { sprout: { rz: [0, 0.2, 2.4, 0] } },
    sleeping: { sprout: { rx: 0.85, rz: 0.35 } },
    happy: { sprout: { ry: [0, 0, 0, 0, 16] } },
  },
  fx: {
    replace: ['land'],
    /* it splashes when it lands */
    land: [{ glyph: 'drop', anchor: 'feet', rate: 7, spread: 0.18, velocity: [0, 0.65, 0.05], jitter: 0.7, gravity: 3.2, life: [0.45, 0.6], size: [0.035, 0.022], color: '#55d6ad', align: true }],
    'enter:happy': [{ glyph: 'drop', anchor: 'top', rate: 5, velocity: [0, 0.7, 0.05], jitter: 0.9, gravity: 3, life: [0.5, 0.7], size: [0.035, 0.02], color: '#6fe3bd', align: true }],
  },
};

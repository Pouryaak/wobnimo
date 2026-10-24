import type { CharacterSpec, PartSpec } from 'wobnimo';

/** A tiny potted cactus with a pink flower on its head. */
export const cacti: CharacterSpec = {
  id: 'cacti',
  name: 'Cacti',
  tagline: 'A tiny potted cactus with a pink flower that bounces on its head',
  accent: '#3fae6a',
  frame: { target: 0.52, radius: 0.69 },
  bound: { y: 0.52, radius: 0.61 },
  motion: { hop: 0.08, squash: 0.9, snap: 1, talkSquash: 0.5 },
  materials: {
    cactus: {
      color: '#4cb873', f0: 0.04, spec: 0.8, shininess: 60, rim: 0.8, sss: 0.2, sssColor: '#a8f0b0', gloss: 0.4,
      surface: { kind: 'speckle', scale: 30, strength: 0.4, color: '#2f8a52', bone: 'body' },
    },
    pot: { color: '#d9774a', f0: 0.03, spec: 0.4, shininess: 25, rim: 0.4 },
    rim: { color: '#e88a5c', shadeOf: 'pot', f0: 0.03, spec: 0.4, shininess: 25, rim: 0.4 },
    soil: { color: '#5b3a28', f0: 0.02, spec: 0.1, shininess: 8, rim: 0.2 },
    petal: { color: '#ff7eb6', f0: 0.04, spec: 0.6, shininess: 40, rim: 0.7, sss: 0.4, sssColor: '#ffc1dc', sheen: 0.4 },
    pollen: { color: '#ffd84d', f0: 0.04, spec: 0.5, shininess: 30, rim: 0.4 },
    bead: { color: '#141a14', f0: 0.06, spec: 2.2, shininess: 400, rim: 0.2, gloss: 1 },
  },
  bones: [
    { name: 'body', pivot: [0, 0.32, 0], drive: { rx: [['pitch', -0.3]], ry: [['yaw', 0.5]], rz: [['roll', 0.5]] }, wave: { rz: [0.025, 0.5, 0] } },
    { name: 'armL', parent: 'body', pivot: [-0.2, 0.25, 0], rest: { rz: 0.3 }, drive: { rz: [['flap', -0.8]] } },
    { name: 'armR', parent: 'body', pivot: [0.2, 0.18, 0], rest: { rz: -0.2 }, drive: { rz: [['flap', 0.8]] } },
    { name: 'flower', parent: 'body', pivot: [0.04, 0.56, 0], jiggle: { axis: [0, 1, 0], length: 0.1, freq: 3, damping: 0.14 } },
  ],
  parts: [
    /* a terracotta pot with a fat rim */
    { bone: 'root', shape: 'roundCone', from: [0, 0.03, 0], to: [0, 0.27, 0], r1: 0.2, r2: 0.25, clip: { normal: [0, -1, 0] }, material: 'pot' },
    { bone: 'root', shape: 'cylinder', at: [0, 0.3, 0], radius: 0.28, half: 0.05, round: 0.03, material: 'rim' },
    { bone: 'root', shape: 'cylinder', at: [0, 0.33, 0], radius: 0.24, half: 0.025, round: 0.01, material: 'soil' },
    /* the cactus: a tall rounded body */
    { bone: 'body', shape: 'capsule', from: [0, 0.05, 0], to: [0, 0.38, 0], radius: 0.2, material: 'cactus' },
    /* little arms */
    { bone: 'armL', shape: 'capsule', from: [0, 0, 0], to: [-0.1, 0, 0], radius: 0.065, blend: 0.04, material: 'cactus' },
    { bone: 'armL', shape: 'capsule', from: [-0.1, 0, 0], to: [-0.11, 0.12, 0], radius: 0.06, blend: 0.03, material: 'cactus' },
    { bone: 'armR', shape: 'capsule', from: [0, 0, 0], to: [0.1, 0, 0], radius: 0.06, blend: 0.04, material: 'cactus' },
    { bone: 'armR', shape: 'capsule', from: [0.1, 0, 0], to: [0.11, 0.1, 0], radius: 0.055, blend: 0.03, material: 'cactus' },
    /* a five-petal flower */
    ...[0, 1, 2, 3, 4].map((i): PartSpec => {
      const a = (i / 5) * Math.PI * 2;
      return { bone: 'flower', shape: 'ellipsoid', at: [Math.cos(a) * 0.055, 0.03, Math.sin(a) * 0.055], rot: [0, -a, 0.4], radii: [0.055, 0.02, 0.035], blend: 0.01, material: 'petal' };
    }),
    { bone: 'flower', shape: 'sphere', at: [0, 0.045, 0], radius: 0.03, material: 'pollen' },
  ],
  paints: [
    { bone: 'body', on: ['cactus'], kind: 'sphere', at: [-0.13, 0.2, 0.16], radius: 0.045, color: '#ff8fb4', soft: 0.6, opacity: 0.7 },
    { bone: 'body', on: ['cactus'], kind: 'sphere', at: [0.13, 0.2, 0.16], radius: 0.045, color: '#ff8fb4', soft: 0.6, opacity: 0.7 },
  ],
  eyes: { kind: 'bead', bone: 'body', at: [[-0.08, 0.27, 0.185], [0.08, 0.27, 0.185]], radii: [0.03, 0.045, 0.02], material: 'bead' },
  face: { kind: 'mouth', bone: 'body', on: ['cactus'], at: [0, 0.19, 0.2], width: 0.045, color: '#173a24', tongue: '#ff7d97' },
  anchors: {
    top: { bone: 'flower', at: [0, 0.1, 0] },
    mouth: { bone: 'body', at: [0, 0.19, 0.22] },
    ear: { bone: 'body', at: [-0.22, 0.3, 0] },
    feet: { bone: 'root', at: [0, 0.02, 0.15] },
  },
  acting: {
    idle: { armL: { rz: [0, 0.08, 0.6, 0] } },
    thinking: { armR: { rz: 0.9, rx: -0.5 }, flower: { rz: 0.2 } },
    listening: { armL: { rz: -0.4 }, flower: { rz: -0.15 } },
    speaking: { armL: { rz: [-0.2, 0.25, 1.4, 0] }, armR: { rz: [0.2, 0.25, 1.4, 1.5] } },
    sleeping: { flower: { rz: 0.6, rx: 0.4 }, body: { rz: 0.08 } },
    working: { armL: { rz: [-0.4, 0.2, 5, 0] }, armR: { rz: [0.4, 0.2, 5, Math.PI] } },
    error: { armL: { rz: -1 }, armR: { rz: 1 }, flower: { rz: [0, 0.3, 10, 0] } },
    surprised: { armL: { rz: -0.9 }, armR: { rz: 0.9 } },
    celebrating: { armL: { rz: [-0.9, 0.3, 4, 0] }, armR: { rz: [0.9, 0.3, 4, Math.PI] }, flower: { ry: [0, 0, 0, 0, 10] } },
    sad: { flower: { rx: 0.9, rz: 0.4 }, armL: { rz: 0.4 }, armR: { rz: -0.3 } },
    happy: { flower: { ry: [0, 0, 0, 0, 12] } },
  },
  fx: {
    happy: [{ glyph: 'heart', anchor: 'top', rate: 1.2, velocity: [0, 0.22, 0.04], jitter: 0.1, life: [1, 1.3], size: [0.04, 0.06], color: '#ff7eb6' }],
  },
};

export default cacti;

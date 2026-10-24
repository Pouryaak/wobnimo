import type { CharacterSpec } from 'wobnimo';

/** A sleepy cloud in brand blue, wearing big headphones. */
export const drift: CharacterSpec = {
  id: 'drift',
  name: 'Drift',
  tagline: 'A sleepy blue cloud that floats along to the music in its headphones',
  accent: '#4f7cff',
  frame: { target: 0.63, radius: 0.84 },
  bound: { y: 0.6, radius: 0.69 },
  motion: { float: 0.18, hop: 0.1, squash: 1.3, snap: 0.75, talkSquash: 0.8 },
  materials: {
    cloud: { color: '#9db8ff', f0: 0.03, spec: 0.35, shininess: 20, rim: 1.1, sss: 0.55, sssColor: '#dbe6ff', sheen: 0.3 },
    band: { color: '#20253a', f0: 0.06, spec: 1.4, shininess: 120, rim: 0.4, gloss: 0.7 },
    cup: { color: '#4f7cff', f0: 0.08, spec: 1.6, shininess: 160, rim: 0.5, gloss: 0.8 },
    cushion: { color: '#2a2f45', f0: 0.03, spec: 0.3, shininess: 20, rim: 0.3, sheen: 0.6 },
  },
  bones: [
    { name: 'body', pivot: [0, 0, 0], drive: { rx: [['pitch', -0.4]], ry: [['yaw', 0.6]], rz: [['roll', 0.7]] }, wave: { rz: [0.04, 0.35, 0] } },
    /* the head bobs to the beat on its own */
    { name: 'phones', parent: 'body', pivot: [0, 0.55, 0], wave: { rz: [0.03, 1.1, 0] } },
  ],
  parts: [
    /* a cluster of puffs melted together, flatter underneath */
    { bone: 'body', shape: 'sphere', at: [0, 0.52, 0], radius: 0.32, material: 'cloud' },
    { bone: 'body', shape: 'sphere', at: [-0.3, 0.42, 0], radius: 0.22, blend: 0.12, material: 'cloud' },
    { bone: 'body', shape: 'sphere', at: [0.31, 0.43, 0], radius: 0.23, blend: 0.12, material: 'cloud' },
    { bone: 'body', shape: 'sphere', at: [-0.14, 0.72, -0.03], radius: 0.2, blend: 0.12, material: 'cloud' },
    { bone: 'body', shape: 'sphere', at: [0.16, 0.74, -0.04], radius: 0.22, blend: 0.12, material: 'cloud' },
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.34, 0], radii: [0.5, 0.12, 0.3], blend: 0.1, material: 'cloud' },
    /* headphones: a band over the top, a cup and cushion on each side */
    { bone: 'phones', shape: 'capsule', from: [-0.47, 0.0, 0], to: [-0.4, 0.26, 0], radius: 0.028, material: 'band' },
    { bone: 'phones', shape: 'capsule', from: [-0.4, 0.26, 0], to: [-0.18, 0.42, 0], radius: 0.028, blend: 0.02, material: 'band' },
    { bone: 'phones', shape: 'capsule', from: [-0.18, 0.42, 0], to: [0.18, 0.42, 0], radius: 0.028, blend: 0.02, material: 'band' },
    { bone: 'phones', shape: 'capsule', from: [0.18, 0.42, 0], to: [0.4, 0.26, 0], radius: 0.028, blend: 0.02, material: 'band' },
    { bone: 'phones', shape: 'capsule', from: [0.4, 0.26, 0], to: [0.47, 0.0, 0], radius: 0.028, material: 'band' },
    { bone: 'phones', shape: 'cylinder', at: [-0.5, -0.04, 0], rot: [0, 0, Math.PI / 2], radius: 0.12, half: 0.05, round: 0.025, material: 'cup' },
    { bone: 'phones', shape: 'cylinder', at: [0.5, -0.04, 0], rot: [0, 0, Math.PI / 2], radius: 0.12, half: 0.05, round: 0.025, material: 'cup' },
    { bone: 'phones', shape: 'cylinder', at: [-0.44, -0.04, 0], rot: [0, 0, Math.PI / 2], radius: 0.1, half: 0.025, round: 0.02, material: 'cushion' },
    { bone: 'phones', shape: 'cylinder', at: [0.44, -0.04, 0], rot: [0, 0, Math.PI / 2], radius: 0.1, half: 0.025, round: 0.02, material: 'cushion' },
  ],
  paints: [
    { bone: 'body', on: ['cloud'], kind: 'sphere', at: [-0.2, 0.46, 0.27], radius: 0.06, color: '#ff9ec4', soft: 0.6, opacity: 0.75 },
    { bone: 'body', on: ['cloud'], kind: 'sphere', at: [0.2, 0.46, 0.27], radius: 0.06, color: '#ff9ec4', soft: 0.6, opacity: 0.75 },
  ],
  eyes: {
    kind: 'ball', bone: 'body', at: [[-0.11, 0.56, 0.27], [0.11, 0.56, 0.27]],
    radius: 0.05, iris: '#1d2550', irisSize: 0.8, pupilSize: 0.5, lid: 'cloud',
  },
  face: { kind: 'mouth', bone: 'body', on: ['cloud'], at: [0, 0.45, 0.31], width: 0.06, color: '#24305e', tongue: '#ff8fae' },
  anchors: {
    top: { bone: 'body', at: [0.18, 0.98, 0.05] },
    mouth: { bone: 'body', at: [0, 0.45, 0.33] },
    ear: { bone: 'phones', at: [-0.56, -0.04, 0] },
    center: { bone: 'body', at: [0, 0.5, 0] },
  },
  acting: {
    idle: { phones: { rz: [0, 0.04, 1.6, 0] } },
    thinking: { phones: { rz: 0.12 }, body: { rz: 0.06 } },
    listening: { phones: { rz: -0.12 } },
    speaking: { phones: { rz: [0, 0.05, 2.2, 0] } },
    sleeping: { phones: { rz: 0.18 }, body: { rz: 0.1 } },
    working: { phones: { rz: [0, 0.06, 3.2, 0] } },
    celebrating: { phones: { rz: [0, 0.12, 3, 0] } },
    sad: { phones: { rz: -0.1 }, body: { rx: 0.1 } },
  },
  fx: {
    /* music notes float out of the cups while it's idle */
    idle: [{ glyph: 'note', anchor: 'ear', rate: 0.6, velocity: [-0.12, 0.25, 0.04], jitter: 0.08, wobble: 0.05, life: [1.4, 1.8], size: [0.05, 0.03], color: '#4f7cff' }],
    sleeping: [{ glyph: 'cloud', anchor: 'top', rate: 0.5, velocity: [0.05, 0.12, 0], jitter: 0.04, life: [2, 2.5], size: [0.04, 0.08], color: '#dbe6ff' }],
  },
};

export default drift;

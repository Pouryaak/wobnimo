import type { CharacterSpec } from 'wobnimo';

/** A round bumblebee with tiny wings. */
export const bumble: CharacterSpec = {
  id: 'bumble',
  name: 'Bumble',
  tagline: 'A fuzzy round bumblebee that hovers on wings far too small for it',
  accent: '#f5b700',
  frame: { target: 0.61, radius: 0.81 },
  bound: { y: 0.5, radius: 0.62 },
  motion: { float: 0.2, hop: 0.08, squash: 1, snap: 1.2, talkSquash: 0.5 },
  materials: {
    fuzz: {
      color: '#ffc21a', f0: 0.03, spec: 0.4, shininess: 20, rim: 1.1, sheen: 0.8,
      surface: { kind: 'fur', scale: 110, strength: 0.4, bone: 'body' },
    },
    stripe: { color: '#2b2118', f0: 0.03, spec: 0.4, shininess: 20, rim: 0.8, sheen: 0.6 },
    wing: { color: '#e8f6ff', f0: 0.1, spec: 1.8, shininess: 200, rim: 1.4, sss: 0.6, sssColor: '#ffffff', gloss: 0.9 },
    feeler: { color: '#2b2118', f0: 0.04, spec: 0.8, shininess: 60, rim: 0.5 },
  },
  bones: [
    { name: 'body', pivot: [0, 0.4, 0], drive: { rx: [['pitch', -0.4]], ry: [['yaw', 0.7]], rz: [['roll', 0.6]] }, wave: { rx: [0.03, 0.8, 0] } },
    /* wings buzz all the time */
    { name: 'wingL', parent: 'body', pivot: [-0.12, 0.3, -0.18], rest: { rz: 0.5, rx: -0.3 }, wave: { rz: [0.35, 14, 0] } },
    { name: 'wingR', parent: 'body', pivot: [0.12, 0.3, -0.18], rest: { rz: -0.5, rx: -0.3 }, wave: { rz: [-0.35, 14, 0] } },
    { name: 'feelerL', parent: 'body', pivot: [-0.08, 0.36, 0.1], rest: { rz: 0.35 }, jiggle: { axis: [0, 1, 0], length: 0.14, freq: 3, damping: 0.12 } },
    { name: 'feelerR', parent: 'body', pivot: [0.08, 0.36, 0.1], rest: { rz: -0.35 }, jiggle: { axis: [0, 1, 0], length: 0.14, freq: 3, damping: 0.12 } },
  ],
  parts: [
    { bone: 'body', shape: 'sphere', at: [0, 0, 0], radius: 0.36, material: 'fuzz' },
    /* a little stinger at the back */
    { bone: 'body', shape: 'roundCone', from: [0, -0.05, -0.33], to: [0, -0.08, -0.45], r1: 0.05, r2: 0.01, blend: 0.03, material: 'stripe' },
    { bone: 'wingL', shape: 'ellipsoid', at: [-0.1, 0.1, 0], rot: [0, 0, 0.5], radii: [0.12, 0.17, 0.012], material: 'wing' },
    { bone: 'wingR', shape: 'ellipsoid', at: [0.1, 0.1, 0], rot: [0, 0, -0.5], radii: [0.12, 0.17, 0.012], material: 'wing' },
    { bone: 'feelerL', shape: 'capsule', from: [0, 0, 0], to: [0, 0.14, 0.02], radius: 0.012, material: 'feeler' },
    { bone: 'feelerL', shape: 'sphere', at: [0, 0.15, 0.02], radius: 0.03, material: 'feeler' },
    { bone: 'feelerR', shape: 'capsule', from: [0, 0, 0], to: [0, 0.14, 0.02], radius: 0.012, material: 'feeler' },
    { bone: 'feelerR', shape: 'sphere', at: [0, 0.15, 0.02], radius: 0.03, material: 'feeler' },
  ],
  paints: [
    /* two dark bands around the lower body, made from big soft-edged spheres below it */
    { bone: 'body', on: ['fuzz'], kind: 'sphere', at: [0, -1.04, 0], radius: 0.9, color: '#2b2118', soft: 0.03 },
    { bone: 'body', on: ['fuzz'], kind: 'sphere', at: [0, -1.15, 0], radius: 0.9, color: '#ffc21a', soft: 0.03 },
    { bone: 'body', on: ['fuzz'], kind: 'sphere', at: [0, -1.25, 0], radius: 0.9, color: '#2b2118', soft: 0.03 },
    { bone: 'body', on: ['fuzz'], kind: 'sphere', at: [0, 0.98, 0], radius: 0.7, color: '#2b2118', soft: 0.04 },
    { bone: 'body', on: ['fuzz'], kind: 'sphere', at: [-0.2, -0.05, 0.27], radius: 0.06, color: '#ff8a6a', soft: 0.6, opacity: 0.7 },
    { bone: 'body', on: ['fuzz'], kind: 'sphere', at: [0.2, -0.05, 0.27], radius: 0.06, color: '#ff8a6a', soft: 0.6, opacity: 0.7 },
  ],
  eyes: { kind: 'ball', bone: 'body', at: [[-0.12, 0.06, 0.3], [0.12, 0.06, 0.3]], radius: 0.065, iris: '#20160e', irisSize: 0.85, pupilSize: 0.55, lid: 'fuzz' },
  face: { kind: 'mouth', bone: 'body', on: ['fuzz'], at: [0, -0.08, 0.35], width: 0.05, color: '#3a2412', tongue: '#ff7d6e' },
  anchors: {
    top: { bone: 'body', at: [0.12, 0.5, 0.05] },
    mouth: { bone: 'body', at: [0, -0.08, 0.37] },
    ear: { bone: 'body', at: [-0.36, 0.05, 0] },
    center: { bone: 'body', at: [0, 0, 0] },
  },
  acting: {
    thinking: { feelerL: { rz: 0.6 }, feelerR: { rz: -0.1 } },
    listening: { feelerL: { rx: -0.4 }, feelerR: { rx: -0.4 } },
    sleeping: { wingL: { rz: 0.9 }, wingR: { rz: -0.9 }, feelerL: { rx: 0.6 }, feelerR: { rx: 0.6 } },
    error: { feelerL: { rz: [0.4, 0.3, 9, 0] }, feelerR: { rz: [-0.4, 0.3, 9, 1] } },
    surprised: { feelerL: { rz: 0.1, rx: -0.3 }, feelerR: { rz: -0.1, rx: -0.3 } },
    sad: { feelerL: { rx: 0.9 }, feelerR: { rx: 0.9 } },
  },
  fx: {
    happy: [{ glyph: 'sparkle', anchor: 'top', rate: 2, velocity: [0, 0.2, 0.05], jitter: 0.15, life: [0.8, 1.1], size: [0.04, 0.02], color: '#ffd84d', glow: true }],
  },
};

export default bumble;

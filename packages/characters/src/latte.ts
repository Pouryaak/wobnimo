import type { CharacterSpec } from '@wobnimo/engine';

/** A coffee cup with a foam-art heart and a curl of steam for hair. */
export const latte: CharacterSpec = {
  id: 'latte',
  name: 'Latte',
  tagline: 'A cheerful coffee cup with latte-art foam and a curl of steam for hair',
  accent: '#b7794b',
  frame: { target: 0.43, radius: 0.68 },
  bound: { y: 0.41, radius: 0.57 },
  motion: { hop: 0.1, squash: 0.7, snap: 1, talkSquash: 0.4 },
  materials: {
    cup: { color: '#f4efe6', f0: 0.06, spec: 1.6, shininess: 140, rim: 0.6, gloss: 0.85 },
    band: { color: '#c9854f', f0: 0.05, spec: 1, shininess: 80, rim: 0.5, gloss: 0.6 },
    coffee: { color: '#6b3f22', f0: 0.04, spec: 1.2, shininess: 90, rim: 0.3, gloss: 0.7 },
    foam: { color: '#f2dcc0', f0: 0.03, spec: 0.4, shininess: 20, rim: 0.4, sss: 0.3, sssColor: '#fff3e2' },
    steam: { color: '#ffffff', f0: 0.02, spec: 0.2, shininess: 10, rim: 1.4, sss: 0.7, sssColor: '#ffffff', emit: '#ffffff', emitStrength: 0.08 },
    bead: { color: '#2a1a10', f0: 0.06, spec: 2.2, shininess: 400, rim: 0.2, gloss: 1 },
  },
  bones: [
    { name: 'body', pivot: [0, -0.08, 0], drive: { rx: [['pitch', -0.3]], ry: [['yaw', 0.6]], rz: [['roll', 0.5]] }, wave: { rz: [0.02, 0.5, 0] } },
    { name: 'handle', parent: 'body', pivot: [0.31, 0.36, 0], drive: { rz: [['flap', 0.4]] } },
    /* the steam curls and sways like a tuft of hair */
    { name: 'steam', parent: 'body', pivot: [0, 0.58, 0], wave: { rz: [0.12, 0.6, 0] }, jiggle: { axis: [0, 1, 0], length: 0.2, freq: 1.6, damping: 0.12, maxAngle: 0.6 } },
  ],
  parts: [
    /* a straight-sided mug with a flat rim, hollowed at the top and filled with coffee and foam */
    { bone: 'body', shape: 'cylinder', at: [0, 0.33, 0], radius: 0.3, half: 0.25, round: 0.05, material: 'cup' },
    { bone: 'body', shape: 'cylinder', at: [0, 0.64, 0], radius: 0.25, half: 0.1, round: 0.02, op: 'sub', blend: 0.015, material: 'cup' },
    { bone: 'body', shape: 'cylinder', at: [0, 0.55, 0], radius: 0.255, half: 0.012, round: 0.008, material: 'coffee' },
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.562, 0], radii: [0.2, 0.022, 0.2], material: 'foam' },
    /* a cardboard sleeve low on the cup, leaving room for the face */
    { bone: 'body', shape: 'cylinder', at: [0, 0.2, 0], radius: 0.305, half: 0.05, round: 0.012, material: 'band' },
    /* a ring handle on the right */
    { bone: 'handle', shape: 'frame', at: [0.07, -0.02, 0], half: [0.08, 0.1], corner: 0.08, width: 0.025, depth: 0.03, rot: [Math.PI / 2, 0, 0], material: 'cup' },
    /* a curl of steam */
    { bone: 'steam', shape: 'capsule', from: [0, 0, 0], to: [-0.05, 0.12, 0], radius: 0.045, material: 'steam' },
    { bone: 'steam', shape: 'capsule', from: [-0.05, 0.12, 0], to: [0.03, 0.22, 0], radius: 0.035, blend: 0.04, material: 'steam' },
    { bone: 'steam', shape: 'capsule', from: [0.03, 0.22, 0], to: [-0.01, 0.3, 0], radius: 0.022, blend: 0.03, material: 'steam' },
  ],
  paints: [
    /* a latte-art heart in the foam */
    { bone: 'body', on: ['foam'], kind: 'sphere', at: [-0.035, 0.584, 0.02], radius: 0.05, color: '#b98257', soft: 0.25 },
    { bone: 'body', on: ['foam'], kind: 'sphere', at: [0.035, 0.584, 0.02], radius: 0.05, color: '#b98257', soft: 0.25 },
    { bone: 'body', on: ['foam'], kind: 'sphere', at: [0, 0.584, 0.08], radius: 0.035, color: '#b98257', soft: 0.3 },
    { bone: 'body', on: ['cup'], kind: 'sphere', at: [-0.19, 0.34, 0.24], radius: 0.05, color: '#ffa4a4', soft: 0.6, opacity: 0.7 },
    { bone: 'body', on: ['cup'], kind: 'sphere', at: [0.19, 0.34, 0.24], radius: 0.05, color: '#ffa4a4', soft: 0.6, opacity: 0.7 },
  ],
  eyes: { kind: 'bead', bone: 'body', at: [[-0.1, 0.42, 0.3], [0.1, 0.42, 0.3]], radii: [0.032, 0.048, 0.02], material: 'bead' },
  face: { kind: 'mouth', bone: 'body', on: ['cup'], at: [0, 0.33, 0.305], width: 0.05, color: '#4a2a18', tongue: '#ff8a8a' },
  anchors: {
    top: { bone: 'steam', at: [0, 0.34, 0] },
    mouth: { bone: 'body', at: [0, 0.33, 0.32] },
    ear: { bone: 'body', at: [-0.32, 0.45, 0] },
    feet: { bone: 'root', at: [0, 0.02, 0.2] },
  },
  acting: {
    thinking: { steam: { rz: 0.4 } },
    listening: { steam: { rz: -0.3 } },
    speaking: { handle: { rz: [0.1, 0.15, 1.4, 0] } },
    sleeping: { steam: { rz: 0.9, rx: 0.3 } },
    working: { steam: { ry: [0, 0, 0, 0, 6] } },
    error: { steam: { rz: [0, 0.4, 9, 0] } },
    surprised: { steam: { rx: -0.3 } },
    celebrating: { steam: { ry: [0, 0, 0, 0, 12] } },
    sad: { steam: { rz: 1.1, rx: 0.5 } },
  },
  fx: {
    ambient: [{ glyph: 'puff', anchor: 'top', rate: 0.8, velocity: [0, 0.15, 0], jitter: 0.04, wobble: 0.06, life: [1.2, 1.6], size: [0.03, 0.07], color: '#ffffff' }],
  },
};

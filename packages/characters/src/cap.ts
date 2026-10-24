import type { CharacterSpec, PaintSpec } from '@wobnimo/engine';

/** A red mushroom with white spots. */
export const cap: CharacterSpec = {
  id: 'cap',
  name: 'Cap',
  tagline: 'A little toadstool with a glossy red cap that wobbles when it walks',
  accent: '#e0393e',
  frame: { target: 0.4, radius: 0.59 },
  bound: { y: 0.39, radius: 0.5 },
  motion: { hop: 0.12, squash: 1.2, snap: 1, talkSquash: 0.5 },
  materials: {
    cap: { color: '#e53935', f0: 0.06, spec: 1.5, shininess: 120, rim: 0.6, gloss: 0.75, sss: 0.15, sssColor: '#ff8a80' },
    gills: { color: '#efe2cf', f0: 0.02, spec: 0.2, shininess: 10, rim: 0.3 },
    stem: { color: '#fbf3e4', f0: 0.03, spec: 0.5, shininess: 30, rim: 0.6, sss: 0.3, sssColor: '#fff8ec' },
    bead: { color: '#1a1414', f0: 0.06, spec: 2.2, shininess: 400, rim: 0.2, gloss: 1 },
  },
  bones: [
    { name: 'body', pivot: [0, 0, 0], drive: { rx: [['pitch', -0.3]], ry: [['yaw', 0.5]], rz: [['roll', 0.4]] } },
    { name: 'cap', parent: 'body', pivot: [0, 0.42, 0], drive: { rx: [['pitch', -0.4]], rz: [['roll', 0.5]] }, jiggle: { axis: [0, 1, 0], length: 0.2, freq: 2.6, damping: 0.18, maxAngle: 0.3 } },
  ],
  parts: [
    /* a chubby stem the face lives on */
    { bone: 'body', shape: 'roundCone', from: [0, 0.12, 0], to: [0, 0.4, 0], r1: 0.2, r2: 0.16, clip: { normal: [0, -1, 0] }, material: 'stem' },
    /* a dome cap with a soft underside */
    { bone: 'cap', shape: 'ellipsoid', at: [0, 0.06, 0], radii: [0.42, 0.28, 0.42], clip: { normal: [0, -1, 0], offset: 0.02 }, material: 'cap' },
    { bone: 'cap', shape: 'ellipsoid', at: [0, 0.05, 0], radii: [0.4, 0.04, 0.4], blend: 0.03, material: 'gills' },
  ],
  paints: [
    /* white spots, scattered over the cap */
    ...([[0, 0.33, 0.05, 0.08], [-0.22, 0.24, 0.2, 0.07], [0.24, 0.22, 0.2, 0.065], [-0.08, 0.2, 0.33, 0.055], [0.12, 0.3, -0.18, 0.07], [-0.341, 0.196, -0.136, 0.06], [0.38, 0.173, -0.058, 0.05]] as const).map(
      ([x, y, z, r]): PaintSpec => ({ bone: 'cap', on: ['cap'], kind: 'sphere', at: [x, y, z], radius: r, color: '#fff8ee', soft: 0.12 }),
    ),
    { bone: 'body', on: ['stem'], kind: 'sphere', at: [-0.13, 0.22, 0.14], radius: 0.045, color: '#ff9eb0', soft: 0.6, opacity: 0.8 },
    { bone: 'body', on: ['stem'], kind: 'sphere', at: [0.13, 0.22, 0.14], radius: 0.045, color: '#ff9eb0', soft: 0.6, opacity: 0.8 },
  ],
  eyes: { kind: 'bead', bone: 'body', at: [[-0.07, 0.29, 0.165], [0.07, 0.29, 0.165]], radii: [0.028, 0.042, 0.018], material: 'bead' },
  face: { kind: 'mouth', bone: 'body', on: ['stem'], at: [0, 0.21, 0.19], width: 0.04, color: '#4a2a22', tongue: '#ff7d97' },
  anchors: {
    top: { bone: 'cap', at: [0.1, 0.38, 0] },
    mouth: { bone: 'body', at: [0, 0.21, 0.21] },
    ear: { bone: 'body', at: [-0.2, 0.3, 0] },
    feet: { bone: 'root', at: [0, 0.02, 0.15] },
  },
  acting: {
    thinking: { cap: { rz: 0.15 } },
    sleeping: { cap: { rx: 0.2, rz: 0.15 } },
    error: { cap: { rz: [0, 0.12, 9, 0] } },
    surprised: { cap: { rx: -0.15 } },
    sad: { cap: { rx: 0.3 } },
    celebrating: { cap: { rz: [0, 0.15, 4, 0] } },
  },
  fx: {
    /* puffs of spores when it lands */
    land: [{ glyph: 'mote', anchor: 'top', rate: 6, spread: 0.2, velocity: [0, 0.2, 0], jitter: 0.2, wobble: 0.08, life: [1, 1.5], size: [0.025, 0.01], color: '#ffe8a3', glow: true }],
  },
};

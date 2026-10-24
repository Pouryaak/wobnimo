import type { CharacterSpec } from '@wobnimo/engine';

/** A white bunny with long floppy ears. */
export const hop: CharacterSpec = {
  id: 'hop',
  name: 'Hop',
  tagline: 'A soft white bunny whose long floppy ears swing with every hop',
  accent: '#ff8fb1',
  frame: { target: 0.57, radius: 0.76 },
  bound: { y: 0.56, radius: 0.66 },
  motion: { hop: 0.22, squash: 1.3, snap: 1.15, talkSquash: 0.4 },
  materials: {
    fur: { color: '#fbf8f4', f0: 0.03, spec: 0.4, shininess: 20, rim: 1, sheen: 0.7, surface: { kind: 'fur', scale: 110, strength: 0.3, bone: 'head' } },
    bodyFur: { color: '#fbf8f4', shadeOf: 'fur', f0: 0.03, spec: 0.4, shininess: 20, rim: 1, sheen: 0.7, surface: { kind: 'fur', scale: 110, strength: 0.3 } },
    earFur: { color: '#fbf8f4', shadeOf: 'fur', f0: 0.03, spec: 0.4, shininess: 20, rim: 1.2, sheen: 0.7, sss: 0.35, sssColor: '#ffc4d4' },
    nose: { color: '#ff7fa5', f0: 0.06, spec: 1.6, shininess: 160, rim: 0.3, gloss: 0.8 },
  },
  bones: [
    { name: 'body', pivot: [0, 0, 0], drive: { ry: [['yaw', 0.2]], rz: [['roll', 0.35]] } },
    { name: 'head', parent: 'body', pivot: [0, 0.42, 0.02], drive: { rx: [['pitch', -1]], ry: [['yaw', 0.8]], rz: [['roll', 0.7]] } },
    /* long ears that flop down and swing */
    { name: 'earL', parent: 'head', pivot: [-0.1, 0.3, -0.02], rest: { rz: 0.35, rx: 0.2 }, jiggle: { axis: [0, 1, 0], length: 0.32, freq: 2, damping: 0.14, maxAngle: 0.8 } },
    { name: 'earR', parent: 'head', pivot: [0.1, 0.3, -0.02], rest: { rz: -1.2, rx: 0.2 }, jiggle: { axis: [0, 1, 0], length: 0.32, freq: 2, damping: 0.14, maxAngle: 0.8 } },
    { name: 'tail', parent: 'body', pivot: [0, 0.14, -0.2], jiggle: { axis: [0, 0, -1], length: 0.06, freq: 4, damping: 0.2 } },
  ],
  parts: [
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.22, 0], radii: [0.22, 0.22, 0.21], material: 'bodyFur' },
    { bone: 'body', shape: 'ellipsoid', at: [-0.12, 0.05, 0.1], radii: [0.08, 0.05, 0.13], blend: 0.04, material: 'bodyFur' },
    { bone: 'body', shape: 'ellipsoid', at: [0.12, 0.05, 0.1], radii: [0.08, 0.05, 0.13], blend: 0.04, material: 'bodyFur' },
    { bone: 'tail', shape: 'sphere', at: [0, 0, -0.03], radius: 0.07, blend: 0.03, material: 'bodyFur' },
    { bone: 'head', shape: 'ellipsoid', at: [0, 0.14, 0], radii: [0.25, 0.22, 0.22], blend: 0.1, material: 'fur' },
    { bone: 'head', shape: 'ellipsoid', at: [-0.06, 0.06, 0.17], radii: [0.07, 0.055, 0.06], blend: 0.04, material: 'fur' },
    { bone: 'head', shape: 'ellipsoid', at: [0.06, 0.06, 0.17], radii: [0.07, 0.055, 0.06], blend: 0.04, material: 'fur' },
    { bone: 'head', shape: 'ellipsoid', at: [0, 0.1, 0.22], radii: [0.028, 0.02, 0.018], material: 'nose' },
    { bone: 'earL', shape: 'ellipsoid', at: [0, 0.2, 0], radii: [0.065, 0.22, 0.03], material: 'earFur' },
    { bone: 'earR', shape: 'ellipsoid', at: [0, 0.2, 0], radii: [0.065, 0.22, 0.03], material: 'earFur' },
  ],
  paints: [
    { bone: 'earL', on: ['earFur'], kind: 'ellipse', at: [0, 0.2, 0.03], radii: [0.035, 0.16], color: '#ffc2d3', soft: 0.4 },
    { bone: 'earR', on: ['earFur'], kind: 'ellipse', at: [0, 0.2, 0.03], radii: [0.035, 0.16], color: '#ffc2d3', soft: 0.4 },
    { bone: 'head', on: ['fur'], kind: 'sphere', at: [-0.16, 0.07, 0.16], radius: 0.045, color: '#ffb3c8', soft: 0.6, opacity: 0.8 },
    { bone: 'head', on: ['fur'], kind: 'sphere', at: [0.16, 0.07, 0.16], radius: 0.045, color: '#ffb3c8', soft: 0.6, opacity: 0.8 },
  ],
  eyes: { kind: 'ball', bone: 'head', at: [[-0.1, 0.17, 0.17], [0.1, 0.17, 0.17]], radius: 0.05, iris: '#3b1f2b', irisSize: 0.85, pupilSize: 0.55, lid: 'fur' },
  face: { kind: 'mouth', bone: 'head', on: ['fur'], at: [0, 0.035, 0.21], width: 0.035, color: '#5a2a3a', tongue: '#ff8fa3' },
  anchors: {
    top: { bone: 'head', at: [0.15, 0.5, 0.05] },
    mouth: { bone: 'head', at: [0, 0.035, 0.24] },
    ear: { bone: 'earL', at: [0, 0.2, 0] },
    feet: { bone: 'root', at: [0, 0.02, 0.15] },
  },
  acting: {
    thinking: { earR: { rz: -0.4 }, head: { rz: 0.1 } },
    listening: { earL: { rz: 0, rx: -0.2 }, earR: { rz: 0, rx: -0.2 } },
    sleeping: { earL: { rz: 1.2, rx: 0.5 }, earR: { rz: -1.4, rx: 0.5 } },
    error: { earL: { rz: [0.6, 0.2, 9, 0] }, earR: { rz: [-0.6, 0.2, 9, 1] } },
    surprised: { earL: { rz: 0.05, rx: -0.1 }, earR: { rz: -0.05, rx: -0.1 } },
    celebrating: { earL: { rz: [0.2, 0.3, 4, 0] }, earR: { rz: [-0.2, 0.3, 4, Math.PI] } },
    sad: { earL: { rz: 1.4, rx: 0.6 }, earR: { rz: -1.4, rx: 0.6 } },
  },
  fx: {
    happy: [{ glyph: 'heart', anchor: 'top', rate: 1.2, velocity: [0, 0.22, 0.04], jitter: 0.1, life: [1, 1.3], size: [0.04, 0.06], color: '#ff8fb1' }],
  },
};

import type { CharacterSpec } from 'wobnimo';

/** A fox cub with a big fluffy tail. */
export const ember: CharacterSpec = {
  id: 'ember',
  name: 'Ember',
  tagline: 'A fox cub with pointed ears and a big fluffy tail that never stops swishing',
  accent: '#f07a2a',
  frame: { target: 0.48, radius: 0.72 },
  bound: { y: 0.38, radius: 0.85 },
  motion: { hop: 0.14, squash: 1, snap: 1.1, talkSquash: 0.4 },
  materials: {
    fur: { color: '#f07a2a', f0: 0.03, spec: 0.4, shininess: 20, rim: 1, sheen: 0.7, surface: { kind: 'fur', scale: 90, strength: 0.4, bone: 'head' } },
    bodyFur: { color: '#f07a2a', shadeOf: 'fur', f0: 0.03, spec: 0.4, shininess: 20, rim: 1, sheen: 0.7, surface: { kind: 'fur', scale: 90, strength: 0.4 } },
    tailFur: { color: '#f07a2a', shadeOf: 'fur', f0: 0.03, spec: 0.4, shininess: 20, rim: 1, sheen: 0.8, surface: { kind: 'fur', scale: 70, strength: 0.5, bone: 'tail' } },
    dark: { color: '#3a2318', f0: 0.03, spec: 0.4, shininess: 20, rim: 0.6, sheen: 0.5 },
    nose: { color: '#1d1410', f0: 0.06, spec: 1.8, shininess: 200, rim: 0.3, gloss: 0.9 },
  },
  bones: [
    { name: 'body', pivot: [0, 0, 0], drive: { ry: [['yaw', 0.2]], rz: [['roll', 0.3]] } },
    { name: 'head', parent: 'body', pivot: [0, 0.48, 0.02], drive: { rx: [['pitch', -1]], ry: [['yaw', 0.8]], rz: [['roll', 0.7]] } },
    { name: 'earL', parent: 'head', pivot: [-0.14, 0.28, 0], rest: { rz: 0.3 }, jiggle: { axis: [0, 1, 0], length: 0.16, freq: 3.5, damping: 0.2, maxAngle: 0.4 } },
    { name: 'earR', parent: 'head', pivot: [0.14, 0.28, 0], rest: { rz: -0.3 }, jiggle: { axis: [0, 1, 0], length: 0.16, freq: 3.5, damping: 0.2, maxAngle: 0.4 } },
    { name: 'tail', parent: 'body', pivot: [0.15, 0.12, -0.15], rest: { rz: -0.9, rx: -0.4 }, wave: { ry: [0.35, 0.8, 0] }, jiggle: { axis: [0, 1, 0], length: 0.35, freq: 1.8, damping: 0.18, maxAngle: 0.6 } },
  ],
  parts: [
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.25, 0], radii: [0.22, 0.25, 0.2], material: 'bodyFur' },
    /* little legs */
    { bone: 'body', shape: 'capsule', from: [-0.1, 0.12, 0.08], to: [-0.1, 0.04, 0.12], radius: 0.06, blend: 0.05, material: 'dark' },
    { bone: 'body', shape: 'capsule', from: [0.1, 0.12, 0.08], to: [0.1, 0.04, 0.12], radius: 0.06, blend: 0.05, material: 'dark' },
    /* a wide head with a pointed muzzle and cheek fluff */
    { bone: 'head', shape: 'ellipsoid', at: [0, 0.12, 0], radii: [0.27, 0.22, 0.23], blend: 0.1, material: 'fur' },
    { bone: 'head', shape: 'roundCone', from: [0, 0.07, 0.1], to: [0, 0.05, 0.3], r1: 0.12, r2: 0.04, blend: 0.08, material: 'fur' },
    { bone: 'head', shape: 'sphere', at: [0, 0.06, 0.33], radius: 0.035, material: 'nose' },
    { bone: 'head', shape: 'ellipsoid', at: [-0.22, 0.02, 0.06], radii: [0.09, 0.07, 0.08], blend: 0.06, material: 'fur' },
    { bone: 'head', shape: 'ellipsoid', at: [0.22, 0.02, 0.06], radii: [0.09, 0.07, 0.08], blend: 0.06, material: 'fur' },
    /* tall pointed ears with dark tips */
    { bone: 'earL', shape: 'roundCone', from: [0, 0, 0], to: [0, 0.18, 0], r1: 0.08, r2: 0.015, material: 'fur' },
    { bone: 'earR', shape: 'roundCone', from: [0, 0, 0], to: [0, 0.18, 0], r1: 0.08, r2: 0.015, material: 'fur' },
    /* the tail: a big plume */
    { bone: 'tail', shape: 'roundCone', from: [0, 0, 0], to: [0, 0.3, 0], r1: 0.06, r2: 0.13, material: 'tailFur' },
    { bone: 'tail', shape: 'sphere', at: [0, 0.36, 0], radius: 0.11, blend: 0.08, material: 'tailFur' },
  ],
  paints: [
    { bone: 'body', on: ['bodyFur'], kind: 'ellipse', at: [0, 0.26, 0.1], radii: [0.13, 0.17], color: '#fff3e6', soft: 0.25 },
    { bone: 'head', on: ['fur'], kind: 'sphere', at: [0, 0.0, 0.25], radius: 0.13, color: '#fff3e6', soft: 0.25 },
    { bone: 'head', on: ['fur'], kind: 'sphere', at: [-0.2, -0.02, 0.12], radius: 0.1, color: '#fff3e6', soft: 0.3 },
    { bone: 'head', on: ['fur'], kind: 'sphere', at: [0.2, -0.02, 0.12], radius: 0.1, color: '#fff3e6', soft: 0.3 },
    { bone: 'earL', on: ['fur'], kind: 'sphere', at: [0, 0.2, 0], radius: 0.07, color: '#3a2318', soft: 0.3 },
    { bone: 'earR', on: ['fur'], kind: 'sphere', at: [0, 0.2, 0], radius: 0.07, color: '#3a2318', soft: 0.3 },
    { bone: 'earL', on: ['fur'], kind: 'ellipse', at: [0, 0.07, 0.05], radii: [0.035, 0.07], color: '#ffd9c2', soft: 0.4 },
    { bone: 'earR', on: ['fur'], kind: 'ellipse', at: [0, 0.07, 0.05], radii: [0.035, 0.07], color: '#ffd9c2', soft: 0.4 },
    { bone: 'tail', on: ['tailFur'], kind: 'sphere', at: [0, 0.46, 0], radius: 0.13, color: '#fff3e6', soft: 0.2 },
  ],
  eyes: { kind: 'ball', bone: 'head', at: [[-0.1, 0.15, 0.19], [0.1, 0.15, 0.19]], radius: 0.055, iris: '#2b1a10', irisSize: 0.82, pupilSize: 0.52, lid: 'fur' },
  face: { kind: 'mouth', bone: 'head', on: ['fur'], at: [0, 0, 0.277], width: 0.045, color: '#3a2318', tongue: '#ff7d8a' },
  anchors: {
    top: { bone: 'head', at: [0.12, 0.45, 0.05] },
    mouth: { bone: 'head', at: [0, 0.0, 0.33] },
    ear: { bone: 'earL', at: [0, 0.1, 0] },
    feet: { bone: 'root', at: [0, 0.02, 0.12] },
  },
  acting: {
    idle: { tail: { ry: [0, 0.2, 0.7, 0] } },
    thinking: { earL: { rz: 0.6 }, head: { rz: 0.12 } },
    listening: { earL: { rx: -0.3 }, earR: { rx: -0.3 } },
    speaking: { tail: { ry: [0, 0.3, 1.5, 0] } },
    sleeping: { earL: { rz: 0.8 }, earR: { rz: -0.8 }, tail: { rz: -1.4 } },
    working: { tail: { ry: [0, 0.4, 3, 0] } },
    error: { earL: { rz: 1.1 }, earR: { rz: -1.1 } },
    surprised: { earL: { rz: 0.05 }, earR: { rz: -0.05 }, tail: { rx: -0.8 } },
    celebrating: { tail: { ry: [0, 0.6, 5, 0] } },
    sad: { earL: { rz: 1, rx: 0.4 }, earR: { rz: -1, rx: 0.4 }, tail: { rz: -1.1 } },
    happy: { tail: { ry: [0, 0.6, 6, 0] } },
  },
};

export default ember;

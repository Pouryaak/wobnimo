import type { CharacterSpec } from '@wobnimo/engine';

/** A tree frog: wet, glossy and spotted, with eyes on top and a throat that puffs when it talks. */
export const tad: CharacterSpec = {
  id: 'tad',
  name: 'Tad',
  tagline: 'A glossy tree frog with a wet sheen, eyes on top and a throat that puffs as it talks',
  accent: '#3fae4a',
  frame: { target: 0.42, radius: 0.66 },
  bound: { y: 0.4, radius: 0.72 },
  motion: { hop: 0.26, squash: 1.6, snap: 1.2, look: 0.8, talkSquash: 0.45 },
  materials: {
    /* wet skin: a strong, sharp clear coat over a little translucency */
    skin: {
      color: '#5fc24e', f0: 0.07, spec: 2, shininess: 260, rim: 0.7, gloss: 0.95, sss: 0.3, sssColor: '#c6ff8f',
      surface: { kind: 'speckle', scale: 9, strength: 0.85, color: '#2f8a3a', bone: 'head' },
    },
    bodySkin: {
      color: '#5fc24e', f0: 0.07, spec: 2, shininess: 260, rim: 0.7, gloss: 0.95, sss: 0.3, sssColor: '#c6ff8f',
      surface: { kind: 'speckle', scale: 9, strength: 0.85, color: '#2f8a3a' },
    },
    belly: { color: '#f3f0b6', f0: 0.06, spec: 1.6, shininess: 200, rim: 0.5, gloss: 0.9, sss: 0.45, sssColor: '#fffbd0' },
    toe: { color: '#ffb54a', f0: 0.06, spec: 1.4, shininess: 160, rim: 0.4, gloss: 0.8, sss: 0.3, sssColor: '#ffd99a' },
  },
  bones: [
    { name: 'body', pivot: [0, 0, 0], drive: { ry: [['yaw', 0.25]], rz: [['roll', 0.3]] } },
    /* frogs have no neck: the whole top of the body tips and turns */
    { name: 'head', parent: 'body', pivot: [0, 0.3, 0.02], drive: { rx: [['pitch', -0.8]], ry: [['yaw', 0.7]], rz: [['roll', 0.6]] } },
    /* the throat sac swings forward and out from under the chin as it talks */
    { name: 'throat', parent: 'head', pivot: [0, 0.02, 0.12], drive: { rx: [['talk', 0.9]] } },
    { name: 'armL', parent: 'body', pivot: [-0.22, 0.2, 0.18], drive: { rz: [['flap', -1.3]], rx: [['flap', -0.4]] } },
    { name: 'armR', parent: 'body', pivot: [0.22, 0.2, 0.18], drive: { rz: [['flap', 1.3]], rx: [['flap', -0.4]] } },
  ],
  parts: [
    /* a squat, pear-shaped body with folded back legs */
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.22, -0.03], radii: [0.36, 0.22, 0.32], material: 'bodySkin' },
    { bone: 'body', shape: 'ellipsoid', at: [-0.3, 0.12, -0.04], rot: [0, 0.25, 0], radii: [0.13, 0.11, 0.22], blend: 0.09, material: 'bodySkin' },
    { bone: 'body', shape: 'ellipsoid', at: [0.3, 0.12, -0.04], rot: [0, -0.25, 0], radii: [0.13, 0.11, 0.22], blend: 0.09, material: 'bodySkin' },
    /* webbed back feet, splayed */
    { bone: 'body', shape: 'ellipsoid', at: [-0.33, 0.025, 0.16], rot: [0, 0.5, 0], radii: [0.08, 0.025, 0.13], blend: 0.03, material: 'bodySkin' },
    { bone: 'body', shape: 'ellipsoid', at: [0.33, 0.025, 0.16], rot: [0, -0.5, 0], radii: [0.08, 0.025, 0.13], blend: 0.03, material: 'bodySkin' },
    /* the wide head, with two domes for the eyes */
    { bone: 'head', shape: 'ellipsoid', at: [0, 0.1, 0.05], radii: [0.38, 0.19, 0.31], blend: 0.14, material: 'skin' },
    { bone: 'head', shape: 'sphere', at: [-0.19, 0.24, 0.1], radius: 0.13, blend: 0.07, material: 'skin' },
    { bone: 'head', shape: 'sphere', at: [0.19, 0.24, 0.1], radius: 0.13, blend: 0.07, material: 'skin' },
    /* the throat sac: hidden under the chin at rest */
    { bone: 'throat', shape: 'ellipsoid', at: [0, -0.04, 0.1], radii: [0.14, 0.1, 0.12], blend: 0.05, material: 'belly' },
    /* little arms with round toe pads */
    { bone: 'armL', shape: 'capsule', from: [0, 0, 0], to: [-0.03, -0.17, 0.08], radius: 0.045, blend: 0.05, material: 'bodySkin' },
    { bone: 'armL', shape: 'sphere', at: [-0.07, -0.19, 0.12], radius: 0.026, blend: 0.02, material: 'toe' },
    { bone: 'armL', shape: 'sphere', at: [-0.02, -0.19, 0.15], radius: 0.026, blend: 0.02, material: 'toe' },
    { bone: 'armL', shape: 'sphere', at: [0.03, -0.19, 0.13], radius: 0.026, blend: 0.02, material: 'toe' },
    { bone: 'armR', shape: 'capsule', from: [0, 0, 0], to: [0.03, -0.17, 0.08], radius: 0.045, blend: 0.05, material: 'bodySkin' },
    { bone: 'armR', shape: 'sphere', at: [0.07, -0.19, 0.12], radius: 0.026, blend: 0.02, material: 'toe' },
    { bone: 'armR', shape: 'sphere', at: [0.02, -0.19, 0.15], radius: 0.026, blend: 0.02, material: 'toe' },
    { bone: 'armR', shape: 'sphere', at: [-0.03, -0.19, 0.13], radius: 0.026, blend: 0.02, material: 'toe' },
  ],
  paints: [
    { bone: 'body', on: ['bodySkin'], kind: 'ellipse', at: [0, 0.16, 0.28], radii: [0.22, 0.13], color: '#f3f0b6', soft: 0.3 },
    { bone: 'head', on: ['skin'], kind: 'ellipse', at: [0, -0.01, 0.34], radii: [0.2, 0.06], color: '#f3f0b6', soft: 0.4 },
    { bone: 'head', on: ['skin'], kind: 'sphere', at: [-0.24, 0.07, 0.27], radius: 0.055, color: '#ff8f9c', soft: 0.6, opacity: 0.7 },
    { bone: 'head', on: ['skin'], kind: 'sphere', at: [0.24, 0.07, 0.27], radius: 0.055, color: '#ff8f9c', soft: 0.6, opacity: 0.7 },
  ],
  eyes: {
    kind: 'ball',
    bone: 'head',
    at: [[-0.19, 0.27, 0.15], [0.19, 0.27, 0.15]],
    radius: 0.1,
    iris: '#e7b93a',
    irisSize: 0.74,
    pupilSize: 0.36,
    pupilAspect: 1.8,
    lid: 'skin',
  },
  /* a frog's mouth runs nearly ear to ear */
  face: {
    kind: 'mouth',
    bone: 'head',
    on: ['skin'],
    at: [0, 0.06, 0.34],
    width: 0.12,
    color: '#5a1f2e',
    tongue: '#ff7b93',
  },
  anchors: {
    top: { bone: 'head', at: [0.2, 0.36, 0.05] },
    mouth: { bone: 'head', at: [0, 0.05, 0.37] },
    ear: { bone: 'head', at: [-0.38, 0.12, 0] },
    feet: { bone: 'root', at: [0, 0.03, 0.22] },
  },
  acting: {
    idle: { throat: { rx: [0, 0.12, 1.1, 0] } },
    /* a toe to the chin */
    thinking: { armR: { rz: 0.6, rx: -1.5 } },
    listening: { armL: { rz: -1.6, rx: -0.4 } },
    speaking: {
      armL: { rx: [-0.25, 0.2, 1.3, 0] },
      armR: { rx: [-0.25, 0.2, 1.3, 2] },
    },
    sleeping: { armL: { rx: 0.2 }, armR: { rx: 0.2 }, throat: { rx: [0.2, 0.25, 0.18, 0] } },
    /* drumming its toes */
    working: { armL: { rx: [-0.5, 0.2, 7, 0] }, armR: { rx: [-0.5, 0.2, 7, Math.PI] }, throat: { rx: [0, 0.15, 3.5, 0] } },
    error: { armL: { rz: [-1.2, 0.15, 12, 0] }, armR: { rz: [1.2, 0.15, 12, 1] }, throat: { rx: 0.6 } },
    surprised: { armL: { rz: -1.8 }, armR: { rz: 1.8 }, throat: { rx: 0.9 } },
    celebrating: { armL: { rz: [-2, 0.4, 4, 0] }, armR: { rz: [2, 0.4, 4, Math.PI] }, throat: { rx: [0.4, 0.4, 4, 0] } },
    sad: { armL: { rz: 0.2, rx: 0.3 }, armR: { rz: -0.2, rx: 0.3 } },
    happy: { armL: { rz: [-1.5, 0.4, 5, 0] }, armR: { rz: [1.5, 0.4, 5, 1] }, throat: { rx: [0.4, 0.4, 5, 0] } },
  },
  fx: {
    replace: ['land'],
    /* a splash every time it lands, and a ribbit of bubbles */
    land: [{ glyph: 'drop', anchor: 'feet', rate: 8, spread: 0.2, velocity: [0, 0.7, 0.05], jitter: 0.7, gravity: 3.2, life: [0.45, 0.6], size: [0.035, 0.022], color: '#7fd0ff', align: true }],
    syllable: [{ glyph: 'bubble', anchor: 'mouth', rate: 1, offset: [0.1, 0, 0.02], velocity: [0.08, 0.18, 0.05], jitter: 0.08, wobble: 0.05, life: [0.9, 1.2], size: [0.016, 0.036], color: '#a6e8ff' }],
  },
};

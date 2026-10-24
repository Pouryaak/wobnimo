import type { CharacterSpec, PartSpec } from 'wobnimo';

/** A snail whose shell looks like a cinnamon roll. */
export const swirl: CharacterSpec = {
  id: 'swirl',
  name: 'Swirl',
  tagline: 'A slow, sweet snail carrying a glazed cinnamon roll for a shell',
  accent: '#c27a3e',
  frame: { target: 0.38, radius: 0.59 },
  bound: { y: 0.35, radius: 0.6 },
  motion: { hop: 0.03, squash: 1.4, snap: 0.7, talkSquash: 0.6 },
  materials: {
    skin: { color: '#b9d97a', f0: 0.06, spec: 1.4, shininess: 110, rim: 0.7, sss: 0.45, sssColor: '#e6ffb0', gloss: 0.8, surface: { kind: 'ripple', scale: 18, strength: 0.25 } },
    dough: { color: '#d9944f', f0: 0.03, spec: 0.5, shininess: 30, rim: 0.5, sheen: 0.3 },
    cinnamon: { color: '#8a4b22', shadeOf: 'dough', f0: 0.03, spec: 0.5, shininess: 30, rim: 0.4 },
    glaze: { color: '#fff4e4', f0: 0.08, spec: 1.6, shininess: 160, rim: 0.6, sss: 0.4, sssColor: '#ffffff', gloss: 0.9 },
    bead: { color: '#1a1410', f0: 0.06, spec: 2.2, shininess: 400, rim: 0.2, gloss: 1 },
  },
  bones: [
    { name: 'body', pivot: [0, 0.053, 0], drive: { ry: [['yaw', 0.3]], rz: [['roll', 0.3]] }, wave: { rz: [0.02, 0.4, 0] } },
    /* the head rises out of the foot at the front */
    { name: 'head', parent: 'body', pivot: [0.24, 0.12, 0.08], drive: { rx: [['pitch', -0.7]], ry: [['yaw', 0.7]], rz: [['roll', 0.6]] } },
    { name: 'stalkL', parent: 'head', pivot: [-0.06, 0.3, 0.02], rest: { rz: 0.3 }, jiggle: { axis: [0, 1, 0], length: 0.16, freq: 2.4, damping: 0.12 } },
    { name: 'stalkR', parent: 'head', pivot: [0.06, 0.3, 0.02], rest: { rz: -0.3 }, jiggle: { axis: [0, 1, 0], length: 0.16, freq: 2.4, damping: 0.12 } },
    { name: 'shell', parent: 'body', pivot: [-0.08, 0.12, -0.04], wave: { rz: [0.015, 0.4, 1] } },
  ],
  parts: [
    /* a long soft foot */
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.07, 0], radii: [0.42, 0.08, 0.2], material: 'skin' },
    /* the head and neck */
    { bone: 'head', shape: 'capsule', from: [0, -0.05, 0], to: [0, 0.2, 0.02], radius: 0.13, blend: 0.08, material: 'skin' },
    { bone: 'stalkL', shape: 'capsule', from: [0, 0, 0], to: [0, 0.14, 0], radius: 0.02, material: 'skin' },
    { bone: 'stalkL', shape: 'sphere', at: [0, 0.15, 0], radius: 0.035, material: 'skin' },
    { bone: 'stalkR', shape: 'capsule', from: [0, 0, 0], to: [0, 0.14, 0], radius: 0.02, material: 'skin' },
    { bone: 'stalkR', shape: 'sphere', at: [0, 0.15, 0], radius: 0.035, material: 'skin' },
    /* the shell: a cinnamon roll on its side, a spiral of dough and a lick of glaze */
    { bone: 'shell', shape: 'cylinder', at: [0, 0.27, 0], rot: [Math.PI / 2, 0, 0], radius: 0.27, half: 0.13, round: 0.07, material: 'dough' },
    /* the spiral: alternately carve a groove and fill the next ring back in, outside to centre
       (a subtraction only cuts what comes before it, so the order is the pattern) */
    ...[0.21, 0.15, 0.09].flatMap((r, i): PartSpec[] => [
      { bone: 'shell', shape: 'cylinder', at: [0.01 * i, 0.27 + 0.01 * i, 0.12], rot: [Math.PI / 2, 0, 0], radius: r, half: 0.03, round: 0.02, op: 'sub', blend: 0.015, material: 'cinnamon' },
      { bone: 'shell', shape: 'cylinder', at: [0.01 * i, 0.27 + 0.01 * i, 0.1], rot: [Math.PI / 2, 0, 0], radius: r - 0.03, half: 0.03, round: 0.025, blend: 0.01, material: 'dough' },
    ]),
    { bone: 'shell', shape: 'ellipsoid', at: [-0.04, 0.47, 0.03], radii: [0.2, 0.06, 0.15], blend: 0.03, material: 'glaze' },
  ],
  paints: [
    { bone: 'head', on: ['skin'], kind: 'sphere', at: [-0.09, 0.06, 0.1], radius: 0.035, color: '#ff9eb0', soft: 0.6, opacity: 0.8 },
    { bone: 'head', on: ['skin'], kind: 'sphere', at: [0.09, 0.06, 0.1], radius: 0.035, color: '#ff9eb0', soft: 0.6, opacity: 0.8 },
  ],
  eyes: { kind: 'bead', bone: 'head', at: [[-0.055, 0.14, 0.128], [0.055, 0.14, 0.128]], radii: [0.026, 0.038, 0.018], material: 'bead' },
  face: { kind: 'mouth', bone: 'head', on: ['skin'], at: [0, 0.05, 0.14], width: 0.04, color: '#3d4f1c', tongue: '#ff8a9a' },
  anchors: {
    top: { bone: 'shell', at: [0, 0.58, 0] },
    mouth: { bone: 'head', at: [0, 0.05, 0.16] },
    ear: { bone: 'head', at: [-0.14, 0.15, 0] },
    feet: { bone: 'root', at: [0.3, 0.02, 0.12] },
  },
  acting: {
    thinking: { head: { rz: 0.2 }, stalkL: { rz: 0.6 } },
    listening: { stalkL: { rx: -0.4 }, stalkR: { rx: -0.4 } },
    sleeping: { head: { rx: 0.5 }, stalkL: { rx: 1.1 }, stalkR: { rx: 1.1 } },
    error: { stalkL: { rz: [0.3, 0.3, 8, 0] }, stalkR: { rz: [-0.3, 0.3, 8, 1] } },
    surprised: { stalkL: { rz: 0.05 }, stalkR: { rz: -0.05 }, head: { rx: -0.2 } },
    celebrating: { stalkL: { rz: [0.4, 0.3, 4, 0] }, stalkR: { rz: [-0.4, 0.3, 4, Math.PI] } },
    sad: { head: { rx: 0.3 }, stalkL: { rx: 1.2, rz: 0.5 }, stalkR: { rx: 1.2, rz: -0.5 } },
  },
};

export default swirl;

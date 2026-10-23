import type { CharacterSpec } from '@animo/engine';

/** A glossy TV-headed robot: rigid shell, LED face, a sprung antenna. */
export const volt: CharacterSpec = {
  id: 'volt',
  name: 'Volt',
  tagline: 'Rigid shell, LED-matrix face, sprung antenna',
  accent: '#3b63d9',
  frame: { target: 0.86, radius: 1.02 },
  bound: { y: 0.86, radius: 1.08 },
  motion: { hop: 0.16, squash: 1, snap: 1 },
  materials: {
    shell: { color: '#2f56c4', f0: 0.05, spec: 0.7, shininess: 70, rim: 0.55, gloss: 0.55 },
    trim: { color: '#c3cce3', f0: 0.07, spec: 0.8, shininess: 90, metal: 0.25, rim: 0.4 },
    metal: { color: '#8f98ae', f0: 0.45, spec: 1, shininess: 120, metal: 0.85, rim: 0.3 },
    rubber: { color: '#151a28', f0: 0.03, spec: 0.15, shininess: 12, rim: 0.2 },
    screen: { color: '#03060c', f0: 0.045, spec: 1.6, shininess: 260, rim: 0.1, gloss: 1 },
    bulb: { color: '#f2f5ff', f0: 0.04, spec: 0.6, shininess: 40, rim: 0.3, glows: true, emitStrength: 1.4, sss: 0.4, sssColor: '#ffffff' },
    lamp: { color: '#e9eeff', f0: 0.05, spec: 1, shininess: 80, glows: true, emitStrength: 1.1 },
  },
  bones: [
    { name: 'body', pivot: [0, 0, 0], drive: { ry: [['yaw', 0.2]], rz: [['roll', 0.25]] } },
    { name: 'head', parent: 'body', pivot: [0, 0.64, 0], drive: { rx: [['pitch', -1]], ry: [['yaw', 0.8]], rz: [['roll', 0.75]] } },
    { name: 'antenna', parent: 'head', pivot: [0, 0.755, 0], jiggle: { axis: [0, 1, 0], length: 0.26, freq: 2.3, damping: 0.11 } },
    {
      name: 'armL', parent: 'body', pivot: [-0.395, 0.44, 0],
      drive: { rz: [['flap', -1.1]] }, wave: { rz: [0.05, 0.6, 0] },
      jiggle: { axis: [0, -1, 0], length: 0.24, freq: 2.6, damping: 0.3, maxAngle: 0.5 },
    },
    {
      name: 'armR', parent: 'body', pivot: [0.395, 0.44, 0],
      drive: { rz: [['flap', 1.1]] }, wave: { rz: [-0.05, 0.6, 1.4] },
      jiggle: { axis: [0, -1, 0], length: 0.24, freq: 2.6, damping: 0.3, maxAngle: 0.5 },
    },
  ],
  parts: [
    /* the body: a soft puck on two feet, with a lamp in the chest */
    { bone: 'body', shape: 'roundBox', at: [0, 0.32, 0], half: [0.35, 0.27, 0.28], round: 0.22, material: 'shell' },
    { bone: 'body', shape: 'roundBox', at: [0, 0.36, 0.27], half: [0.15, 0.09, 0.03], round: 0.06, material: 'rubber' },
    { bone: 'body', shape: 'sphere', at: [0, 0.36, 0.285], radius: 0.042, material: 'lamp' },
    { bone: 'body', shape: 'roundBox', at: [-0.17, 0.035, 0.05], half: [0.11, 0.035, 0.14], round: 0.035, material: 'trim' },
    { bone: 'body', shape: 'roundBox', at: [0.17, 0.035, 0.05], half: [0.11, 0.035, 0.14], round: 0.035, material: 'trim' },
    { bone: 'body', shape: 'cylinder', at: [0, 0.62, 0], radius: 0.075, half: 0.06, round: 0.02, material: 'metal' },

    /* the head: a shell with a rolled lip into the screen, a gasket and the glass */
    { bone: 'head', shape: 'roundBox', at: [0, 0.37, 0], half: [0.56, 0.37, 0.35], round: 0.17, material: 'shell' },
    { bone: 'head', shape: 'roundBox', op: 'sub', blend: 0.035, at: [0, 0.37, 0.41], half: [0.45, 0.28, 0.1], round: 0.12, material: 'shell' },
    { bone: 'head', shape: 'plate', at: [0, 0.37, 0.31], half: [0.45, 0.28], corner: 0.12, depth: 0.012, material: 'screen' },
    { bone: 'head', shape: 'frame', at: [0, 0.37, 0.3], half: [0.448, 0.278], corner: 0.118, width: 0.014, depth: 0.018, material: 'rubber' },
    /* knob ears */
    { bone: 'head', shape: 'cylinder', at: [-0.575, 0.37, 0], rot: [0, 0, 1.5708], radius: 0.12, half: 0.035, round: 0.02, material: 'trim' },
    { bone: 'head', shape: 'cylinder', at: [-0.63, 0.37, 0], rot: [0, 0, 1.5708], radius: 0.06, half: 0.04, round: 0.02, material: 'trim' },
    { bone: 'head', shape: 'cylinder', at: [0.575, 0.37, 0], rot: [0, 0, 1.5708], radius: 0.12, half: 0.035, round: 0.02, material: 'trim' },
    { bone: 'head', shape: 'cylinder', at: [0.63, 0.37, 0], rot: [0, 0, 1.5708], radius: 0.06, half: 0.04, round: 0.02, material: 'trim' },
    /* the antenna's collar, stem and bulb */
    { bone: 'head', shape: 'cylinder', at: [0, 0.745, 0], radius: 0.065, half: 0.025, round: 0.012, material: 'trim' },
    { bone: 'antenna', shape: 'capsule', from: [0, 0, 0], to: [0, 0.2, 0], radius: 0.016, material: 'metal' },
    { bone: 'antenna', shape: 'sphere', at: [0, 0.25, 0], radius: 0.055, material: 'bulb' },

    /* stubby arms */
    { bone: 'armL', shape: 'capsule', from: [0, 0, 0], to: [-0.05, -0.22, 0.02], radius: 0.072, material: 'shell' },
    { bone: 'armR', shape: 'capsule', from: [0, 0, 0], to: [0.05, -0.22, 0.02], radius: 0.072, material: 'shell' },
  ],
  face: {
    kind: 'screen',
    bone: 'head',
    material: 'screen',
    center: [0, 0.37],
    half: [0.44, 0.27],
    corner: 0.11,
    cell: 0.034,
    color: '#c4ecff',
  },
};

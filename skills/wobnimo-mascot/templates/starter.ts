import type { CharacterSpec } from 'wobnimo';

/*
  __NAME__: a starter mascot that passes every check. Reshape it into yours.

  Units: the floor is y = 0, +y is up, +x is to the right as you look at
  the character, +z points at the camera. One unit is about the height of
  a small mascot. Angles are radians.
*/
export const __CONST__: CharacterSpec = {
  id: '__ID__',
  name: '__NAME__',
  tagline: 'A round little friend with a springy tuft',
  accent: '#ff9f43',
  /* the camera looks at height `target` and fits a circle of `radius` */
  frame: { target: 0.42, radius: 0.62 },
  /* every part, in every state, must stay inside this sphere above the floor */
  bound: { y: 0.4, radius: 0.6 },
  motion: { hop: 0.16, squash: 1.2, snap: 1, talkSquash: 0.8 },

  materials: {
    skin: { color: '#ffb35c', f0: 0.04, spec: 0.8, shininess: 60, rim: 0.8, sss: 0.2, sssColor: '#ffd9a8' },
    foot: { color: '#e8893a', shadeOf: 'skin', f0: 0.04, spec: 0.6, shininess: 40, rim: 0.6 },
    tuft: { color: '#ff7a59', f0: 0.04, spec: 0.7, shininess: 50, rim: 0.8 },
  },

  /* body is the whole character; head nods and turns on top of it; tuft springs */
  bones: [
    { name: 'body', pivot: [0, 0, 0], drive: { ry: [['yaw', 0.3]], rz: [['roll', 0.4]] } },
    { name: 'head', parent: 'body', pivot: [0, 0.3, 0], drive: { rx: [['pitch', -0.6]], ry: [['yaw', 0.6]], rz: [['roll', 0.5]] } },
    { name: 'tuft', parent: 'head', pivot: [0, 0.45, 0], jiggle: { axis: [0, 1, 0], length: 0.12, freq: 2.4, damping: 0.12 } },
  ],

  /* each part is placed in its bone's space; `blend` melts it into the parts before it */
  parts: [
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.19, 0], radii: [0.25, 0.19, 0.23], material: 'skin' },
    { bone: 'head', shape: 'ellipsoid', at: [0, 0.2, 0], radii: [0.31, 0.27, 0.28], blend: 0.06, material: 'skin' },
    { bone: 'body', shape: 'ellipsoid', at: [-0.15, 0.04, 0.08], radii: [0.1, 0.05, 0.12], blend: 0.04, material: 'foot' },
    { bone: 'body', shape: 'ellipsoid', at: [0.15, 0.04, 0.08], radii: [0.1, 0.05, 0.12], blend: 0.04, material: 'foot' },
    { bone: 'tuft', shape: 'roundCone', from: [0, -0.04, 0], to: [0.02, 0.1, 0], r1: 0.035, r2: 0.012, material: 'tuft' },
    { bone: 'tuft', shape: 'roundCone', from: [0, -0.04, 0], to: [-0.06, 0.07, 0.01], r1: 0.03, r2: 0.01, blend: 0.01, material: 'tuft' },
  ],

  /* cheeks: soft colour painted where the surface passes near `at` */
  paints: [
    { bone: 'head', on: ['skin'], kind: 'sphere', at: [-0.2, 0.11, 0.22], radius: 0.05, color: '#ff8f8f', soft: 0.6, opacity: 0.8 },
    { bone: 'head', on: ['skin'], kind: 'sphere', at: [0.2, 0.11, 0.22], radius: 0.05, color: '#ff8f8f', soft: 0.6, opacity: 0.8 },
  ],

  /* the eye on your left (negative x) first; about 70% of each eyeball sits inside the head */
  eyes: { kind: 'ball', bone: 'head', at: [[-0.11, 0.2, 0.22], [0.11, 0.2, 0.22]], radius: 0.06, iris: '#2b1d14', irisSize: 0.85, pupilSize: 0.55, lid: 'skin' },
  face: { kind: 'mouth', bone: 'head', on: ['skin'], at: [0, 0.09, 0.26], width: 0.05, color: '#5a2a1a', tongue: '#ff7d8a' },

  /* where effects come from: thinking dots (top), speech (mouth), sound (ear), landing dust (feet) */
  anchors: {
    top: { bone: 'head', at: [0.14, 0.44, 0.05] },
    mouth: { bone: 'head', at: [0, 0.04, 0.3] },
    ear: { bone: 'head', at: [-0.27, 0.14, 0] },
    feet: { bone: 'root', at: [0, 0.02, 0.15] },
  },

  /* how each state moves the bones, on top of the shared rig (radians; [base, amp, hz, phase, spin]) */
  acting: {
    thinking: { head: { rz: 0.12 }, tuft: { rz: [0, 0.15, 1.2, 0] } },
    listening: { head: { rz: -0.1 }, tuft: { rx: -0.3 } },
    sleeping: { tuft: { rx: 0.9 } },
    error: { tuft: { rz: [0, 0.3, 10, 0] } },
    celebrating: { tuft: { ry: [0, 0, 0, 0, 12] } },
    sad: { tuft: { rx: 1.1, rz: 0.4 } },
  },
};

export default __CONST__;

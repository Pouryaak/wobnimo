import type { CharacterSpec, PaintSpec, PartSpec } from '@wobnimo/engine';

/** A strawberry with a leafy hat. */
export const berry: CharacterSpec = {
  id: 'berry',
  name: 'Berry',
  tagline: 'A plump strawberry with golden seeds and a leafy hat with a stalk on top',
  accent: '#e8324f',
  frame: { target: 0.43, radius: 0.57 },
  bound: { y: 0.41, radius: 0.5 },
  motion: { hop: 0.15, squash: 1.3, snap: 1.1, talkSquash: 0.5 },
  materials: {
    berry: { color: '#e8324f', f0: 0.07, spec: 1.6, shininess: 130, rim: 0.6, sss: 0.35, sssColor: '#ff7d8f', gloss: 0.8 },
    leaf: { color: '#3fa34d', f0: 0.04, spec: 0.7, shininess: 50, rim: 0.6, sss: 0.25, sssColor: '#b8f0a0' },
    bead: { color: '#1a1012', f0: 0.06, spec: 2.2, shininess: 400, rim: 0.2, gloss: 1 },
  },
  bones: [
    { name: 'body', pivot: [0, -0.042, 0], drive: { rx: [['pitch', -0.4]], ry: [['yaw', 0.6]], rz: [['roll', 0.5]] } },
    { name: 'hat', parent: 'body', pivot: [0, 0.73, 0], jiggle: { axis: [0, 1, 0], length: 0.12, freq: 3.2, damping: 0.16, maxAngle: 0.5 } },
  ],
  parts: [
    /* a rounded heart-shaped berry: wide at the shoulders, a soft point at the bottom */
    { bone: 'body', shape: 'roundCone', from: [0, 0.2, 0], to: [0, 0.48, 0], r1: 0.17, r2: 0.3, material: 'berry' },
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.5, 0], radii: [0.3, 0.2, 0.28], blend: 0.08, material: 'berry' },
    /* five leaves splayed over the shoulders, and a stalk */
    ...[0, 1, 2, 3, 4].map((i): PartSpec => {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      return { bone: 'hat', shape: 'ellipsoid', at: [Math.sin(a) * 0.15, -0.005, Math.cos(a) * 0.15], rot: [0.5, a, 0], radii: [0.075, 0.024, 0.15], blend: 0.02, material: 'leaf' };
    }),
    { bone: 'hat', shape: 'capsule', from: [0, 0, 0], to: [0.02, 0.1, 0], radius: 0.022, blend: 0.03, material: 'leaf' },
  ],
  paints: [
    /* golden seeds spiralled evenly over the skin, skipping the face; each sits exactly on the surface */
    ...([
      [0, 0.2, 0.192],
      [0.133, 0.21, -0.145],
      [-0.202, 0.22, 0.018],
      [0.165, 0.229, 0.126],
      [-0.037, 0.239, -0.209],
      [-0.117, 0.249, 0.184],
      [0.215, 0.259, -0.058],
      [-0.202, 0.268, -0.105],
      [0.08, 0.278, 0.219],
      [0.091, 0.288, -0.22],
      [-0.221, 0.298, 0.103],
      [0.238, 0.308, 0.075],
      [-0.128, 0.317, -0.22],
      [-0.056, 0.327, 0.254],
      [0.218, 0.337, -0.154],
      [-0.272, 0.347, -0.035],
      [0.012, 0.366, -0.281],
      [-0.203, 0.376, 0.204],
      [0.294, 0.386, -0.014],
      [-0.227, 0.396, -0.19],
      [0.172, 0.415, -0.248],
      [-0.301, 0.425, 0.068],
      [0.269, 0.435, 0.154],
      [-0.093, 0.444, -0.293],
      [0.292, 0.464, -0.122],
      [-0.299, 0.474, -0.108],
      [0.079, 0.493, -0.301],
      [-0.266, 0.503, 0.171],
      [0.314, 0.513, 0.054],
      [-0.191, 0.523, -0.247],
      [0.227, 0.542, -0.21],
      [-0.312, 0.552, 0.001],
      [0.225, 0.562, 0.205],
      [-0.027, 0.572, -0.296],
      [0.291, 0.591, -0.053],
      [-0.245, 0.601, -0.154],
      [0.074, 0.611, 0.27],
      [0.126, 0.62, -0.245],
      [-0.256, 0.63, 0.095],
      [0.246, 0.64, 0.1]
    ] as const).map(([x, y, z]): PaintSpec => ({ bone: 'body', on: ['berry'], kind: 'sphere', at: [x, y, z], radius: 0.022, color: '#ffd166', soft: 0.2 })),
    { bone: 'body', on: ['berry'], kind: 'sphere', at: [-0.16, 0.42, 0.25], radius: 0.05, color: '#ff9ab0', soft: 0.6, opacity: 0.6 },
    { bone: 'body', on: ['berry'], kind: 'sphere', at: [0.16, 0.42, 0.25], radius: 0.05, color: '#ff9ab0', soft: 0.6, opacity: 0.6 },
  ],
  eyes: { kind: 'bead', bone: 'body', at: [[-0.09, 0.5, 0.3], [0.09, 0.5, 0.3]], radii: [0.03, 0.045, 0.02], material: 'bead' },
  face: { kind: 'mouth', bone: 'body', on: ['berry'], at: [0, 0.41, 0.3], width: 0.045, color: '#5a1020', tongue: '#ff8fa3' },
  anchors: {
    top: { bone: 'hat', at: [0.06, 0.16, 0] },
    mouth: { bone: 'body', at: [0, 0.41, 0.31] },
    ear: { bone: 'body', at: [-0.3, 0.5, 0] },
    feet: { bone: 'root', at: [0, 0.02, 0.12] },
  },
  acting: {
    thinking: { hat: { rz: 0.3 } },
    sleeping: { hat: { rz: 0.4, rx: 0.2 } },
    error: { hat: { rz: [0, 0.3, 9, 0] } },
    celebrating: { hat: { ry: [0, 0, 0, 0, 10] } },
    sad: { hat: { rx: 0.4, rz: 0.3 } },
    happy: { hat: { ry: [0, 0, 0, 0, 14] } },
  },
};

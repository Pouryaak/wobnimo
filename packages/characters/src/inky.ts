import type { BoneSpec, CharacterSpec, PartSpec } from '@animo/engine';

/* Six tentacles, each a chain of three jiggle bones: every segment lags
   behind the one before it, so they trail and curl with no animation of
   their own beyond a slow wave. Generated here, but the result is plain
   data like any other spec. */
const TENTACLES = 6;
const SEGMENT = 0.17;
const RADII = [0.085, 0.064, 0.044, 0.016];
const CURL = [-0.6, -0.42, -0.62];

const bones: BoneSpec[] = [
  { name: 'mantle', pivot: [0, 0.42, 0], drive: { rx: [['pitch', -0.6]], ry: [['yaw', 0.6]], rz: [['roll', 0.6]] } },
];
const parts: PartSpec[] = [];

for (let i = 0; i < TENTACLES; i++) {
  const a = ((i + 0.5) / TENTACLES) * Math.PI * 2;
  for (let s = 0; s < 3; s++) {
    const name = `t${i}s${s}`;
    bones.push({
      name,
      parent: s === 0 ? 'mantle' : `t${i}s${s - 1}`,
      pivot: s === 0 ? [0.26 * Math.sin(a), 0.02, 0.26 * Math.cos(a)] : [0, -SEGMENT, 0],
      rest: s === 0 ? { rx: CURL[0], ry: a } : { rx: CURL[s] },
      wave: { rx: [0.12 + s * 0.1, 0.32, i * 1.3 + s * 0.8], rz: [0.06 + s * 0.05, 0.21, i * 2.1 + s] },
      jiggle: { axis: [0, -1, 0], length: SEGMENT, freq: 2.4 - s * 0.4, damping: 0.25, maxAngle: 0.8 },
    });
    parts.push({
      bone: name,
      shape: 'roundCone',
      from: [0, 0, 0],
      to: [0, -SEGMENT, 0],
      r1: RADII[s],
      r2: RADII[s + 1],
      blend: s === 0 ? 0.1 : 0.04,
      material: 'skin',
    });
  }
}

/** A floating octopus: a glossy mantle and six trailing tentacles. */
export const inky: CharacterSpec = {
  id: 'inky',
  name: 'Inky',
  tagline: 'Floats, with six tentacles that trail on spring chains',
  accent: '#e04f7d',
  frame: { target: 0.86, radius: 0.98 },
  bound: { y: 0.64, radius: 1.0 },
  motion: { float: 0.32, hop: 0.12, squash: 1.1, snap: 0.85, look: 0.8 },
  materials: {
    skin: { color: '#f2647f', f0: 0.05, spec: 1.1, shininess: 90, rim: 0.8, sss: 0.35, sssColor: '#ffb0c4', gloss: 0.7 },
  },
  bones,
  parts: [
    { bone: 'mantle', shape: 'ellipsoid', at: [0, 0.38, -0.04], radii: [0.43, 0.45, 0.41], material: 'skin' },
    { bone: 'mantle', shape: 'ellipsoid', at: [0, 0.04, 0], radii: [0.35, 0.15, 0.35], blend: 0.16, material: 'skin' },
    ...parts,
  ],
  paints: [
    ...([
      [0.14, 0.78, 0.12, 0.07],
      [-0.2, 0.72, 0.16, 0.055],
      [0.33, 0.6, 0.12, 0.05],
      [-0.04, 0.83, -0.05, 0.06],
      [-0.36, 0.52, 0.1, 0.05],
      [0.06, 0.62, 0.33, 0.045],
      [0.3, 0.42, -0.26, 0.045],
    ] as const).map(([x, y, z, r]) => ({
      bone: 'mantle', on: ['skin'], kind: 'sphere' as const, at: [x, y, z] as [number, number, number], radius: r, color: '#d23f6c', soft: 0.2,
    })),
    { bone: 'mantle', on: ['skin'], kind: 'sphere', at: [-0.27, 0.18, 0.31], radius: 0.065, color: '#ff9db0', soft: 0.6, opacity: 0.7 },
    { bone: 'mantle', on: ['skin'], kind: 'sphere', at: [0.27, 0.18, 0.31], radius: 0.065, color: '#ff9db0', soft: 0.6, opacity: 0.7 },
  ],
  eyes: {
    kind: 'ball',
    bone: 'mantle',
    at: [[-0.16, 0.27, 0.3], [0.16, 0.27, 0.3]],
    radius: 0.098,
    iris: '#f2b33d',
    irisSize: 0.66,
    pupilSize: 0.3,
    pupilAspect: 1.9,
    lid: 'skin',
  },
  face: {
    kind: 'mouth',
    bone: 'mantle',
    on: ['skin'],
    at: [0, 0.13, 0.3],
    width: 0.05,
    color: '#5a1430',
    tongue: '#ff8fa8',
  },
};

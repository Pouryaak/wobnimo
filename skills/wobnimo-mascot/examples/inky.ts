import type { BoneSpec, CharacterSpec, Expression, Motion, PartSpec } from 'wobnimo';

/* Six tentacles, each a chain of three jiggle bones: every segment lags
   behind the one before it, so they trail and curl with no animation of
   their own beyond a slow wave. Generated here, but the result is plain
   data like any other spec. */
const TENTACLES = 6;
const SEGMENT = 0.17;
const RADII = [0.085, 0.064, 0.044, 0.016];
const CURL = [-0.6, -0.42, -0.62];

type Acting = Partial<Record<Expression, Record<string, { rx?: Motion; rz?: Motion }>>>;

/* How the tentacles act. Each state sets every segment's curl; a couple of
   tentacles get their own business (one to the chin, one to the ear). */
function tentacleActing(): Acting {
  const acting: Required<Acting> = {
    idle: {}, thinking: {}, listening: {}, speaking: {}, sleeping: {}, working: {}, error: {}, surprised: {}, celebrating: {}, sad: {}, happy: {},
  };
  for (let i = 0; i < TENTACLES; i++) {
    const phase = i * 1.05;
    acting.speaking[`t${i}s0`] = { rx: [0, 0.2, 1.1, phase] };
    acting.speaking[`t${i}s2`] = { rx: [0, 0.35, 1.6, phase + 1] };
    acting.sleeping[`t${i}s0`] = { rx: 0.3 };
    acting.sleeping[`t${i}s1`] = { rx: 0.35 };
    acting.sleeping[`t${i}s2`] = { rx: 0.55 };
    acting.happy[`t${i}s0`] = { rx: [-0.45, 0.35, 2.4, phase] };
    acting.happy[`t${i}s1`] = { rx: [0, 0.3, 2.4, phase + 1] };
    /* a jolt: every tentacle splays and trembles */
    acting.error[`t${i}s0`] = { rx: -0.35 };
    acting.error[`t${i}s1`] = { rx: [0.35, 0.18, 9, phase] };
    acting.error[`t${i}s2`] = { rx: [0.2, 0.22, 11, phase + 2] };
    /* a fright flings them all up and out */
    acting.surprised[`t${i}s0`] = { rx: -0.85 };
    acting.surprised[`t${i}s1`] = { rx: -0.25 };
    acting.surprised[`t${i}s2`] = { rx: -0.3 };
    acting.celebrating[`t${i}s0`] = { rx: [-0.5, 0.3, 3, phase] };
    acting.celebrating[`t${i}s1`] = { rx: [0.15, 0.3, 3, phase + 1] };
    acting.celebrating[`t${i}s2`] = { rx: [0.2, 0.3, 3, phase + 2] };
    /* limp, hanging straight down */
    acting.sad[`t${i}s0`] = { rx: 0.45 };
    acting.sad[`t${i}s1`] = { rx: 0.42 };
    acting.sad[`t${i}s2`] = { rx: [0.55, 0.06, 0.4, phase] };
    acting.working[`t${i}s0`] = { rx: [-0.15, 0.08, 1.2, phase] };
  }
  /* the two front tentacles type, in turn */
  acting.working.t0s0 = { rx: [-1.25, 0.22, 5.5, 0] };
  acting.working.t0s1 = { rx: [0.7, 0.2, 5.5, 0.6] };
  acting.working.t5s0 = { rx: [-1.25, 0.22, 5.5, Math.PI] };
  acting.working.t5s1 = { rx: [0.7, 0.2, 5.5, Math.PI + 0.6] };
  /* and cheer, the front pair flung out to the sides (a swing across the
     tentacle, rz), never forward and up where they would cross the face */
  acting.celebrating.t0s0 = { rx: -0.3, rz: [1.05, 0.25, 3.2, 0] };
  acting.celebrating.t0s1 = { rx: [0.5, 0.15, 3.2, 1] };
  acting.celebrating.t0s2 = { rx: [0.6, 0.2, 3.2, 2] };
  acting.celebrating.t5s0 = { rx: -0.3, rz: [-1.05, 0.25, 3.2, Math.PI] };
  acting.celebrating.t5s1 = { rx: [0.5, 0.15, 3.2, Math.PI + 1] };
  acting.celebrating.t5s2 = { rx: [0.6, 0.2, 3.2, Math.PI + 2] };
  /* tentacle 0 sits front-right: it curls up to the chin */
  acting.thinking.t0s0 = { rx: -1.75 };
  acting.thinking.t0s1 = { rx: 0.95 };
  acting.thinking.t0s2 = { rx: [1.0, 0.12, 1.6, 0] };
  /* tentacle 5 sits front-left: it cups by the side of the head */
  acting.listening.t5s0 = { rx: -1.6 };
  acting.listening.t5s1 = { rx: -0.2 };
  acting.listening.t5s2 = { rx: 0.7 };
  return acting;
}

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
  motion: { float: 0.32, hop: 0.12, squash: 1.1, snap: 0.85, look: 0.8, talkSquash: 0.5 },
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
      [0.338, 0.425, -0.291, 0.045],
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
    width: 0.062,
    color: '#5a1430',
    tongue: '#ff8fa8',
  },
  anchors: {
    top: { bone: 'mantle', at: [0.16, 0.86, 0.1] },
    mouth: { bone: 'mantle', at: [0, 0.13, 0.33] },
    ear: { bone: 'mantle', at: [-0.46, 0.4, 0] },
    skirt: { bone: 'mantle', at: [0, 0.0, 0] },
  },
  acting: tentacleActing(),
  fx: {
    replace: ['syllable'],
    /* it lives underwater: bubbles rise all the time, and it talks in bubbles */
    ambient: [{ glyph: 'bubble', anchor: 'skirt', rate: 0.7, spread: 0.35, velocity: [0, 0.18, 0], jitter: 0.05, wobble: 0.06, life: [2.4, 3.2], size: [0.02, 0.045], color: '#8fcfff' }],
    syllable: [{ glyph: 'bubble', anchor: 'mouth', rate: 2, offset: [0, 0, 0.04], velocity: [0.05, 0.2, 0.1], jitter: 0.1, wobble: 0.05, life: [1, 1.4], size: [0.014, 0.034], color: '#9ad7ff' }],
  },
};

export default inky;

import type { CharacterSpec, PartSpec } from '@wobnimo/engine';

/** A penguin chick in a knitted scarf: a satin coat, a white face, flippers that flap. */
export const pebble: CharacterSpec = {
  id: 'pebble',
  name: 'Pebble',
  tagline: 'A penguin chick in a knitted scarf: satin coat, waddling walk, flippers that flap when it is happy',
  accent: '#3d5a9e',
  frame: { target: 0.56, radius: 0.76 },
  bound: { y: 0.52, radius: 0.74 },
  motion: { hop: 0.12, squash: 1.2, snap: 1.05, talkSquash: 0.45 },
  materials: {
    /* a short, dense coat: a satin sheen over very fine down */
    coat: {
      color: '#27324f', f0: 0.04, spec: 0.7, shininess: 46, rim: 1, sheen: 0.55, gloss: 0.35,
      surface: { kind: 'fur', scale: 130, strength: 0.28, bone: 'head' },
    },
    bodyCoat: {
      color: '#27324f', f0: 0.04, spec: 0.7, shininess: 46, rim: 1, sheen: 0.55, gloss: 0.35,
      surface: { kind: 'fur', scale: 130, strength: 0.28 },
    },
    flipper: { color: '#222b45', f0: 0.04, spec: 0.8, shininess: 50, rim: 0.9, sheen: 0.5, gloss: 0.4 },
    beak: { color: '#ffa53d', f0: 0.05, spec: 1, shininess: 80, rim: 0.4, gloss: 0.6 },
    mouth: { color: '#5d1a22', f0: 0.04, spec: 0.5, shininess: 30, rim: 0 },
    feet: { color: '#ff9b3d', f0: 0.04, spec: 0.7, shininess: 50, rim: 0.35, gloss: 0.4, sss: 0.25, sssColor: '#ffc68a' },
    /* chunky red knit: a pebbled surface with dark seams reads as stitches */
    knit: {
      color: '#e8433f', f0: 0.02, spec: 0.15, shininess: 10, rim: 0.7, sheen: 0.7,
      surface: { kind: 'scales', scale: 42, strength: 0.75, color: '#a8242a' },
    },
    knitStripe: { color: '#fff2e6', f0: 0.02, spec: 0.15, shininess: 10, rim: 0.6, sheen: 0.7 },
  },
  bones: [
    /* the body rolls side to side as it shifts its weight: the waddle */
    { name: 'body', pivot: [0, 0, 0], drive: { ry: [['yaw', 0.2]], rz: [['roll', 0.35]] }, wave: { rz: [0.035, 0.9, 0] } },
    { name: 'head', parent: 'body', pivot: [0, 0.6, 0.01], drive: { rx: [['pitch', -1]], ry: [['yaw', 0.8]], rz: [['roll', 0.7]] } },
    { name: 'beak', parent: 'head', pivot: [0, 0.12, 0.27], drive: { rx: [['talk', -0.22]] } },
    { name: 'jaw', parent: 'head', pivot: [0, 0.12, 0.27], drive: { rx: [['talk', 0.75]] } },
    /* a little crest of down on top */
    { name: 'tuft', parent: 'head', pivot: [0, 0.42, 0.02], rest: { rx: -0.2 }, jiggle: { axis: [0, 1, 0], length: 0.1, freq: 3.4, damping: 0.15 } },
    {
      name: 'flipperL', parent: 'body', pivot: [-0.3, 0.5, 0], rest: { rz: -0.2 },
      drive: { rz: [['flap', -1.4]] }, jiggle: { axis: [0, -1, 0], length: 0.26, freq: 3.4, damping: 0.3, maxAngle: 0.45 },
    },
    {
      name: 'flipperR', parent: 'body', pivot: [0.3, 0.5, 0], rest: { rz: 0.2 },
      drive: { rz: [['flap', 1.4]] }, jiggle: { axis: [0, -1, 0], length: 0.26, freq: 3.4, damping: 0.3, maxAngle: 0.45 },
    },
    /* the scarf's loose end hangs over the shoulder and swings */
    { name: 'scarf', parent: 'body', pivot: [0.13, 0.56, 0.25], rest: { rz: 0.12, rx: -0.15 }, jiggle: { axis: [0, -1, 0], length: 0.2, freq: 2.4, damping: 0.16, maxAngle: 0.7 } },
    { name: 'tail', parent: 'body', pivot: [0, 0.1, -0.27], rest: { rx: -1.2 }, jiggle: { axis: [0, 1, 0], length: 0.08, freq: 3, damping: 0.2 } },
  ],
  parts: [
    /* an egg of a body and a big round head, blended into one */
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.34, -0.01], radii: [0.32, 0.34, 0.29], material: 'bodyCoat' },
    { bone: 'head', shape: 'sphere', at: [0, 0.16, 0], radius: 0.28, blend: 0.14, material: 'coat' },
    /* the scarf: a fat knitted collar and a striped end */
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.575, 0.005], radii: [0.3, 0.078, 0.28], material: 'knit' },
    { bone: 'scarf', shape: 'roundBox', at: [0, -0.1, 0.01], half: [0.05, 0.1, 0.018], round: 0.016, material: 'knit' },
    { bone: 'scarf', shape: 'roundBox', at: [0, -0.195, 0.01], half: [0.052, 0.018, 0.02], round: 0.012, material: 'knitStripe' },
    /* a small beak in two halves */
    { bone: 'head', shape: 'ellipsoid', at: [0, 0.12, 0.29], radii: [0.035, 0.02, 0.025], material: 'mouth' },
    { bone: 'beak', shape: 'ellipsoid', at: [0, 0, 0.035], rot: [0.15, 0, 0], radii: [0.05, 0.034, 0.05], clip: { normal: [0, -1, 0] }, material: 'beak' },
    { bone: 'beak', shape: 'ellipsoid', at: [0, 0, 0.035], rot: [0.15, 0, 0], radii: [0.041, 0.028, 0.042], clip: { normal: [0, -1, 0], offset: 0.003 }, material: 'mouth' },
    { bone: 'jaw', shape: 'ellipsoid', at: [0, 0, 0.026], radii: [0.043, 0.025, 0.044], clip: { normal: [0, 1, 0] }, material: 'beak' },
    { bone: 'jaw', shape: 'ellipsoid', at: [0, 0, 0.026], radii: [0.035, 0.019, 0.036], clip: { normal: [0, 1, 0], offset: 0.003 }, material: 'mouth' },
    { bone: 'tuft', shape: 'roundCone', from: [0, -0.03, 0], to: [0.01, 0.07, 0.02], r1: 0.035, r2: 0.008, blend: 0.03, material: 'coat' },
    { bone: 'tuft', shape: 'roundCone', from: [0, -0.03, 0], to: [-0.04, 0.05, -0.02], r1: 0.028, r2: 0.007, blend: 0.03, material: 'coat' },
    /* flippers: flat, tapered, lying against the sides */
    { bone: 'flipperL', shape: 'ellipsoid', at: [-0.02, -0.16, 0.02], rot: [0, 0, -0.12], radii: [0.045, 0.2, 0.11], blend: 0.02, material: 'flipper' },
    { bone: 'flipperR', shape: 'ellipsoid', at: [0.02, -0.16, 0.02], rot: [0, 0, 0.12], radii: [0.045, 0.2, 0.11], blend: 0.02, material: 'flipper' },
    { bone: 'tail', shape: 'ellipsoid', at: [0, 0.05, 0], radii: [0.08, 0.07, 0.025], blend: 0.03, material: 'bodyCoat' },
    /* big orange feet, three soft toes each */
    ...[-1, 1].flatMap((s): PartSpec[] => [
      { bone: 'root', shape: 'ellipsoid', at: [s * 0.13, 0.03, 0.17], rot: [0, s * 0.25, 0], radii: [0.1, 0.03, 0.11], material: 'feet' },
      ...[-1, 0, 1].map((t): PartSpec => ({
        bone: 'root', shape: 'sphere', at: [s * 0.16 + t * 0.055, 0.03, 0.26 - Math.abs(t) * 0.02], radius: 0.034, blend: 0.03, material: 'feet',
      })),
    ]),
  ],
  paints: [
    /* a white belly and a heart-shaped white face */
    { bone: 'body', on: ['bodyCoat'], kind: 'ellipse', at: [0, 0.3, 0.08], radii: [0.24, 0.27], color: '#f8f6f0', soft: 0.12 },
    { bone: 'head', on: ['coat'], kind: 'sphere', at: [-0.1, 0.13, 0.22], radius: 0.14, color: '#f8f6f0', soft: 0.12 },
    { bone: 'head', on: ['coat'], kind: 'sphere', at: [0.1, 0.13, 0.22], radius: 0.14, color: '#f8f6f0', soft: 0.12 },
    { bone: 'head', on: ['coat'], kind: 'ellipse', at: [0, 0.02, 0.1], radii: [0.17, 0.08], color: '#f8f6f0', soft: 0.2 },
    { bone: 'head', on: ['coat'], kind: 'sphere', at: [-0.17, 0.06, 0.2], radius: 0.05, color: '#ff9eb0', soft: 0.6, opacity: 0.8 },
    { bone: 'head', on: ['coat'], kind: 'sphere', at: [0.17, 0.06, 0.2], radius: 0.05, color: '#ff9eb0', soft: 0.6, opacity: 0.8 },
    /* a white stripe across the scarf's end, knitted in */
    { bone: 'scarf', on: ['knit'], kind: 'ellipse', at: [0, -0.12, 0], radii: [0.08, 0.018], color: '#fff2e6', soft: 0.15 },
  ],
  eyes: {
    kind: 'ball',
    bone: 'head',
    at: [[-0.1, 0.18, 0.23], [0.1, 0.18, 0.23]],
    radius: 0.066,
    iris: '#1d2233',
    irisSize: 0.8,
    pupilSize: 0.5,
    lid: 'coat',
  },
  anchors: {
    top: { bone: 'head', at: [0.12, 0.44, 0.06] },
    mouth: { bone: 'head', at: [0, 0.11, 0.36] },
    ear: { bone: 'head', at: [-0.3, 0.18, 0] },
    feet: { bone: 'root', at: [0, 0.02, 0.17] },
    chest: { bone: 'body', at: [0, 0.4, 0.3] },
  },
  acting: {
    idle: { tail: { rz: [0, 0.2, 0.9, 0] } },
    /* a flipper tip to the beak */
    thinking: {
      flipperR: { rz: 1.2, rx: -1.1, ry: -0.3 },
      head: { rz: 0.1 },
    },
    listening: {
      flipperL: { rz: -0.9, rx: -0.3 },
      tuft: { rx: -0.35 },
    },
    speaking: {
      flipperL: { rz: [-0.15, 0.15, 1.8, 0] },
      flipperR: { rz: [0.15, 0.15, 1.8, 1.5] },
    },
    /* flippers folded over the belly, tucked into the scarf */
    sleeping: {
      flipperL: { ry: 0.6, rz: 0.2 },
      flipperR: { ry: -0.6, rz: -0.2 },
      tuft: { rx: 0.5 },
    },
    /* tapping away with both flipper tips */
    working: {
      flipperL: { rx: [-0.7, 0.15, 6, 0], rz: 0.2 },
      flipperR: { rx: [-0.7, 0.15, 6, Math.PI], rz: -0.2 },
      head: { rx: 0.12 },
    },
    /* flippers stuck straight out, trembling */
    error: {
      flipperL: { rz: [-1.25, 0.08, 13, 0] },
      flipperR: { rz: [1.25, 0.08, 13, 1] },
      tuft: { rx: -0.6 },
    },
    surprised: {
      flipperL: { rz: -1.6, rx: -0.3 },
      flipperR: { rz: 1.6, rx: -0.3 },
      tuft: { rx: -0.7 },
    },
    /* penguins flap when they are delighted */
    celebrating: {
      flipperL: { rz: [-1.1, 0.55, 8, 0] },
      flipperR: { rz: [1.1, 0.55, 8, 0] },
      tail: { rz: [0, 0.4, 4, 0] },
    },
    /* flippers hang, the crest flops */
    sad: {
      flipperL: { rz: 0.18 },
      flipperR: { rz: -0.18 },
      tuft: { rx: 0.8 },
      scarf: { rx: 0.1 },
    },
    happy: {
      flipperL: { rz: [-0.8, 0.6, 9, 0] },
      flipperR: { rz: [0.8, 0.6, 9, 0] },
      tail: { rz: [0, 0.35, 5, 0] },
    },
  },
  fx: {
    replace: ['land'],
    /* it lands in snow */
    land: [{ glyph: 'puff', anchor: 'feet', rate: 8, spread: 0.12, velocity: [0, 0.06, 0], jitter: 0.34, drag: 3.5, life: [0.5, 0.75], size: [0.05, 0.12], color: '#eef4ff' }],
    celebrating: [{ glyph: 'sparkle', anchor: 'top', rate: 3, spread: 0.4, velocity: [0, -0.05, 0], jitter: 0.08, wobble: 0.08, life: [1.4, 1.8], size: [0.04, 0.01], spin: 1.2, color: '#dff0ff' }],
  },
};

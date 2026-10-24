# Recipes

Ready-made features. Each recipe is a fragment of a spec: merge each list
into the list of the same name in your file (`bones` into `bones`, `parts`
into `parts`, and so on), keeping the order shown.

**Every number here fits the starter template** (`npx wobnimo new`):

```
body bone   pivot [0, 0, 0]       body ellipsoid  at [0, 0.19, 0]  radii [0.25, 0.19, 0.23]
head bone   pivot [0, 0.3, 0]     head ellipsoid  at [0, 0.2, 0]   radii [0.31, 0.27, 0.28]
                                   (head space: top of head y 0.47, front z 0.28, sides x ±0.31)
```

If your body or head is a different size or in a different place, move the
recipe with it: shift `at`, `from`, `to` and `pivot` by the same amount your
head or body moved, and scale sizes by how much bigger or smaller it is.
Then run `npx wobnimo check` and apply its fixes.

Materials named `skin` in the recipes mean your main material. Recipes that
add a material give its full preset.

## Finding a point on a surface

You often need a point **on** the surface: where an ear sits, where a spot
goes, where a paint belongs. For an ellipsoid with centre `c` and radii
`[rx, ry, rz]`, pick a direction `d = [dx, dy, dz]` from the centre (it does
not need to be unit length) and compute:

```
k = 1 / sqrt((dx/rx)² + (dy/ry)² + (dz/rz)²)
point = [c.x + dx·k, c.y + dy·k, c.z + dz·k]
```

For a sphere of radius `r`, `k = r / sqrt(dx² + dy² + dz²)`.

Example: a spot on the starter head, up and to the right and forward,
direction `[0.5, 0.5, 0.7]`:
`k = 1 / sqrt((0.5/0.31)² + (0.5/0.27)² + (0.7/0.28)²) = 1 / sqrt(2.60 + 3.43 + 6.25) = 0.285`
→ point `[0.143, 0.2 + 0.143, 0.2] = [0.143, 0.343, 0.2]` in head space.

To push something **into** the surface (an ear base, a horn root), move it a
little toward the centre. To sit **on** the surface (a paint, a spot), use the
point itself.

---

## Ears

### Round ears (bear, panda, mouse, hamster)

```ts
materials: {
  ear: { color: '#ffb35c', shadeOf: 'skin', f0: 0.04, spec: 0.8, shininess: 60, rim: 0.8, sss: 0.2, sssColor: '#ffd9a8' },
},
parts: [
  { bone: 'head', shape: 'sphere', at: [-0.2, 0.42, -0.03], radius: 0.09, blend: 0.03, material: 'ear' },
  { bone: 'head', shape: 'sphere', at: [0.2, 0.42, -0.03], radius: 0.09, blend: 0.03, material: 'ear' },
],
paints: [
  /* inner ear: painted only on the 'ear' material, so it cannot spill onto the head */
  { bone: 'head', on: ['ear'], kind: 'sphere', at: [-0.21, 0.44, 0.055], radius: 0.05, color: '#ff9f9f', soft: 0.4 },
  { bone: 'head', on: ['ear'], kind: 'sphere', at: [0.21, 0.44, 0.055], radius: 0.05, color: '#ff9f9f', soft: 0.4 },
],
```

Mouse: radius 0.13, at `[±0.24, 0.42, -0.04]`. Panda: give the ears a dark
material instead of the inner paint.

### Pointed ears that spring (cat, fox, wolf)

```ts
materials: {
  ear: { color: '#ffb35c', shadeOf: 'skin', f0: 0.04, spec: 0.8, shininess: 60, rim: 0.8, sss: 0.2, sssColor: '#ffd9a8' },
},
bones: [
  { name: 'earL', parent: 'head', pivot: [-0.15, 0.4, 0], rest: { rz: 0.3 }, jiggle: { axis: [0, 1, 0], length: 0.16, freq: 3.5, damping: 0.2, maxAngle: 0.4 } },
  { name: 'earR', parent: 'head', pivot: [0.15, 0.4, 0], rest: { rz: -0.3 }, jiggle: { axis: [0, 1, 0], length: 0.16, freq: 3.5, damping: 0.2, maxAngle: 0.4 } },
],
parts: [
  { bone: 'earL', shape: 'roundCone', from: [0, 0, 0], to: [0, 0.18, 0], r1: 0.08, r2: 0.015, material: 'ear' },
  { bone: 'earR', shape: 'roundCone', from: [0, 0, 0], to: [0, 0.18, 0], r1: 0.08, r2: 0.015, material: 'ear' },
],
paints: [
  { bone: 'earL', on: ['ear'], kind: 'ellipse', at: [0, 0.07, 0.04], radii: [0.035, 0.07], color: '#ffd9c2', soft: 0.4 },
  { bone: 'earR', on: ['ear'], kind: 'ellipse', at: [0, 0.07, 0.04], radii: [0.035, 0.07], color: '#ffd9c2', soft: 0.4 },
],
acting: {
  listening: { earL: { rx: -0.3 }, earR: { rx: -0.3 } },
  sad: { earL: { rz: 1, rx: 0.4 }, earR: { rz: -1, rx: 0.4 } },
  error: { earL: { rz: 1.1 }, earR: { rz: -1.1 } },
},
```

Dark ear tips (fox): add a sphere paint at the tip,
`{ bone: 'earL', on: ['ear'], kind: 'sphere', at: [0, 0.2, 0], radius: 0.07, color: '#3a2318', soft: 0.3 }`.

### Long floppy ears (bunny)

```ts
materials: {
  ear: { color: '#fbf8f4', shadeOf: 'skin', f0: 0.03, spec: 0.4, shininess: 20, rim: 1.2, sheen: 0.7, sss: 0.35, sssColor: '#ffc4d4' },
},
bones: [
  { name: 'earL', parent: 'head', pivot: [-0.11, 0.42, -0.02], rest: { rz: 0.3, rx: 0.15 }, jiggle: { axis: [0, 1, 0], length: 0.32, freq: 2, damping: 0.14, maxAngle: 0.8 } },
  { name: 'earR', parent: 'head', pivot: [0.11, 0.42, -0.02], rest: { rz: -0.3, rx: 0.15 }, jiggle: { axis: [0, 1, 0], length: 0.32, freq: 2, damping: 0.14, maxAngle: 0.8 } },
],
parts: [
  { bone: 'earL', shape: 'ellipsoid', at: [0, 0.2, 0], radii: [0.065, 0.22, 0.035], material: 'ear' },
  { bone: 'earR', shape: 'ellipsoid', at: [0, 0.2, 0], radii: [0.065, 0.22, 0.035], material: 'ear' },
],
paints: [
  { bone: 'earL', on: ['ear'], kind: 'ellipse', at: [0, 0.2, 0.01], radii: [0.035, 0.16], color: '#ffc2d3', soft: 0.4 },
  { bone: 'earR', on: ['ear'], kind: 'ellipse', at: [0, 0.2, 0.01], radii: [0.035, 0.16], color: '#ffc2d3', soft: 0.4 },
],
acting: {
  listening: { earL: { rz: 0, rx: -0.2 }, earR: { rz: 0, rx: -0.2 } },
  sleeping: { earL: { rz: 1.2, rx: 0.5 }, earR: { rz: -1.2, rx: 0.5 } },
  sad: { earL: { rz: 1.4, rx: 0.6 }, earR: { rz: -1.4, rx: 0.6 } },
},
```

These ears make the character about 0.4 taller: run the check and copy the
new `frame` and `bound` it suggests.

---

## Arms, legs and feet

### Stubby arms that wave (driven by `flap`)

```ts
bones: [
  { name: 'armL', parent: 'body', pivot: [-0.21, 0.27, 0.04], rest: { rz: -0.35 }, drive: { rz: [['flap', -1.2]] } },
  { name: 'armR', parent: 'body', pivot: [0.21, 0.27, 0.04], rest: { rz: 0.35 }, drive: { rz: [['flap', 1.2]] } },
],
parts: [
  { bone: 'armL', shape: 'capsule', from: [0, 0, 0], to: [0, -0.12, 0.02], radius: 0.05, blend: 0.03, material: 'skin' },
  { bone: 'armR', shape: 'capsule', from: [0, 0, 0], to: [0, -0.12, 0.02], radius: 0.05, blend: 0.03, material: 'skin' },
],
```

The arm hangs down from the shoulder pivot. The engine raises both arms when
celebrating and surprised. Acting for arms (the right arm takes the opposite
sign of the left):

```ts
acting: {
  /* a wave with the right arm: rz > 0 swings a right arm out and up */
  celebrating: { armR: { rz: [1.8, 0.4, 3, 0] } },
  /* droop: swing both hands in against the body */
  sad: { armL: { rz: 0.3 }, armR: { rz: -0.3 } },
  sleeping: { armL: { rz: 0.3 }, armR: { rz: -0.3 } },
},
```

### Feet (already in the starter)

```ts
parts: [
  { bone: 'body', shape: 'ellipsoid', at: [-0.15, 0.04, 0.08], radii: [0.1, 0.05, 0.12], blend: 0.04, material: 'foot' },
  { bone: 'body', shape: 'ellipsoid', at: [0.15, 0.04, 0.08], radii: [0.1, 0.05, 0.12], blend: 0.04, material: 'foot' },
],
```

Feet sit with their bottom on the floor: `at.y` equals the y radius.

### Short legs with feet

Raise the body first: change the body ellipsoid's `at` to `[0, 0.32, 0]` and
the head bone's pivot to `[0, 0.43, 0]`, and remove the starter's two feet.
Then:

```ts
parts: [
  { bone: 'body', shape: 'capsule', from: [-0.11, 0.22, 0], to: [-0.12, 0.07, 0.02], radius: 0.055, blend: 0.04, material: 'skin' },
  { bone: 'body', shape: 'capsule', from: [0.11, 0.22, 0], to: [0.12, 0.07, 0.02], radius: 0.055, blend: 0.04, material: 'skin' },
  { bone: 'body', shape: 'ellipsoid', at: [-0.12, 0.04, 0.05], radii: [0.08, 0.045, 0.11], blend: 0.03, material: 'foot' },
  { bone: 'body', shape: 'ellipsoid', at: [0.12, 0.04, 0.05], radii: [0.08, 0.045, 0.11], blend: 0.03, material: 'foot' },
],
```

---

## Wings, tails, horns and antennae

### Small wings (bird, bee, bat, angel)

```ts
materials: {
  wing: { color: '#e8f6ff', f0: 0.1, spec: 1.8, shininess: 200, rim: 1.4, sss: 0.6, sssColor: '#ffffff', gloss: 0.9 },
},
bones: [
  { name: 'wingL', parent: 'body', pivot: [-0.16, 0.3, -0.16], drive: { rz: [['flap', -1.4]] }, wave: { rz: [0.08, 0.8, 0] } },
  { name: 'wingR', parent: 'body', pivot: [0.16, 0.3, -0.16], drive: { rz: [['flap', 1.4]] }, wave: { rz: [-0.08, 0.8, 1.6] } },
],
parts: [
  { bone: 'wingL', shape: 'ellipsoid', at: [-0.1, 0.1, 0], rot: [0, 0, 0.5], radii: [0.12, 0.17, 0.014], material: 'wing' },
  { bone: 'wingR', shape: 'ellipsoid', at: [0.1, 0.1, 0], rot: [0, 0, -0.5], radii: [0.12, 0.17, 0.014], material: 'wing' },
],
acting: {
  celebrating: { wingL: { rz: [0, 0.5, 9, 0] }, wingR: { rz: [0, 0.5, 9, Math.PI] } },
},
```

Feathered wings (bird): use the body's feather material, make them thicker
(`radii: [0.1, 0.16, 0.05]`) and hang them at the sides like arms.

### A tail that wags

```ts
bones: [
  { name: 'tail', parent: 'body', pivot: [0, 0.14, -0.2], rest: { rx: -0.5 }, wave: { ry: [0.25, 1.2, 0] },
    jiggle: { axis: [0, 0, -1], length: 0.2, freq: 2.5, damping: 0.15 } },
],
parts: [
  { bone: 'tail', shape: 'roundCone', from: [0, 0, 0], to: [0, 0.04, -0.22], r1: 0.06, r2: 0.035, blend: 0.03, material: 'skin' },
],
acting: {
  celebrating: { tail: { ry: [0, 0.7, 4, 0] } },
  happy: { tail: { ry: [0, 0.7, 5, 0] } },
  sad: { tail: { rx: 0.6 } },
},
```

Pom-pom tail (bunny, bear): a `sphere` of radius 0.07 at `[0, 0, -0.03]` on the
tail bone instead. Big fluffy tail (fox, squirrel): see `ember`.

### Horns

```ts
materials: {
  horn: { color: '#fff1d6', f0: 0.05, spec: 1, shininess: 80, rim: 0.4, gloss: 0.6 },
},
parts: [
  { bone: 'head', shape: 'roundCone', from: [-0.13, 0.4, 0], to: [-0.18, 0.56, -0.02], r1: 0.045, r2: 0.012, blend: 0.02, material: 'horn' },
  { bone: 'head', shape: 'roundCone', from: [0.13, 0.4, 0], to: [0.18, 0.56, -0.02], r1: 0.045, r2: 0.012, blend: 0.02, material: 'horn' },
],
```

One unicorn horn: `from: [0, 0.42, 0.06], to: [0, 0.64, 0.1], r1: 0.05, r2: 0.01`.

### Antenna with a glowing bulb

The bulb takes the colour of the current state (`glows: true`).

```ts
materials: {
  stalk: { color: '#3a3f4c', f0: 0.04, spec: 0.8, shininess: 60, rim: 0.5 },
  bulb: { color: '#ffffff', f0: 0.05, spec: 1, shininess: 120, rim: 0, glows: true, emitStrength: 1.4 },
},
bones: [
  { name: 'antenna', parent: 'head', pivot: [0, 0.45, 0], jiggle: { axis: [0, 1, 0], length: 0.16, freq: 2.6, damping: 0.1 } },
],
parts: [
  { bone: 'antenna', shape: 'capsule', from: [0, -0.02, 0], to: [0, 0.13, 0], radius: 0.012, material: 'stalk' },
  { bone: 'antenna', shape: 'sphere', at: [0, 0.16, 0], radius: 0.035, material: 'bulb' },
],
```

Move the `top` anchor above the bulb: `top: { bone: 'antenna', at: [0, 0.22, 0] }`.

---

## Things to wear

### Party hat with a pom-pom

```ts
materials: {
  hat: { color: '#7c5cff', f0: 0.06, spec: 1.6, shininess: 160, rim: 0.5, gloss: 0.8 },
  pom: { color: '#ffd84d', f0: 0.03, spec: 0.4, shininess: 20, rim: 1, sheen: 0.7 },
},
parts: [
  { bone: 'head', shape: 'roundCone', at: [0.05, 0.44, 0], rot: [0, 0, -0.25], from: [0, 0, 0], to: [0, 0.2, 0], r1: 0.1, r2: 0.012, material: 'hat' },
  { bone: 'head', shape: 'sphere', at: [0.1, 0.64, 0], radius: 0.035, material: 'pom' },
],
```

Stripes on the hat: sphere paints along it (see "Stripes" below).

### Beanie

```ts
materials: {
  knit: { color: '#e8433f', f0: 0.02, spec: 0.15, shininess: 10, rim: 0.7, sheen: 0.7, surface: { kind: 'scales', scale: 42, strength: 0.75, color: '#a8242a', bone: 'head' } },
},
parts: [
  /* the top half of an ellipsoid a little larger than the head */
  { bone: 'head', shape: 'ellipsoid', at: [0, 0.27, -0.01], radii: [0.32, 0.23, 0.29], clip: { normal: [0, -1, 0] }, material: 'knit' },
  { bone: 'head', shape: 'cylinder', at: [0, 0.29, -0.01], radius: 0.315, half: 0.035, round: 0.03, material: 'knit' },
  { bone: 'head', shape: 'sphere', at: [0, 0.52, -0.01], radius: 0.06, material: 'knit' },
],
```

Keep the eyes below the beanie's rim (eye y under 0.24).

### Headphones

```ts
materials: {
  band: { color: '#20253a', f0: 0.06, spec: 1.4, shininess: 120, rim: 0.4, gloss: 0.7 },
  cup: { color: '#4f7cff', f0: 0.08, spec: 1.6, shininess: 160, rim: 0.5, gloss: 0.8 },
},
parts: [
  /* the band: a ring around the head's outline, facing the camera, cut to its top half */
  { bone: 'head', shape: 'frame', at: [0, 0.2, 0], half: [0.33, 0.29], corner: 0.29, width: 0.015, depth: 0.025, clip: { normal: [0, -1, 0] }, material: 'band' },
  /* the cups: cylinders turned on their side (rz 90°) */
  { bone: 'head', shape: 'cylinder', at: [-0.33, 0.18, 0], rot: [0, 0, 1.5708], radius: 0.1, half: 0.045, round: 0.02, material: 'cup' },
  { bone: 'head', shape: 'cylinder', at: [0.33, 0.18, 0], rot: [0, 0, 1.5708], radius: 0.1, half: 0.045, round: 0.02, material: 'cup' },
],
anchors: {
  ear: { bone: 'head', at: [-0.38, 0.18, 0] },
},
```

The band's `half` is the head's x and y radii plus 0.02, so it hugs the head
without touching it. Move the `ear` anchor onto a cup, as above.

### Round glasses

```ts
materials: {
  rims: { color: '#2b2b33', f0: 0.06, spec: 1.6, shininess: 160, rim: 0.4, gloss: 0.8 },
},
parts: [
  /* a frame shape faces the camera; one ring per eye, in front of it */
  { bone: 'head', shape: 'frame', at: [-0.11, 0.2, 0.275], half: [0.075, 0.075], corner: 0.075, width: 0.01, depth: 0.008, material: 'rims' },
  { bone: 'head', shape: 'frame', at: [0.11, 0.2, 0.275], half: [0.075, 0.075], corner: 0.075, width: 0.01, depth: 0.008, material: 'rims' },
  { bone: 'head', shape: 'capsule', from: [-0.035, 0.21, 0.285], to: [0.035, 0.21, 0.285], radius: 0.009, material: 'rims' },
],
```

Square glasses: a smaller `corner` (0.02). Put the rings just in front of the
eyes: their z is the face's surface plus about 0.005.

### Bow

```ts
materials: {
  bow: { color: '#ff5d8f', f0: 0.06, spec: 1.6, shininess: 160, rim: 0.5, gloss: 0.8 },
},
parts: [
  { bone: 'head', shape: 'ellipsoid', at: [0.2, 0.43, 0.02], rot: [0, 0, 0.5], radii: [0.075, 0.05, 0.03], material: 'bow' },
  { bone: 'head', shape: 'ellipsoid', at: [0.31, 0.39, 0.02], rot: [0, 0, -0.3], radii: [0.075, 0.05, 0.03], material: 'bow' },
  { bone: 'head', shape: 'sphere', at: [0.26, 0.41, 0.03], radius: 0.035, material: 'bow' },
],
```

---

## Faces

### Snout with a glossy nose (dog, bear, pig)

```ts
materials: {
  nose: { color: '#1d1410', f0: 0.06, spec: 1.8, shininess: 200, rim: 0.3, gloss: 0.9 },
  snout: { color: '#ffe3c2', f0: 0.04, spec: 0.8, shininess: 60, rim: 0.8, sss: 0.2, sssColor: '#fff0dc' },
},
parts: [
  { bone: 'head', shape: 'ellipsoid', at: [0, 0.1, 0.22], radii: [0.12, 0.08, 0.09], blend: 0.04, material: 'snout' },
  { bone: 'head', shape: 'ellipsoid', at: [0, 0.14, 0.31], radii: [0.04, 0.03, 0.025], material: 'nose' },
],
face: { kind: 'mouth', bone: 'head', on: ['snout'], at: [0, 0.07, 0.3], width: 0.045, color: '#4a2418', tongue: '#ff7d8a' },
```

With a snout, the mouth goes on the snout (`on: ['snout']`), and the eyes
move up a little (y 0.24). Pig: a pink snout with two nostrils carved by
subtraction, listed right after it:
`{ bone: 'head', shape: 'sphere', at: [-0.03, 0.1, 0.31], radius: 0.014, op: 'sub', material: 'snout' }` and its mirror.

### Small beak (bird, duck, penguin)

```ts
materials: {
  beak: { color: '#ff7a1a', f0: 0.05, spec: 1, shininess: 80, rim: 0.4, gloss: 0.6 },
},
parts: [
  { bone: 'head', shape: 'roundCone', from: [0, 0.12, 0.24], to: [0, 0.09, 0.37], r1: 0.065, r2: 0.015, material: 'beak' },
],
/* the mouth moves under the beak */
face: { kind: 'mouth', bone: 'head', on: ['skin'], at: [0, 0.03, 0.22], width: 0.04, color: '#5a2a1a', tongue: '#ff7d8a' },
```

A beak replaces the mouth: leave out `face`, or keep a tiny mouth below the
beak. For a beak that opens when speaking, see `pip` (two halves on `beak`
and `jaw` bones driven by `talk`).

### Freckles, whiskers and a belly

```ts
paints: [
  /* freckles: tiny sphere paints on the surface under the eyes */
  { bone: 'head', on: ['skin'], kind: 'sphere', at: [-0.17, 0.12, 0.23], radius: 0.012, color: '#c46a3a', soft: 0.2 },
  { bone: 'head', on: ['skin'], kind: 'sphere', at: [-0.2, 0.14, 0.21], radius: 0.012, color: '#c46a3a', soft: 0.2 },
  { bone: 'head', on: ['skin'], kind: 'sphere', at: [0.17, 0.12, 0.23], radius: 0.012, color: '#c46a3a', soft: 0.2 },
  { bone: 'head', on: ['skin'], kind: 'sphere', at: [0.2, 0.14, 0.21], radius: 0.012, color: '#c46a3a', soft: 0.2 },
  /* a pale belly on the front of the body */
  { bone: 'body', on: ['skin'], kind: 'ellipse', at: [0, 0.16, 0.12], radii: [0.12, 0.1], color: '#fff2dc', soft: 0.3 },
],
parts: [
  /* whiskers: thin capsules sticking out of the cheeks */
  { bone: 'head', shape: 'capsule', from: [-0.2, 0.1, 0.2], to: [-0.36, 0.13, 0.2], radius: 0.006, material: 'whisker' },
  { bone: 'head', shape: 'capsule', from: [-0.2, 0.08, 0.2], to: [-0.36, 0.06, 0.2], radius: 0.006, material: 'whisker' },
  { bone: 'head', shape: 'capsule', from: [0.2, 0.1, 0.2], to: [0.36, 0.13, 0.2], radius: 0.006, material: 'whisker' },
  { bone: 'head', shape: 'capsule', from: [0.2, 0.08, 0.2], to: [0.36, 0.06, 0.2], radius: 0.006, material: 'whisker' },
],
materials: {
  whisker: { color: '#fff8ee', f0: 0.04, spec: 0.6, shininess: 60, rim: 0.5 },
},
```

---

## Patterns

### Stripes (bee, tiger, sweater)

Paint with huge, hard-edged spheres whose edges cross the body. Each sphere
paints everything inside it, so a sphere centred far below the body paints a
band at its top edge; later paints cover earlier ones.

```ts
paints: [
  /* bands across the body: each sphere colours everything below its top edge */
  { bone: 'body', on: ['skin'], kind: 'sphere', at: [0, -0.55, 0], radius: 0.8, color: '#2b2118', soft: 0.02 },
  { bone: 'body', on: ['skin'], kind: 'sphere', at: [0, -0.63, 0], radius: 0.8, color: '#ffc21a', soft: 0.02 },
  { bone: 'body', on: ['skin'], kind: 'sphere', at: [0, -0.71, 0], radius: 0.8, color: '#2b2118', soft: 0.02 },
],
```

Each band's top edge is at `at.y + radius` (0.25, 0.17 and 0.09 here, on a
body from y 0 to 0.38); each paint covers the lower part of the one before
it, leaving a band. Small `soft` keeps the edges crisp. For more bands, add
more spheres, each 0.08 lower.

### Spots (mushroom, ladybird, cow, dalmatian)

Sphere paints with `at` **on the surface** (use the formula at the top of
this file). Vary the radius (0.03 to 0.07) and spread them unevenly, with a
few on the back and sides so the character looks right when it turns.

```ts
paints: [
  { bone: 'head', on: ['skin'], kind: 'sphere', at: [0.143, 0.343, 0.2], radius: 0.05, color: '#ffffff', soft: 0.15 },
  { bone: 'head', on: ['skin'], kind: 'sphere', at: [-0.19, 0.38, 0.1], radius: 0.04, color: '#ffffff', soft: 0.15 },
],
```

Raised spots (bumps you can see from the side) are small `sphere` parts half
buried in the surface instead of paints; see `berry` and `cap`.

### Patches (panda eye patches, a dark muzzle)

Use parts with their own material rather than paints when the patch should
have a raised edge, and paints when it should be flat. Panda: see `bao`.

---

## Bodies that are objects

The face goes on the front of the object; the rest of the spec is the same.

### Cup or mug

```ts
materials: {
  cup: { color: '#f4efe6', f0: 0.06, spec: 1.6, shininess: 140, rim: 0.6, gloss: 0.85 },
  coffee: { color: '#6b3f22', f0: 0.04, spec: 1.2, shininess: 90, rim: 0.3, gloss: 0.7 },
},
bones: [
  { name: 'body', pivot: [0, 0, 0], drive: { ry: [['yaw', 0.4]], rz: [['roll', 0.4]], rx: [['pitch', -0.3]] } },
],
parts: [
  { bone: 'body', shape: 'cylinder', at: [0, 0.3, 0], radius: 0.28, half: 0.28, round: 0.06, material: 'cup' },
  /* the opening: a slightly smaller cylinder carved out of the top */
  { bone: 'body', shape: 'cylinder', at: [0, 0.6, 0], radius: 0.24, half: 0.06, round: 0.02, op: 'sub', blend: 0.01, material: 'cup' },
  /* the drink inside */
  { bone: 'body', shape: 'cylinder', at: [0, 0.53, 0], radius: 0.245, half: 0.012, round: 0.01, material: 'coffee' },
  /* the handle: a capsule loop on the side */
  { bone: 'body', shape: 'capsule', from: [0.27, 0.45, 0], to: [0.38, 0.4, 0], radius: 0.035, material: 'cup' },
  { bone: 'body', shape: 'capsule', from: [0.38, 0.4, 0], to: [0.38, 0.2, 0], radius: 0.035, material: 'cup' },
  { bone: 'body', shape: 'capsule', from: [0.38, 0.2, 0], to: [0.27, 0.16, 0], radius: 0.035, material: 'cup' },
],
```

On a one-bone character, every `bone` (eyes, face, paints, anchors) is
`'body'`. The full version with foam art and steam is `latte`.

### Toaster (a box with a slot and something popping out)

A complete object character: one `body` bone carries the box, the face and
the anchors; the toast has its own springy bone so it bobs.

```ts
materials: {
  shell: { color: '#e5483f', f0: 0.06, spec: 1.6, shininess: 160, rim: 0.5, gloss: 0.8 },
  toast: { color: '#d9913f', f0: 0.03, spec: 0.5, shininess: 30, rim: 0.5, sheen: 0.3 },
  crumb: { color: '#f3d9a4', f0: 0.03, spec: 0.3, shininess: 20, rim: 0.4 },
  chrome: { color: '#8f98ae', f0: 0.45, spec: 1, shininess: 120, metal: 0.85, rim: 0.3, gloss: 0.7 },
  foot: { color: '#26252b', f0: 0.04, spec: 0.6, shininess: 40, rim: 0.3 },
},
bones: [
  { name: 'body', pivot: [0, 0, 0], drive: { ry: [['yaw', 0.4]], rz: [['roll', 0.3]], rx: [['pitch', -0.25]] } },
  { name: 'toast', parent: 'body', pivot: [0, 0.5, 0], jiggle: { axis: [0, 1, 0], length: 0.14, freq: 3, damping: 0.15, maxAngle: 0.35 } },
],
parts: [
  { bone: 'body', shape: 'roundBox', at: [0, 0.29, 0], half: [0.3, 0.22, 0.2], round: 0.07, material: 'shell' },
  /* the slot: listed right after the box so it carves it */
  { bone: 'body', shape: 'roundBox', at: [0, 0.5, 0], half: [0.19, 0.05, 0.035], round: 0.02, op: 'sub', material: 'shell' },
  { bone: 'body', shape: 'capsule', from: [0.31, 0.38, 0], to: [0.36, 0.38, 0], radius: 0.025, material: 'chrome' },
  { bone: 'body', shape: 'ellipsoid', at: [-0.18, 0.04, 0], radii: [0.06, 0.04, 0.12], material: 'foot' },
  { bone: 'body', shape: 'ellipsoid', at: [0.18, 0.04, 0], radii: [0.06, 0.04, 0.12], material: 'foot' },
  /* the slice: a crust, with the soft crumb just in front of it */
  { bone: 'toast', shape: 'roundBox', at: [0, 0.08, 0], half: [0.16, 0.13, 0.022], round: 0.05, material: 'toast' },
  { bone: 'toast', shape: 'roundBox', at: [0, 0.08, 0.004], half: [0.135, 0.105, 0.022], round: 0.04, material: 'crumb' },
],
paints: [
  { bone: 'body', on: ['shell'], kind: 'sphere', at: [-0.19, 0.25, 0.2], radius: 0.045, color: '#ff9a9a', soft: 0.6, opacity: 0.8 },
  { bone: 'body', on: ['shell'], kind: 'sphere', at: [0.19, 0.25, 0.2], radius: 0.045, color: '#ff9a9a', soft: 0.6, opacity: 0.8 },
],
eyes: { kind: 'ball', bone: 'body', at: [[-0.1, 0.32, 0.165], [0.1, 0.32, 0.165]], radius: 0.05, iris: '#2b1d14', irisSize: 0.8, pupilSize: 0.5, lid: 'shell' },
face: { kind: 'mouth', bone: 'body', on: ['shell'], at: [0, 0.23, 0.2], width: 0.05, color: '#5a1a14', tongue: '#ff7d8a' },
anchors: {
  top: { bone: 'toast', at: [0.12, 0.24, 0] },
  mouth: { bone: 'body', at: [0, 0.23, 0.23] },
  ear: { bone: 'body', at: [-0.31, 0.32, 0] },
  feet: { bone: 'root', at: [0, 0.02, 0.15] },
},
acting: {
  celebrating: { toast: { rz: [0, 0.25, 4, 0] } },
  sleeping: { toast: { rx: 0.35 } },
  sad: { toast: { rx: 0.45, rz: 0.2 } },
  error: { toast: { rz: [0, 0.2, 11, 0] } },
},
```

### Flower pot

A `roundCone` wider at the top, cut flat at the top with a clip: see `cacti`.

### Box robot

A `roundBox` head with `round` about 0.06, a `plate` screen on the front and
an LED `screen` face instead of eyes and a mouth: see `volt`.

### Floating blob (cloud, ghost, slime)

Several spheres melted together with `blend: 0.1` to `0.15`, and
`motion: { float: 0.15 }`: see `drift` and `boo`.

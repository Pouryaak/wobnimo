---
name: wobnimo-mascot
description: Design a custom animated 3D mascot for the Wobnimo engine from a short description ("a sleepy cloud wearing headphones"), check it, preview it and wire it into the app. Use whenever someone asks for a new mascot, character, avatar or assistant buddy built with wobnimo.
---

# Designing a Wobnimo mascot

You are going to write one TypeScript file that describes a 3D character as
plain data (a `CharacterSpec`). The Wobnimo engine turns that data into a
living mascot: it breathes, blinks, looks around, hops, talks and acts out ten
states (idle, thinking, listening, speaking, working, error, surprised,
celebrating, sad, sleeping). You never write animation code. You describe the
body, and the shared rig makes it move.

You are done when **all** of these are true:

1. `npx wobnimo check <file>` reports **no errors and no warnings**. A clean
   result prints `✓ No problems found.`, or `0 errors, 0 warnings, N notes.`
   when there are only notes.
2. You looked at the picture from `npx wobnimo preview <file>` (if you can see
   images) and it matches your plan.
3. The mascot is wired into the app (section 9), if there is an app.

Follow the steps in order. Do not skip the check. The checker measures the
real 3D shape, so it catches mistakes you cannot see in the numbers, and
every message tells you the exact value to change.

---

## 1. The workflow

(`npx wobnimo skill` installs this same skill into both `.claude/skills/`
and `.agents/skills/`, for different agents. The copies are identical.)

```
plan  ->  npx wobnimo new <id>  ->  edit  ->  npx wobnimo check  ->  fix  ->  (repeat check)
      ->  npx wobnimo preview  ->  look  ->  fix  ->  wire into the app
```

1. **Plan** (section 2). Write the plan as a short list before any code.
   Pick the one or two closest examples (section 10) at the same time.
2. **Start from the template**: `npx wobnimo new <id>` writes
   `mascots/<id>.ts`, a small character that already passes every check.
   (`<id>` is lowercase letters, digits and dashes: `sprout`, `sleepy-cloud`.)
3. **Read one or two examples** that are closest to your idea
   (section 10 lists what each one shows). Copy their techniques.
4. **Edit the file** one feature at a time, in this order: body, head,
   limbs and big features, eyes, mouth, paints, small details, bones and
   acting, frame and bound.
5. **Check**: `npx wobnimo check mascots/<id>.ts`. Fix every error, then
   every warning, using the `fix:` line under each one. Run it again. Repeat
   until there are no errors and no warnings (notes are fine to leave if they
   are intended, such as a tail that only shows from behind). Check after
   each big feature rather than once at the end: fixes are easier one at a
   time.
6. **Preview**: `npx wobnimo preview mascots/<id>.ts` writes
   `.wobnimo/<id>.png` (and prints the check again): front, three-quarter,
   side and back in idle, a face close-up, the nine other states and a 56px
   avatar. Open the image (with your file-reading tool, if it shows images)
   and compare it with your plan (section 8). **The preview is not
   optional**: the check measures geometry, but only a picture shows whether
   it looks like the thing. Fix what is off, then check again.
   - People can watch it live with `npx wobnimo preview mascots/<id>.ts --live`.
7. **Wire it in** (section 9) and tell the person what you made.

If `npx wobnimo` is not available, install the package first:
`npm install wobnimo` (or use `npx wobnimo@latest ...`). For `.ts` spec
files the commands need **Node 22.6 or newer**; the CLI turns on Node's
TypeScript support by itself. On older Node, save the spec as `.mjs` (the
same code without the `import type` line and the `: CharacterSpec`
annotation).

The template from `npx wobnimo new` is a placeholder chick. Replace
**everything** that describes it: the shapes, colours, `tagline`, `accent`
and the comments, so nothing of the chick is left.

---

## 2. Plan before you write

Answer these in a few words each. Keep the answers; you will check the
preview against them at the end.

| Question | Example: "a sleepy cloud wearing headphones" |
| --- | --- |
| Silhouette in one sentence | a wide puffy cloud, flat-ish bottom, headphones over the top |
| Body plan: one blob, head on a body, or an object with a face | one blob (the cloud is the head and body) |
| The signature feature people must recognise | the headphones: band over the top, cups on both sides |
| 2 to 3 secondary features | small puffs on the sides, a soft blush |
| Palette, 3 to 5 colours | cloud `#9db8ff`, band `#20253a`, cups `#4f7cff` |
| Material feel of each colour (section 5) | cloud: soft and fluffy; cups: glossy plastic |
| Eyes: `ball` (big, expressive, with lids) or `bead` (small, glossy, simple) | ball, half closed when idle feels sleepy |
| Mouth | a small painted mouth |
| What moves on its own: springy parts (`jiggle`), arms (`flap`), a jaw (`talk`) | nothing springy; the whole cloud floats |
| Does it float? | yes: `motion.float` 0.15 |
| How 3 or 4 states should look on this body (section 6) | sleeping: head droops; listening: leans toward one cup; celebrating: bounces |

Design rules that make a mascot look cute and premium:

- **Big head, small body.** The head is as wide as or wider than the body.
- **Eyes low and wide apart** on the face, at or a little below the
  head's middle height. Big eyes read better at small sizes.
- **Small mouth**, just below the eyes (0.06 to 0.12 lower).
- **Round, soft shapes.** Use `blend` to melt parts together. Avoid sharp
  boxes unless the character is a robot or an object.
- **One strong signature feature**, big enough to read at 56px. A detail
  smaller than about 0.03 units disappears at avatar size.
- **3 to 5 colours.** One main colour covering most of the body, one or two
  accents, dark eyes. Blush cheeks (pink paints) add warmth to almost
  anything.
- **20 to 40 parts** is the sweet spot. More than 48 slows rendering.
- **Colours look lighter on screen** than the hex suggests: the studio
  lighting adds highlights and a rim. Pick colours a little richer and
  darker than you want them to look (golden toast is `#d9913f`, not
  `#f0d080`), and avoid near-white for anything that should read as a
  colour.

**Objects with a face** (a toaster, a cup, a pot, a phone): the object *is*
the head and body in one. Use a single `body` bone, put every part, the
eyes, the mouth and the anchors on it, and place the face on the front
surface at about 55 to 65% of the object's height. Keep the object chunky
and rounded (`round` 0.05 to 0.08 on boxes), add small feet or a base so it
stands, and give it one moving part on its own bone with `jiggle` (the
toast, the steam, a lid, a flower) so it feels alive. See `latte`,
`cacti` and the "Bodies that are objects" recipes.

---

## 3. Space, units and the most important rule

```
            +y (up)
             |
             |      the camera is out here, looking at the character's face
             |     /
             |   +z (toward the camera, the front of the character)
             |  /
  -x --------+-------- +x      +x is to YOUR right as you look at the character
            /
          (floor is y = 0; the character stands on it, centred on x = 0, z = 0)
```

- **1 unit is about the height of a small mascot.** Typical total height:
  0.7 to 1.0. The template is about 0.85 tall.
- The character **faces +z**. Eyes, mouth and anything on the face have a
  positive z.
- The **left eye in the list is at negative x** (the one on your left when you
  look at the picture). Always list it first.
- Angles are **radians**: 0.5 rad is about 29 degrees, 1.57 (π/2) is 90
  degrees, 3.14 (π) is 180 degrees.
- Make everything **mirror symmetric**: if something is at `[-0.12, y, z]`,
  its twin is at `[0.12, y, z]`.

### THE MOST IMPORTANT RULE: positions are relative to the bone

Every `at` (in parts, eyes, face, paints and anchors) is measured **from its
bone's pivot**, not from the floor. A bone's pivot is measured from its
parent bone's pivot. To find where something really is, add up the chain:

```
bones:  body  pivot [0, 0, 0]       (parent: root, at the floor)
        head  pivot [0, 0.3, 0]     (parent: body)
part:   { bone: 'head', shape: 'sphere', at: [0, 0.2, 0], radius: 0.27 }

world centre of the head sphere = body pivot + head pivot + part at
                                = [0,0,0] + [0,0.3,0] + [0,0.2,0] = [0, 0.5, 0]
top of the head = 0.5 + 0.27 = 0.77
```

Write the world height of each big part in a comment while you work. Most
broken first drafts come from mixing up bone space and world space: an eye
placed at the world height of the face, on a head bone whose pivot is
already 0.3 up, ends up 0.3 too high and floats in the air.

---

## 4. The spec, field by field

The full reference with every option is in
[reference/spec.md](reference/spec.md). This is what you need most of the
time. Start from the template; it has every section already.

```ts
import type { CharacterSpec } from 'wobnimo';

export const sprout: CharacterSpec = {
  id: 'sprout',                  // lowercase, unique
  name: 'Sprout',                // shown to people
  tagline: 'One line on what makes it special',
  accent: '#ff9f43',             // a UI colour that goes with it
  frame: { target: 0.42, radius: 0.62 },   // camera: look-at height, half the visible height
  bound: { y: 0.4, radius: 0.6 },          // a sphere that contains the whole body
  motion: { hop: 0.16, squash: 1.2 },      // temperament (section 6)
  materials: { ... },            // named looks: skin, fur, plastic (section 5)
  bones: [ ... ],                // the skeleton (section 6)
  parts: [ ... ],                // the shapes (below)
  paints: [ ... ],               // colour on the surface: cheeks, bellies, spots
  eyes: { ... },
  face: { ... },                 // the mouth (or an LED screen face)
  anchors: { ... },              // where effects come from
  acting: { ... },               // how each state moves the bones
  fx: { ... },                   // optional extra particle effects
};

export default sprout;           // keep this line: the CLI loads the default export
```

### Parts: the shapes

Parts are drawn **in list order**. Each one is attached to a bone, has a
material, and sits at `at` in that bone's space. Optional on every part:
`rot: [rx, ry, rz]` (radians, turns the part about its own centre), `blend`
(how softly it melts into the parts **before** it; 0 is a hard edge, 0.02 to
0.08 is a soft seam, 0.1 to 0.25 is one smooth blob), and `clip` (cuts the
part flat, see below).

| shape | fields | use it for |
| --- | --- | --- |
| `sphere` | `radius` | heads, cheeks, noses, buttons, pom-poms |
| `ellipsoid` | `radii: [x, y, z]` (half sizes) | bodies, heads, ears, feet, leaves, wings, bellies |
| `capsule` | `from: [x,y,z]`, `to: [x,y,z]`, `radius` | arms, legs, tails, antennae, handles, stems, straps |
| `roundCone` | `from`, `to`, `r1` (radius at from), `r2` (radius at to) | tapering things: horns, spikes, tails, tufts, beaks, limbs |
| `roundBox` | `half: [x, y, z]`, `round` | robots, phones, boxes, books, blocks; `round` ≤ the smallest half |
| `cylinder` | `radius`, `half` (half height along y), `round` | cups, pots, cans, coins, hats; stands upright along y; `rot: [1.5708, 0, 0]` lays it toward the camera |
| `plate` | `half: [x, y]`, `corner`, `depth` (half thickness in z) | flat panels facing the camera: screens, badges, cards |
| `frame` | `half: [x, y]`, `corner`, `width`, `depth` | a rounded rectangular ring facing the camera: bezels, picture frames |
| `hem` | `y`, `amplitude`, `waves`, `speed`, `blend` | cuts off everything before it below a wavy line: a ghost's skirt |

`from` and `to` are positions in the part's space (add `at` if you set it).

**Subtracting** (`op: 'sub'`) carves the part's shape out of the parts
**listed before it**: nostrils, mouths you can see into, grooves, the hole of
a cup. A subtraction cannot cut anything listed after it, so put it right
after the parts it should cut.

```ts
{ bone: 'head', shape: 'sphere', at: [0.05, 0.16, 0.32], radius: 0.015, op: 'sub', material: 'skin' }
```

**Clipping** keeps only the side of a plane: `clip: { normal: [0, -1, 0] }`
keeps the top half of the part (the normal points at the side that is cut
away). Use it for a flat-bottomed pot, a half-dome mushroom cap, a beak cut in
two. `offset` moves the cut along the normal.

### Eyes

```ts
// ball eyes: big, with lids that blink, squint, close and droop per state
eyes: { kind: 'ball', bone: 'head', at: [[-0.11, 0.2, 0.22], [0.11, 0.2, 0.22]],
        radius: 0.06, iris: '#2b1d14', irisSize: 0.85, pupilSize: 0.55, lid: 'skin' },

// bead eyes: small glossy ovals, simple and very cute
eyes: { kind: 'bead', bone: 'head', at: [[-0.1, 0.2, 0.25], [0.1, 0.2, 0.25]],
        radii: [0.035, 0.05, 0.022], material: 'bead' },
```

- Ball eyes sit **about 70% inside the head**: the centre is about
  `0.7 × radius` behind the face's surface. Bead eyes sit about 30% inside.
  You do not need to calculate it: put the eye roughly there and the checker
  tells you the exact z.
- Ball eye radius: 0.045 to 0.07. Bead radii: about `[0.03–0.045, 0.045–0.066, 0.02–0.03]`.
- `lid` is a material name, usually the head's skin or fur.
- A bead eye needs a dark glossy material:
  `bead: { color: '#1a1414', f0: 0.06, spec: 2.2, shininess: 400, rim: 0.2, gloss: 1 }`.

### The mouth

```ts
face: { kind: 'mouth', bone: 'head', on: ['skin'], at: [0, 0.09, 0.26],
        width: 0.05, color: '#5a2a1a', tongue: '#ff7d8a' },
```

The mouth is painted onto the surface, smiles, frowns and opens when
speaking. `at` must be **on the surface** of the face (z equal to the
surface, or up to 0.02 in front). `on` lists the materials it may be painted
on: the material of the face where the mouth is. Width 0.03 to 0.07.

Robots can use an LED screen face instead (see the `volt` example).

### Paints: colour on the surface

```ts
// soft round colour: cheeks, spots, a nose tip
{ bone: 'head', on: ['skin'], kind: 'sphere', at: [-0.2, 0.11, 0.22], radius: 0.05,
  color: '#ff8f8f', soft: 0.6, opacity: 0.8 },
// an oval seen from the front: bellies, face masks, ear insides
{ bone: 'body', on: ['fur'], kind: 'ellipse', at: [0, 0.2, 0.1], radii: [0.14, 0.16],
  color: '#fff2dc', soft: 0.3 },
```

- A **sphere** paint colours the surface within `radius` of `at`. Put `at`
  **on the surface** (a point on the skin), not inside the body.
- An **ellipse** paint colours the surface **in front of** `at.z` inside the
  `radii` oval as seen from the front. Put `at.z` a little behind the
  surface, between the body's centre and its front.
- `on` lists the materials that may be coloured. A paint never colours a
  material that is not in `on`.
- Cheeks: just below and outside the eyes, radius 0.04 to 0.06, pink,
  `soft: 0.6`, `opacity: 0.8`.

### Anchors: where effects come from

```ts
anchors: {
  top:   { bone: 'head', at: [0.14, 0.44, 0.05] },  // just above the head: thinking dots, zzz, sparkles
  mouth: { bone: 'head', at: [0, 0.09, 0.29] },     // just in front of the mouth: speech
  ear:   { bone: 'head', at: [-0.27, 0.2, 0] },     // side of the head: listening
  feet:  { bone: 'root', at: [0, 0.02, 0.15] },     // on the floor: landing puffs
},
```

Always give all four. `top` sits on or just above the head, a little to one
side; `mouth` a little in front of the mouth.

### Frame and bound

- `frame` is the camera. `target` is the height it looks at (about the middle
  of the character); `radius` is half the visible height. The character
  should fill about 70 to 80% of the picture.
- `bound` is a sphere (centre height `y`, `radius`) that must contain the
  whole body in every state, including raised arms and swinging tails. Parts
  outside it are cut off.
- **Do not calculate these by hand.** Put in a rough guess (`frame: { target:
  0.45, radius: 0.65 }`, `bound: { y: 0.45, radius: 0.65 }`), run the check,
  and copy the values it suggests.

---

## 5. Materials

Each material is a named look. Every part, paint `on`, eye `lid` and mouth
`on` refers to materials by name. Copy a preset from this table, then
change the colours to yours. Every preset is valid as written; the example
colours show the relation between the fields:

- `color`: your colour.
- `sssColor`: your colour mixed about halfway with white (`#4cb873` gives
  `#a8e0b8`).
- a scale or speckle `surface.color`: your colour mixed about 40% with black
  (`#78cf7f` gives `#4b9f5d`).

| feel | preset |
| --- | --- |
| soft vinyl toy (default for most mascots) | `{ color: '#ffb35c', f0: 0.04, spec: 0.8, shininess: 60, rim: 0.8, sss: 0.2, sssColor: '#ffd9a8' }` |
| glossy plastic | `{ color: '#e53935', f0: 0.06, spec: 1.6, shininess: 160, rim: 0.5, gloss: 0.8 }` |
| matte plush / felt | `{ color: '#eaa15c', f0: 0.015, spec: 0.06, shininess: 6, rim: 1.1, sheen: 0.95, gloss: 0, sss: 0.18, sssColor: '#ffcf9e' }` |
| fur | `{ color: '#f07a2a', f0: 0.03, spec: 0.4, shininess: 20, rim: 1, sheen: 0.7, surface: { kind: 'fur', scale: 100, strength: 0.3, bone: 'head' } }` |
| feathers | `{ color: '#f4a63c', f0: 0.03, spec: 0.22, shininess: 14, rim: 0.9, sheen: 0.55 }` |
| jelly / gummy | `{ color: '#3fcf9f', f0: 0.06, spec: 1.6, shininess: 140, rim: 0.7, sss: 0.55, sssColor: '#9effd9', gloss: 0.9 }` |
| wet skin (frog) | `{ color: '#5fc24e', f0: 0.07, spec: 2, shininess: 260, rim: 0.7, gloss: 0.95, sss: 0.3, sssColor: '#c6ff8f' }` |
| scaly hide (dragon, lizard) | `{ color: '#78cf7f', f0: 0.04, spec: 0.7, shininess: 40, rim: 0.7, gloss: 0.35, surface: { kind: 'scales', scale: 24, strength: 0.5, color: '#4b9f5d', bone: 'head' } }` |
| ceramic / porcelain | `{ color: '#f4efe6', f0: 0.06, spec: 1.6, shininess: 140, rim: 0.6, gloss: 0.85 }` |
| terracotta / matte clay | `{ color: '#d9774a', f0: 0.03, spec: 0.4, shininess: 25, rim: 0.4 }` |
| leaf / petal | `{ color: '#3fa34d', f0: 0.04, spec: 0.7, shininess: 50, rim: 0.6, sss: 0.25, sssColor: '#b8f0a0' }` |
| bread / pastry / dough | `{ color: '#d9944f', f0: 0.03, spec: 0.5, shininess: 30, rim: 0.5, sheen: 0.3 }` |
| painted metal | `{ color: '#c3cce3', f0: 0.07, spec: 0.8, shininess: 90, metal: 0.25, rim: 0.4, gloss: 0.5 }` |
| bare metal / chrome | `{ color: '#8f98ae', f0: 0.45, spec: 1, shininess: 120, metal: 0.85, rim: 0.3, gloss: 0.7 }` |
| glass lens / glossy black nose | `{ color: '#1d1410', f0: 0.06, spec: 1.8, shininess: 200, rim: 0.3, gloss: 0.9 }` |
| bead eyes | `{ color: '#1a1414', f0: 0.06, spec: 2.2, shininess: 400, rim: 0.2, gloss: 1 }` |
| ghost / cloud / steam (soft glow) | `{ color: '#eceaff', f0: 0.03, spec: 0.35, shininess: 20, rim: 1.2, sss: 0.55, sssColor: '#ffffff', emit: '#6f52d9', emitStrength: 0.06 }` |
| lamp that changes colour with the state | `{ color: '#ffffff', f0: 0.05, spec: 1, shininess: 120, rim: 0, glows: true, emitStrength: 1.2 }` |
| mouth interior / dark cavity | `{ color: '#3b1510', f0: 0.04, spec: 0.5, shininess: 30, rim: 0 }` |

Rules:

- **Fur, scales, speckle and ripple surfaces are fixed to one bone**
  (`surface.bone`, default the root). If the same fur covers parts on two
  bones that move separately (a head and a body), make **two materials**: one
  with `surface.bone: 'head'` for the head parts, one for the body parts, and
  mark the second `shadeOf: 'fur'` so recolouring one recolours both. See
  `hop`, `ember`, `bao`.
- `shadeOf: 'other'` links a material to another one for recolouring (a wing
  a little darker than the body). It does not copy any settings; give it its
  full preset.
- Pick colours with enough contrast: eyes dark against the face, the
  signature feature clearly different from the body.

---

## 6. Bones, motion and acting

### Bones

```ts
bones: [
  { name: 'body', pivot: [0, 0, 0], drive: { ry: [['yaw', 0.3]], rz: [['roll', 0.4]] } },
  { name: 'head', parent: 'body', pivot: [0, 0.3, 0],
    drive: { rx: [['pitch', -0.6]], ry: [['yaw', 0.6]], rz: [['roll', 0.5]] } },
  { name: 'tuft', parent: 'head', pivot: [0, 0.45, 0],
    jiggle: { axis: [0, 1, 0], length: 0.12, freq: 2.4, damping: 0.12 } },
  { name: 'armL', parent: 'body', pivot: [-0.22, 0.3, 0.05], rest: { rz: -0.4 }, drive: { rz: [['flap', -1]] } },
  { name: 'armR', parent: 'body', pivot: [0.22, 0.3, 0.05], rest: { rz: 0.4 }, drive: { rz: [['flap', 1]] } },
],
```

- A bone **pivots** (rotates) around its `pivot`, which is in its parent's
  space. Parents must come **before** their children in the list. The
  implicit `root` bone sits on the floor and is moved by the engine (hops,
  squash, floating). `parent` defaults to `root`.
- Put the pivot where the joint is: a head pivots at the neck, an arm at the
  shoulder, an ear at its base, a tail where it meets the body.
- Build limbs **pointing out from the pivot**: an arm whose pivot is at the
  shoulder has its parts going down and out from `[0, 0, 0]` in bone space.
- `rest`: a fixed starting rotation (a droopy ear, an arm held out).
- `drive`: the engine's live channels mapped onto rotations, as
  `[channel, amount]` pairs:
  - `yaw`, `pitch`, `roll`: where the character looks. Give the head
    `rx: pitch -0.6 to -1, ry: yaw 0.6 to 0.8, rz: roll 0.5 to 0.7` and the
    body smaller amounts, as in the template.
  - `flap`: raised arms or wings. 0 at rest, 1 when celebrating. Mirror the
    sign between left and right (`-1` on the left, `1` on the right, with
    `rz`).
  - `talk`: 0 to 1 per syllable while speaking. Drive a jaw or beak with it
    (`rx: [['talk', 0.8]]`).
- `wave`: a gentle idle sway, `{ rz: [amplitude, hz, phase] }`, like
  `[0.05, 0.8, 0]`.
- `jiggle`: springy follow-through for ears, antennae, tails, leaves, hair.
  `axis` is the direction the bone points at rest (`[0, 1, 0]` up,
  `[0, 0, -1]` backward for a tail), `length` its length, `freq` 2 to 4 Hz,
  `damping` 0.1 (wobbly) to 0.3 (firm), optional `maxAngle`.

Which way a rotation turns, looking at the character from the front. The
angle swings everything on the bone around its pivot:

- `rz > 0` swings counter-clockwise: a point **above** the pivot moves to
  your left (−x), a point **below** it moves to your right (+x), a point to
  the **left** of it moves down.
- `rx > 0` tips the top **toward the camera** (forward, a nod down); `rx < 0`
  tips it back.
- `ry > 0` turns the front toward **your right** (+x).

So, for mirrored pairs (left is the one at negative x):

| the part points... from its pivot | left one: `rz > 0` | left one: `rz < 0` | right one |
| --- | --- | --- | --- |
| up (ear, horn, antenna) | leans out | leans in | opposite sign |
| down (arm, leg) | swings in, against the body | swings out and up (a wave) | opposite sign |
| sideways, outward (wing) | droops down | lifts up | opposite sign |

`rest`, `drive`, `wave` and `acting` all add up: an acting angle is added on
top of the bone's `rest` angle, so to droop an arm that rests at `rz: -0.35`,
add a positive angle for the left arm. Check the result in the preview: if a
pose goes the wrong way, flip the sign.

### Motion (temperament)

`motion: { float, hop, squash, snap, look, snapLook, talkSquash }`, all
optional:

- `float`: hover height. 0 stands on the floor; 0.1 to 0.25 floats (ghosts,
  clouds, bees, balloons). A floating character's parts are built from the
  floor up as usual; the engine lifts the whole thing.
- `hop`: hop height, 0.1 (heavy) to 0.25 (bouncy).
- `squash`: squash and stretch, 0.8 (stiff, robots, cups) to 1.9 (jelly).
- `snap`: spring speed, 0.8 (slow, dreamy) to 1.2 (quick).
- `talkSquash`: how much the body bounces while speaking, 0.3 to 1.3.

### Acting: how each state moves this body

The engine already handles the face (lids, smile, frown, wide eyes), the
glow colour, hops, breathing and effects for every state. `acting` adds
**bone motion** on top, so the state reads on this particular body:

```ts
acting: {
  thinking:    { head: { rz: 0.12 }, tuft: { rz: [0, 0.15, 1.2, 0] } },
  listening:   { earL: { rz: 0, rx: -0.2 }, earR: { rz: 0, rx: -0.2 } },  // ears perk up
  sleeping:    { earL: { rz: 1.2, rx: 0.5 }, earR: { rz: -1.4, rx: 0.5 } },
  error:       { tuft: { rz: [0, 0.3, 10, 0] } },                         // fast shiver
  celebrating: { tail: { ry: [0, 0.6, 3, 0] } },                          // tail wag
  sad:         { earL: { rz: 1.4, rx: 0.6 }, earR: { rz: -1.4, rx: 0.6 } },// ears droop
},
```

Each value is either a **held angle** (radians, added to the bone's rotation)
or `[base, amplitude, hz, phase, spin]`: a sway of `amplitude` at `hz` around
`base`, and optionally `spin` radians per second of continuous rotation (a
propeller: `[0, 0, 0, 0, 12]`). States: `idle`, `thinking`, `listening`,
`speaking`, `working`, `error`, `surprised`, `celebrating`, `sad`,
`sleeping`, and `happy`. `happy` is not a state an app sets: it plays when
someone clicks or taps the mascot (or the app calls `mascot.poke()`).

Good acting, in short: **perk up** for listening and surprised, **droop** for
sad and sleeping, **tilt** for thinking, **shiver** fast (8 to 12 Hz, small
amplitude) for error, **bounce or wag** for celebrating and happy. Keep held
angles under about 1.5 rad.

### Effects

Every character already gets the shared effects (thinking dots, zzz, sparkles,
notes, a landing puff) from its anchors. Add your own only for the signature
touch: hearts from a bunny, steam from a cup, drops from a jelly:

```ts
fx: {
  happy: [{ glyph: 'heart', anchor: 'top', rate: 1.2, velocity: [0, 0.22, 0.04],
            jitter: 0.1, life: [1, 1.3], size: [0.04, 0.06], color: '#ff8fb1' }],
},
```

Glyphs: `z bubble sparkle heart note arc puff ring drop spark mote feather dot
exclaim warning confetti cloud star gear`. Details in
[reference/spec.md](reference/spec.md).

---

## 7. Reading the check output

```
Sprout (sprout): 6 parts, 4 bones, 3 materials, 2.5 KB of spec
✖ error   eyes.at[0]: This eye is buried 0.028 inside the head, so it cannot be seen.
            fix: Move it forward to at [-0.1, 0.15, 0.262] (the face's surface is at z 0.301 there).
▲ warning frame: The body fills less than half the picture, so it will look small and far away.
            fix: frame: { target: 0.45, radius: 0.58 }
· note    bones: Bone "tail" moves nothing: no part, paint, eye, face, anchor or child bone uses it.
1 error, 1 warning, 1 note.
```

What the check measures: parts that are hidden, slivers, or floating free of
the body; subtractions that cut nothing; eyes (buried, floating, covered,
mirrored); the mouth; every paint; the frame and the bound in every state;
standing on the floor; anchors; unused materials and bones. What it cannot
judge: whether it looks like the thing, its proportions and colours, and
whether a pose reads. That is what the preview is for.

When the check says nothing about `frame` or `bound`, your values are fine:
keep them.

- The text after the level is **where** in the spec (`eyes.at[0]`,
  `parts[12]`, `paints[3]`, `frame`).
- **`fix:` lines are exact.** Copy the numbers into the file. Do not round
  them and do not "improve" them.
- Fix **errors first**, then warnings, then run the check again: one fix can
  change other measurements (moving the head moves where the eyes must be).
- `parts[i]` counts from 0 in the `parts` list.
- Common messages and what they mean:
  - *completely hidden* / *only a sliver shows*: the part is inside another
    part. Move it outward, make it bigger, or delete it.
  - *floats free of the body*: the part (or a group of parts on one bone)
    does not touch the rest. Move it by the amount given, or move its
    bone's pivot.
  - *This subtraction cuts nothing*: it is listed before the part it should
    cut, or it is not touching it. Move it after that part in the list.
  - *buried* / *floats in front of the face* (eyes): use the z from `fix:`.
  - *paint never touches the surface*: its `at` is inside the body or in the
    air. Use the point from `fix:`.
  - *lands on "x", not its on*: add that material to `on`, or move the paint.
    A paint never colours materials missing from `on`, so if "x" is a part
    that is meant to sit on top of the paint (a pit in the middle of a
    belly patch), leaving it out of `on` is right: make the paint bigger
    than that part so the colour shows around it.
  - *The mouth is drawn only on surface less than 0.02 behind face.at*: set
    the mouth's z to the face's surface (from `fix:`).
  - *cut off* (frame) / *outside the bound*: copy the suggested `frame` or
    `bound`.
  - *hovers* / *dips below the floor*: move all parts up or down by the
    amount given (easiest: change the y of the body bone's pivot), or set
    `motion.float` if it should hover.
- Notes are information. "Not visible from the front" is fine for tails and
  backs. "Material not used" or "bone moves nothing" usually means a typo.

---

## 8. Looking at the preview

Open `.wobnimo/<id>.png` and go through this list. Fix anything that fails,
then check again.

- [ ] From the front, it is obviously the thing that was asked for. Cover
      the name: would someone guess it?
- [ ] The signature feature is clear in the front view **and** in the 56px
      avatar.
- [ ] Nothing floats loose or is cut off; nothing pokes through where it
      should not (side and back views).
- [ ] The face: two eyes looking forward, a mouth below them, cheeks under
      the eyes. In the close-up the eyes look like eyes, not dents or
      stickers.
- [ ] Colours: the palette from the plan, enough contrast, eyes readable.
- [ ] States: sleeping looks asleep, sad looks sad, celebrating looks happy,
      thinking tilts or looks up. Your `acting` shows (ears, tails, arms)
      and goes the way you meant (section 6 has the signs).
- [ ] Separate pieces (wings, ears, hats, accessories) sit **on** the body
      in the side and back views, not beside it.
- [ ] It stands on the floor (or clearly floats, if it should).

If you cannot open images, rely on the check and re-read your plan against
the spec: every planned feature must have parts, and every part must have a
reason.

---

## 9. Wiring it into the app

Install: `npm install wobnimo`.

Web component (any framework, or plain HTML):

```ts
import 'wobnimo/element';
import sprout from './mascots/sprout';

const el = document.querySelector('wobnimo-mascot')!;   // <wobnimo-mascot style="width:160px;height:160px">
el.spec = sprout;
el.state = 'thinking';   // idle | thinking | listening | speaking | working | error | surprised | celebrating | sad | sleeping
```

React (Next.js: put it in a `"use client"` file):

```tsx
import { Mascot } from 'wobnimo/react';
import sprout from './mascots/sprout';

<Mascot character={sprout} state="thinking" style={{ width: 160, height: 160 }} />
<Mascot character={sprout} status={status} />   // drives the state from an AI SDK useChat status
```

Plain API:

```ts
import { mount } from 'wobnimo';
import sprout from './mascots/sprout';

const mascot = mount(document.getElementById('buddy')!, sprout, { state: 'idle' });
mascot.setState('celebrating');
```

Put the mascot file wherever the app keeps components (`mascots/` from
`npx wobnimo new` is fine). Map the app's real events to states: waiting for
a reply is `thinking`, streaming a reply is `speaking`, a failed request is
`error`, a finished task is `celebrating`, no activity for a while is
`sleeping`.

---

## 10. Examples to copy from

All 20 built-in characters are in [examples/](examples/). They pass every
check. The first ten in this table were each made from the single sentence
shown, the same way you are working now. Read the closest one before you
start: a dragon or lizard is closest to `rex`, a bird to `pip` or `pebble`,
a furry animal to `ember`, `bao` or `hop`, an object to `latte` or `cacti`,
a robot or gadget to `volt` or `microduck`, a floating thing to `drift` or
`boo`.

| example | made from | read it for |
| --- | --- | --- |
| `drift` | "A sleepy cloud in brand blue, wearing headphones" | a floating blob made of overlapping spheres; an accessory (headband, ear cups) |
| `cacti` | "A tiny potted cactus with a pink flower on its head" | an object with a face; a clipped flat pot; arms; a flower from petals |
| `latte` | "A coffee cup with a foam-art heart and steam for hair" | a cylinder object; a liquid surface; a heart painted with two paints; a handle |
| `bumble` | "A round bumblebee with tiny wings" | stripes as paints; wings that buzz (`wave`); antennae with jiggle; a floater |
| `swirl` | "A snail whose shell looks like a cinnamon roll" | grooves carved with subtraction (sub then add, in order); eye stalks |
| `ember` | "A fox cub with a big fluffy tail" | fur on two bones; a big jiggling tail; pointed ears; dark paws and a muzzle |
| `cap` | "A red mushroom with white spots" | a clipped dome; spots as paints that follow a curved surface |
| `berry` | "A strawberry with a leafy hat" | many small seed parts placed on a surface; a leaf crown |
| `bao` | "A chubby panda" | colour patches as parts (eye patches, ears, arms); a round body |
| `hop` | "A white bunny with long floppy ears" | long floppy ears with jiggle and ear paints; acting with ears |
| `volt` | (hand-built) a robot | a screen face (LED matrix); glowing bulbs; boxes, plates and frames; metal |
| `pip` | (hand-built) a chick | a beak with a talking jaw; wings driven by `flap` |
| `mochi` | (hand-built) a jelly drop | one squashy blob; a spinning sprout; a custom landing splash |
| `boo` | (hand-built) a ghost | `float`; the `hem` shape; a soft inner glow |
| `inky` | (hand-built) an octopus | many waving tentacles built in a loop |
| `miso` | (hand-built) a plush cat | matte plush material; whiskers; paws that wave |
| `tad` | (hand-built) a frog | wet speckled skin; eyes on top of the head |
| `pebble` | (hand-built) a penguin | a beak and jaw; flippers; a knitted scarf (scales surface as knit) |
| `rex` | (hand-built) a dinosaur | scales; spikes down the back; nostrils by subtraction; a tail |
| `microduck` | (hand-built) a robot duck | many small mechanical parts; lens eyes; a status light that glows |

[reference/recipes.md](reference/recipes.md) has ready-made recipes for
common features: ears, arms, legs, wings, tails, horns, hats, headphones,
glasses, noses, bellies, stripes, spots and objects, including a box with a
slot and something popping out of it.

---

## 11. Mistakes that break mascots (check yours)

1. **World positions on a bone.** Every `at` is relative to its bone's
   pivot (section 3).
2. **Eyes listed right first** or not mirrored. Left eye (negative x) first,
   same y and z.
3. **Eyes on the back** (negative z) or deep inside the head. Use the
   check's z.
4. **A part completely inside another part.** It cannot be seen. Make it
   stick out.
5. **A subtraction listed before what it should cut.** It cuts nothing.
6. **A paint whose `on` does not include the material it sits on.**
7. **A mouth floating in front of the face or buried in it.**
8. **Fur, scale or speckle materials shared between bones that move
   separately.** Make one material per bone with `shadeOf`.
9. **Child bones listed before their parent.**
10. **Huge rotations in acting** (over about 1.5 rad) that swing parts out
    of the bound.
11. **A floating character with `float: 0`**, or a standing one hovering.
12. **Forgetting `export default`** at the end of the file.
13. **Guessing `frame` and `bound`.** Copy them from the check.
14. **Tiny details** (under 0.03) that vanish at avatar size, or more than
    48 parts.
15. **Parts beside the body instead of on it** (wings, ears). Look at the
    side and back views.
16. **Leaving the template's tagline, colours or comments in place.**
17. **Stopping before the check is clean, or skipping the preview.**

---

## 12. Final checklist

- [ ] `npx wobnimo check <file>` shows no errors and no warnings.
- [ ] The preview matches the plan (section 8), or you checked the plan
      against the spec line by line.
- [ ] `id`, `name`, `tagline` and `accent` are filled in and make sense.
- [ ] All four anchors exist.
- [ ] At least four states have `acting` that suits the body.
- [ ] The file ends with `export default <name>;`.
- [ ] It is wired into the app (section 9), with the app's events mapped to
      states.
- [ ] You told the person: what you made, where the file is, how to preview
      it (`npx wobnimo preview <file> --live`), and how to change colours
      (the `palette` option: `palette={{ skin: '#ff8fb1' }}` recolours a
      material by name).

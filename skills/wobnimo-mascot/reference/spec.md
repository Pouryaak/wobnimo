# CharacterSpec reference

Every field, with its type, default and useful range. The TypeScript types
ship with the package (`import type { CharacterSpec } from 'wobnimo'`), so
an editor will also tell you when a field is wrong. Units: the floor is
y = 0, +y up, +x to the viewer's right, +z toward the camera; about 1 unit
tall; angles in radians. `Vec3` is `[x, y, z]`; colours are `'#rrggbb'`.

## Top level

| field | type | required | notes |
| --- | --- | --- | --- |
| `id` | string | yes | lowercase letters, digits, dashes; unique |
| `name` | string | yes | display name |
| `tagline` | string | yes | one line describing the character |
| `accent` | colour | yes | a UI colour that goes with the character |
| `frame` | `{ target, radius }` | yes | camera look-at height and half the visible height; copy from the check |
| `bound` | `{ y, radius }` | yes | sphere (centre height, radius) above the root containing the body in every state; copy from the check |
| `motion` | object | no | temperament, below |
| `materials` | `Record<name, Material>` | yes | at least one |
| `bones` | `Bone[]` | yes | parents before children |
| `parts` | `Part[]` | yes | drawn in order; the first must not be a subtraction |
| `paints` | `Paint[]` | no | colour on the surface |
| `eyes` | `Eyes` | no | almost always wanted |
| `face` | `Face` | no | a mouth, or an LED screen face |
| `anchors` | `Record<name, { bone, at }>` | no | give `top`, `mouth`, `ear`, `feet` |
| `acting` | `Record<state, Record<bone, Record<axis, Motion>>>` | no | per-state bone motion |
| `fx` | object | no | extra particle effects |
| `glowPool` | number | no | 0 to 0.6: the state's light pools on the floor (for glowing characters) |

## motion

| field | default | range | meaning |
| --- | --- | --- | --- |
| `float` | 0 | 0 to 0.3 | hover height; above 0 the character floats and bobs |
| `hop` | 0.16 | 0.08 to 0.25 | hop height |
| `squash` | 1 | 0.6 to 2 | squash and stretch amount |
| `snap` | 1 | 0.7 to 1.3 | spring speed (higher is snappier) |
| `look` | 1 | 0.5 to 1.2 | how far the head turns toward things |
| `snapLook` | 0 | 0 to 1 | 0 eases like a person, 1 snaps and holds like a bird |
| `talkSquash` | 0 | 0 to 1.3 | body bounce per syllable while speaking |

## materials

| field | default | range | meaning |
| --- | --- | --- | --- |
| `color` | | colour | base colour (required) |
| `shadeOf` | | material name | recolours along with that material |
| `f0` | 0.04 | 0 to 1 | clear-coat reflectance; 0.02 matte, 0.06 glossy, 0.45 metal |
| `spec` | 0.5 | 0 to 2.6 | highlight strength |
| `shininess` | 40 | 6 to 420 | highlight tightness (higher is a smaller, sharper highlight) |
| `metal` | 0 | 0 to 1 | how much reflections take the colour |
| `rim` | 0.5 | 0 to 1.4 | back light around the silhouette |
| `gloss` | 0.3 | 0 to 1 | reflection sharpness: 0 satin, 1 wet glass |
| `sheen` | 0 | 0 to 1 | velvet glow at grazing angles (fur, felt, feathers) |
| `sss` | 0 | 0 to 0.7 | light through the surface (jelly, wax, ears, leaves) |
| `sssColor` | | colour | colour of that light, a lighter tint of `color` |
| `emit` | | colour | light it gives off; use with `emitStrength` 0.05 to 0.1 for a soft glow |
| `emitStrength` | 1 | 0 to 2 | multiplies `emit` or `glows` |
| `glows` | false | | takes its light from the current state's colour (lamps, LEDs, bulbs) |
| `surface` | | object | fine detail, below |

`surface: { kind, scale, strength?, color?, bone? }`:

| kind | scale | strength | notes |
| --- | --- | --- | --- |
| `fur` | 70 to 130 | 0.25 to 0.5 | fine fibres; lower scale is longer, clumpier fur |
| `scales` | 20 to 45 | 0.5 to 0.75 | pebbled hide with `color` seams; also reads as knit wool |
| `speckle` | 9 to 30 | 0.4 to 0.85 | scattered `color` spots |
| `ripple` | 18 to 70 | 0.1 to 0.25 | gentle unevenness; makes gloss look wet or moulded |

`bone` fixes the pattern to that bone (default the root). One material per
moving bone: see SKILL.md section 5.

## bones

| field | type | notes |
| --- | --- | --- |
| `name` | string | unique; `root` is reserved (the implicit bone on the floor) |
| `parent` | bone name | default `root`; must be listed earlier |
| `pivot` | Vec3 | the joint, in the parent's space |
| `rest` | `{ rx?, ry?, rz? }` | fixed rotation at rest |
| `drive` | `{ rx?, ry?, rz?: [channel, amount][] }` | channels: `yaw`, `pitch`, `roll` (where it looks), `flap` (0 to 1, arms up), `talk` (0 to 1 per syllable) |
| `wave` | `{ rx?, ry?, rz?: [amplitude, hz, phase] }` | idle sway, scaled by the state's energy |
| `jiggle` | `{ axis, length, freq, damping, maxAngle? }` | spring follow-through; `axis` is the bone's direction at rest |

Rotation directions, seen from the front: `rz > 0` tips the top toward the
viewer's left (−x); `rx > 0` tips the top toward the camera; `ry > 0` turns
the front toward the viewer's right (+x). Rotations apply X, then Y, then Z.

## parts

Common fields:

| field | type | notes |
| --- | --- | --- |
| `bone` | bone name | the part moves with it; `at` is in its space |
| `material` | material name | |
| `shape` | see below | |
| `at` | Vec3 | centre (default `[0, 0, 0]`) |
| `rot` | Vec3 | rotation about the part's centre, radians |
| `op` | `'add'` or `'sub'` | default `add`; `sub` carves from parts listed before |
| `blend` | number | 0 hard, 0.02 to 0.08 seam, 0.1 to 0.25 smooth blob |
| `clip` | `{ normal: Vec3, offset? }` | keeps the side the normal points away from, in the part's space |

Shapes:

| shape | fields |
| --- | --- |
| `sphere` | `radius` |
| `ellipsoid` | `radii: [x, y, z]` |
| `roundBox` | `half: [x, y, z]`, `round` (≤ smallest half) |
| `capsule` | `from: Vec3`, `to: Vec3`, `radius` |
| `roundCone` | `from`, `to`, `r1` (at from), `r2` (at to) |
| `cylinder` | `radius`, `half` (half height, along y), `round` |
| `plate` | `half: [x, y]`, `corner`, `depth` (half thickness along z) |
| `frame` | `half: [x, y]`, `corner`, `width` (half the ring's thickness), `depth` |
| `hem` | `y`, `amplitude`, `waves`, `speed`, `blend`: cuts everything before it below a wavy line at height `y` |

## paints

| field | type | notes |
| --- | --- | --- |
| `bone` | bone name | `at` is in its space |
| `on` | material names | only these materials are coloured |
| `kind` | `'sphere'` or `'ellipse'` | |
| `at` | Vec3 | sphere: a point on the surface. ellipse: centre, with z a little behind the surface |
| `radius` | number | sphere only |
| `radii` | `[x, y]` | ellipse only, as seen from the front |
| `color` | colour | |
| `soft` | 0.15 | edge softness as a share of the size; 0.02 crisp, 0.6 a soft blush |
| `opacity` | 1 | |

Later paints cover earlier ones.

## eyes

Ball:

| field | notes |
| --- | --- |
| `kind: 'ball'` | |
| `bone` | usually `head` |
| `at: [left, right]` | left (negative x) first; mirror images; centre about 0.7 × radius behind the surface |
| `radius` | 0.045 to 0.07 |
| `iris` | colour; dark brown or black reads best |
| `irisSize` | 0.75 to 0.9 (sine of the iris's half angle) |
| `pupilSize` | 0.45 to 0.6 |
| `pupilAspect` | optional; above 1 for a goat's or octopus's wide pupil |
| `lid` | material name for the eyelids, usually the face's material |

Bead:

| field | notes |
| --- | --- |
| `kind: 'bead'` | |
| `bone` | |
| `at: [left, right]` | centre about 0.3 × radii[2] behind the surface |
| `radii` | `[x, y, z]`, about `[0.04, 0.06, 0.025]` |
| `material` | a dark glossy material |

## face

Mouth:

| field | notes |
| --- | --- |
| `kind: 'mouth'` | |
| `bone` | usually `head` |
| `on` | materials it may be drawn on |
| `at` | on the surface: z equal to the surface's z, at most 0.02 in front |
| `width` | 0.03 to 0.07 |
| `color` | dark: the lips and the inside |
| `tongue` | pink or red |

Screen (an LED matrix face for robots; the eyes and mouth are drawn on it,
so leave out `eyes`):

| field | notes |
| --- | --- |
| `kind: 'screen'` | |
| `bone`, `material` | the bone and material of the screen part (usually a `plate`) |
| `center: [x, y]` | middle of the screen in the bone's space |
| `half: [x, y]`, `corner` | its size, matching the plate |
| `cell` | LED pitch, about 0.025 to 0.04 |
| `color` | LED colour |

See `volt`.

## anchors

`{ bone, at }`. The engine's effects use `top` (thinking, working,
celebrating, error, surprised, sad, sleeping, happy), `mouth` (speaking),
`ear` (listening) and `feet` (landing after a hop). Effects whose anchor is
missing are skipped. You can add your own names for your own effects.

## acting

```ts
acting: {
  <state>: { <bone name>: { rx?: Motion, ry?: Motion, rz?: Motion } },
}
```

`Motion` is a number (a held angle, added to the bone's rotation) or
`[base, amplitude?, hz?, phase?, spin?]`: `base + amplitude · sin(2π · hz · t + phase)`
plus `spin` radians per second, accumulating. States: `idle`, `thinking`,
`listening`, `speaking`, `working`, `error`, `surprised`, `celebrating`,
`sad`, `sleeping`, `happy`. The engine blends between states smoothly.

What the engine already does in every state, so you do not need to:

| state | face | body | effects (anchor) |
| --- | --- | --- | --- |
| idle | relaxed, slight smile, blinks | breathes, glances around | |
| thinking | lids half down, small frown, head tilt | slower | dots (top) |
| listening | eyes open, slight smile | leans in | sound arcs (ear) |
| speaking | smile, mouth talks | bounces per syllable, `talk` channel | sound arcs (mouth) |
| working | eyes narrowed | busy, arms a little up | gears (top) |
| error | wince, one eye shut, crooked mouth | shakes | warning sign, smoke (top) |
| surprised | eyes wide, round mouth | jumps, arms up | exclamation mark (top) |
| celebrating | eyes squeezed happy, big smile | hops and spins, arms up | confetti, stars (top) |
| sad | heavy sloping lids, frown | slumps | rain cloud (top) |
| sleeping | eyes closed, lights dim | slow breathing | z's (top) |
| happy (on click) | squeezed smile | bounce | sparkles, hearts (top) |

## fx

```ts
fx: {
  replace?: Trigger[],          // triggers whose default effects you replace instead of adding to
  <trigger>: Emitter[],
}
```

Triggers: a state name (while in it), `enter:<state>` (once, on entering),
`ambient` (always), `land` (after each hop), `syllable` (each syllable while
speaking).

Emitter fields:

| field | notes |
| --- | --- |
| `glyph` | `z bubble sparkle heart note arc puff ring drop spark mote feather dot exclaim warning confetti cloud star gear` |
| `anchor` | anchor name |
| `rate` | per second while active, or how many at once for `enter:`/`land`/`syllable` |
| `offset`, `spread` | start position relative to the anchor, and random spread |
| `velocity`, `jitter` | units per second, and random variation |
| `mirror` | mirror half the particles across x |
| `gravity`, `drag`, `wobble` | motion |
| `life` | `[min, max]` seconds |
| `size` | `[at birth, at death]` |
| `rotation`, `spin` | starting angle, and radians per second |
| `align` | point along the direction of travel |
| `color` | colour |
| `glow` | adds light instead of covering |

At most 32 particles are alive at once, shared by all emitters.

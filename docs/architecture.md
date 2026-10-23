# Wobnimo architecture

Wobnimo is a runtime for animated, interactive mascots on the web. It takes a
small, declarative description of a character and makes it alive: lit like a
studio product shot, moved by springs, and reacting to what an app (or an
agent) is doing.

This document explains how it is put together and why. Read it before
changing module boundaries.

## The one idea

**A character is data, and one engine renders all of them.**

Rive and Lottie treat a character as an authored animation: a timeline of
keyframes, plus a state machine that switches between clips. That makes every
new character a new piece of hand work, and every new behavior a new clip.

Wobnimo splits a character into three independent things:

| Layer | Question it answers | Where it lives |
|---|---|---|
| **Body** | What does it look like? | The spec: parts, materials, paints, eyes, face |
| **Rig** | How do the pieces hang together and wobble? | The spec: bones, drives, waves, jiggle |
| **Acting** | What does this body do in each state? | The spec: a pose per state per bone, plus effects |
| **Behavior** | What is it doing right now? | The engine, shared by every character |

Behavior is written once and speaks a shared vocabulary of states (`idle`,
`thinking`, `listening`, `speaking`, `sleeping`, plus a `happy` reaction). Each
spec decides what those states look like on its own body: which bones take
which channels, and how each bone acts in each state. That is why the fifth character costs no engine code,
and why the five-hundredth won't either.

## Pipeline

```
CharacterSpec (JSON)
   │  compile()              once per character, pure
   ▼
CompiledCharacter ── fragment shader specialised to this body
   │                 + resolved bone list
   │
   │   every frame
   │   ┌──────────────┐  channels, weights  ┌─────┐  world→bone   ┌──────────┐
   └──►│ Brain (state)│────────────────────►│ Rig │──────────────►│ Renderer │──► pixels
       └──────┬───────┘   root, face        └──┬──┘   matrices    └────▲─────┘
              │ beats (land, syllable…)        │ anchors               │ particles
              └─────────────────────────►┌─────▼─┐───────────────────────┘
                                         │  Fx   │
                                         └───────┘
```

### 1. Spec (`packages/engine/src/spec`)

`types.ts` is the whole contract for a character. It is plain JSON on
purpose: it can be written by hand, generated (see `inky.ts`, whose tentacles
come from a loop), diffed in review, stored in a database, or written by an
LLM. The playground shows each spec next to its character with its gzipped
size, usually under 1.5 KB.

Units are fixed: the floor is `y = 0`, `+y` is up, `+z` faces the camera, one
unit is about the height of a small mascot, angles are radians, colors are
sRGB hex (converted to linear light by the compiler).

### 2. Compiler (`packages/engine/src/compiler`)

`compile(spec)` turns a spec into a fragment shader written for that one body.
Each part becomes a line of straight-line distance code with its constants
baked in. The GPU never interprets a scene graph and never loops over a list
of primitives, which is what makes per-pixel ray marching affordable.

- `resolve.ts` validates names and resolves them to indices. Errors name the
  character and the field (`pip: parts[3] names bone "jaw", which does not
  exist`), so an agent writing specs can fix its own mistakes.
- `emit-map.ts` writes `map(p)`, the signed distance field plus the material
  of the nearest surface. Parts combine in spec order, so a subtraction
  carves only what came before it.
- `emit-materials.ts` writes `getMaterial()`: base material, then paints,
  then eyes, then the face.
- `glsl/` holds the fixed parts of the shader: distance functions, lighting,
  the LED face, and `main()`.
- `glsl/particles.ts` draws the effect glyphs (z, note, heart, bubble…) as
  2D distance shapes on camera-facing quads.
- `uniforms.ts` is the single list of uniforms both sides agree on.

Shape is baked in; anything a product might change at runtime is a
uniform. Material colours are one of those (`uAlbedo`), so a colour picker
recolours a live mascot without building a new shader.

### 3. Behavior (`packages/engine/src/behavior`)

`Brain` turns a state into **channels**: head yaw, pitch and roll, flap, talk,
energy, plus face values (blink, lid, squint, smile, gaze, tilt) and the
root's placement (hops, float, squash and stretch, breathing). Every value
chases its target through a damped spring, so switching state at any moment,
even mid-hop, eases across instead of snapping. Randomness is seeded, so a
row of identical mascots don't blink in sync, and a given seed always
behaves the same.

`states.ts` holds the per-state targets as a table, not as code. Alongside
the state, the brain keeps a weight per **expression** (the five states plus
`happy`), each easing toward 1 or 0, so acting can cross-fade.

The brain also reports **beats**: one-frame events for the moments an
animator would hit, a landing, a syllable, entering `happy`. Speech
(`speech.ts`) is a syllable generator, not a sine wave: syllables grouped
into words and phrases, each with its own stress and vowel ("ah", "ee",
"oh", "oo"), closing on the consonant between them and resting shut
between phrases. The mouth, the jaw and a little squash all follow it.

Mouths are one shape, not a line plus a hole: two lips that meet at the
corners and part as the mouth opens (`glsl/mouth.ts`), so a painted mouth
morphs continuously from a smile to an open "ah" to a round "oo". Volt's
LED mouth draws the same shape on its matrix, and Pip's beak is two
hinged halves lined with the mouth colour, using a part `clip` to cut each
half flat. Birds turn their heads in snaps with holds between,
which is a temperament flag (`snapLook`), not bird code.

### Effects (`packages/engine/src/behavior/fx.ts`)

Emitters are data. Each one names a glyph, an anchor on the body (a point
fixed to a bone, like `mouth` or `antenna`), and a trigger: a state or
expression (emits continuously, `rate` per second), `ambient` (always), or a
beat (`land`, `syllable`, `enter:happy`, which emit `rate` particles at
once). Particles have velocity, drag, gravity, wobble, spin and a size
curve, and live in world space, so they trail behind a moving character
rather than sticking to it.

Every character gets `DEFAULT_FX` (z's when asleep, thought dots, sound arcs
when speaking, sparkles and hearts when happy, dust on landing). A spec adds
to those, or replaces a trigger's defaults with `replace: ['land']`.

Particles are drawn by the same shader as the body, sorted against the hit
distance, so a bubble that drifts behind Inky is hidden by Inky. The pool
holds 32 particles per mascot; when it's full, the oldest go first.

### 4. Rig (`packages/engine/src/rig`)

Each frame, every bone's rotation is its rest pose, plus its drives
(`channel × weight`), plus its idle wave (scaled by the state's energy).
**Jiggle bones** then treat their tip as a point mass on a spring that chases
where the tip would be at rest. That one mechanism gives the antenna its
whip on landing, the bird's wings their follow-through, and the octopus's
tentacles their trailing curl, since a chain of jiggle bones is a soft rope.
No keyframes anywhere.

**Acting** layers on top. A spec gives each bone a pose per expression,
each axis either a number or a motion `[base, amplitude, hz, phase, spin]`:

```ts
acting: {
  thinking: { shoulderR: { rx: -1.5, ry: -0.8 }, foreR: { rx: [-0.95, 0.1, 1.8, 0] } },
  happy:    { sprout: { ry: [0, 0, 0, 0, 16] } }, // a propeller, 16 rad/s
}
```

The rig blends every expression's pose by the brain's weights, so Volt's
hand rises to its chin over the same springs that tilt its head, and
getting interrupted mid-gesture simply blends to the next pose. Spin
accumulates, so a propeller winds down instead of snapping back to zero.

The rig outputs one world → bone matrix per bone. That is the whole interface
to the GPU.

### 5. Renderer (`packages/engine/src/render`)

`Renderer` is a three-method interface. `WebGL2Renderer` draws one
full-screen triangle per frame. In the shader:

- **Ray marching** a perspective camera with a long lens (a product shot),
  clipped to the character's bounding sphere.
- **Studio lighting**: a key with wrap, a cool fill, a sky dome, a softbox
  and window reflected in a clear coat with Fresnel, a cool rim light,
  subsurface scattering estimated from local thickness, velvet sheen, and
  the ACES filmic curve. Materials choose how glossy their reflections are.
- **Soft shadows and ambient occlusion**, marched against the same field,
  so every shape casts and receives them with no extra authoring. The floor
  shadow is marched up from the floor, and floating characters get a softer,
  lighter one.
- **Antialiasing** from how closely a missed ray passed the surface, plus
  pixel-footprint-aware filtering on painted detail (mouths, iris edges, LEDs).
- Output is **premultiplied alpha**, so the page's own background shows
  through. No backdrop is baked in.

### 6. Runtime (`packages/engine/src/runtime`)

`Mascot` is the public API: `new Mascot(canvas, spec, options)` or
`mount(container, spec, options)`, then `setState()`, `poke()`,
`setPalette()`, `setSpeed()`, `setEffects()`, `setSpec()`, `on()`,
`dispose()`. `element.ts` wraps it as `<wobnimo-mascot>`, so any framework
that renders tags can use it with no adapter. `customize.ts` makes new
characters from old ones (`recolor`, `variant`) without mutating them, so
compiled shaders stay cached by spec identity. A single shared
`scheduler` drives every mascot on the page from one `requestAnimationFrame`
loop. It skips mascots scrolled out of view, sleeps with the tab, and lowers
the render resolution when frames run slow, raising it again once they're
quick. With `prefers-reduced-motion`, a mascot settles into its state's pose
and stops drawing.

## Decisions and their reasons

**Signed distance fields over meshes.** A spec of 10 to 30 primitives
describes a smooth, organic character that a mesh would need thousands of
triangles and a modeling tool to match. Smooth blending (`smin`) gives
melted joins for free, so the bird's head grows out of its body. Lighting is
computed per pixel, which is what makes it look premium at any size. The
cost is GPU fill rate, which we control with bounding spheres, specialised
shaders, and adaptive resolution.

**One specialised shader per character, generated at runtime.** A generic
interpreter shader would loop over a primitive buffer on every step of every
ray. Generating code removes all of that, and compiling a shader takes a
few milliseconds, once.

**WebGL2 today, WebGPU behind the same interface.** WebGL2 runs everywhere
that matters. A WebGPU backend means the compiler also emits WGSL, and the
renderer interface already allows for that.

**TypeScript first, with clean seams for Rust.** The compiler (spec → shader)
and the behavior and rig update (pose in, matrices out) are pure functions of
their inputs. Either can move to Rust/WASM without touching anything else.
That also lets a server-side build render previews headlessly, so an agent
can see what it designed. We'd do it when we can measure a reason, not before.

**A custom element as the integration point.** Every framework renders
tags, and attributes are strings an agent or a CMS can write. Anything
richer goes through the `Mascot` object the element exposes.

**Zero runtime dependencies.** The engine is about 20 KB gzipped (the
playground prints the measured figure). No Three.js, no animation library.

## What the prototype doesn't do yet

- An in-browser editor. The spec format is designed so an editor is a view
  over the same data. Nothing in the engine assumes hand-written specs.
- Lip-sync from audio. Speech is driven by a syllable generator today;
  `talk` and the mouth's roundness are channels, so feeding them from a Web
  Audio analyser is a small, contained change.
- A WebGPU backend, and a worker/OffscreenCanvas mode. The renderer already
  accepts an `OffscreenCanvas`.
- Tests. Deferred on purpose until the shape of the API settles.

## Layout

```
packages/engine        the runtime: spec → shader, behavior, rig, renderer
packages/characters    the cast, as specs
apps/playground        the demo page
scripts/               build (single-file playground) and a headless screenshot helper
docs/                  this document
```

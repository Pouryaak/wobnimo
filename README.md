# animo.

Living mascots for the web. Describe a character as a few kilobytes of data,
and Animo renders it in real time, lit like a studio product shot and moved
by springs, reacting to what your app or agent is doing.

```ts
import { Mascot } from '@animo/engine';
import { volt } from '@animo/characters';

const mascot = new Mascot(canvas, volt);
mascot.setState('thinking'); // idle · thinking · listening · speaking · sleeping
```

- **Characters are data.** A `CharacterSpec` is plain JSON: parts, materials,
  bones, eyes, face. No keyframes, no per-character code.
- **One engine for any body.** A robot, a bird, a jelly, a ghost and an
  octopus all run on the same ~14 KB (gzipped) runtime with no dependencies.
- **Premium by default.** Per-pixel studio lighting, clear coat, subsurface
  scattering, soft shadows and occlusion, all derived from the shape.
- **Alive.** Springs, hops, blinks, glances, jiggle chains, pointer
  following, and a shared set of agent-friendly states.

## Run it

```bash
npm install
npm run build        # dist/playground.html, one self-contained file
npm run typecheck
```

Open `dist/playground.html` in a browser with WebGL2.

## Read next

- [`docs/architecture.md`](docs/architecture.md): how it works and why.
- [`packages/engine/src/spec/types.ts`](packages/engine/src/spec/types.ts): the character format.
- [`packages/characters/src`](packages/characters/src): the five specs.

## Layout

```
packages/engine        spec → shader compiler, behavior, rig, WebGL2 renderer, runtime
packages/characters    the cast
apps/playground        the demo page
scripts/               build and a headless screenshot helper
```

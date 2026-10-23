# wobnimo.

Living mascots for the web. Describe a character as a few kilobytes of data,
and Wobnimo renders it in real time, lit like a studio product shot, acted
like a cartoon, and reacting to what your app or agent is doing.

```html
<script type="module">
  import { defineWobnimoElement } from '@wobnimo/characters';
  defineWobnimoElement();
</script>

<wobnimo-mascot character="volt" state="thinking"></wobnimo-mascot>
```

- **Characters are data.** A `CharacterSpec` is plain JSON: parts, materials,
  bones, eyes, face, acting and effects. No keyframes, no per-character code.
- **One engine for any body.** Eleven characters (a robot, a songbird, a
  jelly, a ghost, an octopus, a plush cat, a tree frog, a penguin, a baby
  dino, a rain cloud and a robot duck) all run on the same ~24 KB (gzipped)
  runtime with no dependencies.
- **Real surfaces.** Fur, pebbled scales, speckled wet skin and a rippled
  sheen are procedural detail on a material (`surface`), fixed to a bone so
  they move with the body.
- **Premium by default.** Per-pixel studio lighting, clear coat, subsurface
  scattering, soft shadows and occlusion, all derived from the shape.
- **Acted, not just animated.** Every state has a pose per character (Volt
  props its chin when thinking, Inky cups a tentacle to listen), on springs,
  so any change of state at any moment blends. Effects live around the
  character: z's when it sleeps, notes when the bird talks, splashes when the
  jelly lands, and the body hides whatever passes behind it.

## Use it

Ten states, shared by every character, made to follow an agent:

| State | When |
|---|---|
| `idle` | Waiting for the user |
| `thinking` | Planning, before it answers |
| `listening` | The user is talking or typing |
| `speaking` | Streaming a reply |
| `sleeping` | Nothing has happened for a while |
| `working` | Running a tool, a build or a long task |
| `error` | Something failed |
| `surprised` | Something unexpected arrived |
| `celebrating` | A task finished, the tests passed |
| `sad` | It could not help, or the user is unhappy |

Clicking a mascot pokes it (a happy hop).

### HTML, Vue, Svelte, anything that renders tags

```html
<wobnimo-mascot
  character="pip"
  state="speaking"
  palette="feather:#7ec8ff; wing:#3a7bd5"
  speed="1.2"
  style="width: 200px; height: 200px"
></wobnimo-mascot>

<script>
  const pip = document.querySelector('wobnimo-mascot');
  pip.state = 'listening';
  pip.addEventListener('poke', () => console.log('hi'));
  pip.addEventListener('statechange', (e) => console.log(e.detail));
</script>
```

Attributes: `character`, `state`, `seed`, `speed`, `palette`,
`interactive="false"`, `effects="false"`. The element is 160 × 160 unless
you size it.

### JavaScript

```ts
import { mount } from '@wobnimo/engine';
import { volt } from '@wobnimo/characters';

const mascot = mount(document.querySelector('#mascot'), volt, { state: 'idle' });

agent.on('status', (status) => mascot.setState(status));
mascot.on('poke', () => openChat());
mascot.setPalette({ shell: '#e0457b' }); // live, no shader rebuild
mascot.setSpeed(0.8);
mascot.setEffects(false);
mascot.dispose(); // removes the canvas too
```

`new Mascot(canvas, spec, options)` does the same on a canvas you own.

### React

```tsx
function Mascot({ state = 'idle' }) {
  const host = useRef(null);
  const mascot = useRef(null);
  useEffect(() => {
    mascot.current = mount(host.current, volt);
    return () => mascot.current.dispose();
  }, []);
  useEffect(() => mascot.current?.setState(state), [state]);
  return <div ref={host} style={{ width: 160, height: 160 }} />;
}
```

Or render `<wobnimo-mascot>` directly; React 19 passes its props through.

### Options

| Option | Default | |
|---|---|---|
| `state` | `'idle'` | Where it starts. |
| `palette` | spec's own | New colours for materials by name. Unknown names throw, listing the real ones. |
| `speed` | `1` | Pace of everything: acting, springs, effects. |
| `effects` | `true` | Particles around the character. |
| `interactive` | `true` | Follows the pointer, hops when clicked. |
| `framing` | `1` | Room around the character; above 1 makes it smaller in its canvas. |
| `seed` | random | Desyncs blinks and glances between mascots; fixed seeds behave the same every time. |
| `exposure`, `shadow`, `maxPixelRatio`, `respectReducedMotion` | | Rendering. |

### Your own character

```ts
import { defineCharacter, variant } from '@wobnimo/engine';
import { pip } from '@wobnimo/characters';

// a recoloured, calmer cousin
const wren = variant(pip, {
  id: 'wren',
  name: 'Wren',
  palette: { feather: '#9b7b5b', wing: '#5d4630' },
  motion: { ...pip.motion, hop: 0.3 },
});

// or from scratch, fully typed
const blob = defineCharacter({ id: 'blob', /* parts, materials, bones… */ });
```

Spec mistakes fail loudly and name the field (`pip: acting.thinking names
bone "jaw2", which does not exist`), so a person or an agent writing a spec
can fix it from the message alone. The playground shows every spec next to
its character, with a copy button.

## Run it

```bash
npm install
npm run build        # dist/site/index.html, one self-contained page
npm run typecheck
```

Open `dist/site/index.html` in a browser with WebGL2. Every push to `main`
rebuilds the playground and publishes it to GitHub Pages
(`.github/workflows/pages.yml`).

## Read next

- [`docs/architecture.md`](docs/architecture.md): how it works and why.
- [`packages/engine/src/spec/types.ts`](packages/engine/src/spec/types.ts): the character format.
- [`packages/characters/src`](packages/characters/src): the eleven specs.

## Layout

```
packages/engine        spec → shader compiler, behavior, effects, rig, WebGL2 renderer, runtime
packages/characters    the cast
apps/playground        the demo page
scripts/               build and a headless screenshot helper
```

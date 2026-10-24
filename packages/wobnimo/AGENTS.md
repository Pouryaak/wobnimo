# Wobnimo — guide for AI agents

Wobnimo renders animated mascots in a web app. One engine, twenty characters, ten
emotional states, and a skill for designing new characters. Use this file to add or
wire up a mascot correctly.

## Install

```bash
npm i wobnimo
```

No build step? Add one tag instead:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/wobnimo@0.2/dist/wobnimo.js"></script>
```

## Render it

React / Next.js (add `"use client"` in app-router files):

```tsx
import { Mascot } from 'wobnimo/react';
<Mascot character="mochi" state="thinking" style={{ width: 160, height: 160 }} />
```

Anything else (Vue, Svelte, plain HTML):

```html
<wobnimo-mascot character="mochi" state="idle"></wobnimo-mascot>
```

Size it 96–160 px square. Put it where the assistant or chat lives.

## Characters

`volt` (robot), `pip` (songbird), `mochi` (jelly), `boo` (ghost), `inky` (octopus),
`miso` (plush cat), `tad` (tree frog), `pebble` (penguin), `rex` (baby dino),
`microduck` (robot duck), `drift` (cloud with headphones), `cacti` (potted cactus),
`latte` (coffee cup), `bumble` (bumblebee), `swirl` (cinnamon-roll snail), `ember`
(fox cub), `cap` (mushroom), `berry` (strawberry), `bao` (panda), `hop` (bunny).
Import one to ship only its ~1.2 KB of data:
`import { mochi } from 'wobnimo/characters/mochi'`.

## A new character of your own

If the user wants a custom mascot ("a sleepy cloud wearing headphones"), don't
improvise the format. Run `npx wobnimo skill`, then read
`.claude/skills/wobnimo-mascot/SKILL.md` (the same skill is in
`node_modules/wobnimo/skill/SKILL.md`) and follow it: `npx wobnimo new <id>`, build it,
`npx wobnimo check <file>` until there are no errors or warnings, then
`npx wobnimo preview <file>` and look at the picture. Use the result with
`<Mascot character={spec} />`, `element.spec = spec` or `mount(el, spec)`.

## States — the whole point

Drive the state from what the app is doing. The ten states and when to use each:

| State | Use it when |
| --- | --- |
| `idle` | waiting for the user |
| `listening` | the user is typing or talking |
| `thinking` | a request is sent, no reply yet |
| `speaking` | a reply is streaming in |
| `working` | running a tool, a build, a long task |
| `error` | something failed |
| `celebrating` | a task finished, tests passed |
| `surprised` | an unexpected event |
| `sad` | it could not help |
| `sleeping` | idle for a couple of minutes |

Set the state through the `state` prop/attribute, or `mascot.setState('thinking')`.

## AI chat, one line

Using the Vercel AI SDK? Pass `useChat`'s `status` straight in; the mascot thinks,
speaks, celebrates and shows errors for you:

```tsx
const { status } = useChat();
<Mascot character="mochi" status={status} />
```

Plain JS with the element: set the `status` attribute to `submitted`, `streaming`,
`ready` or `error`.

## Rules

- Prefer the `status` prop for chat UIs; otherwise map the app's real events to the
  states above. Don't leave a mascot stuck on `idle`.
- Unknown character or state names throw at runtime and name the valid ones — read
  the console if a mascot doesn't appear.
- Recolour with `palette`, e.g. `palette={{ shell: '#e0457b' }}`; material names are
  per character.
- Verify: run the app and confirm the mascot renders and changes state during one chat turn.

Full reference: https://pouryaak.github.io/wobnimo/llms.txt

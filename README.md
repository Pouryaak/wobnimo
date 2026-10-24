<div align="center">

<a href="https://pouryaak.github.io/wobnimo/">
  <picture>
    <source srcset="https://pouryaak.github.io/wobnimo/media/team.webp" type="image/webp">
    <img src="https://pouryaak.github.io/wobnimo/media/team.gif" alt="The Wobnimo team: ten animated mascots lined up like a team photo, celebrating in a wave" width="900">
  </picture>
</a>

# wobnimo

### Give your app a face.

Ten living mascots on one featherweight animation engine for the web.
Real 3D, every mood, ~25&nbsp;KB, zero dependencies — and built so an AI agent can wire it up for you.

[![npm](https://img.shields.io/npm/v/wobnimo?color=d9f55c&labelColor=16181d)](https://www.npmjs.com/package/wobnimo)
[![gzip](https://img.shields.io/badge/one%20mascot-~25%20KB%20gzip-d9f55c?labelColor=16181d)](https://pouryaak.github.io/wobnimo/)
[![zero deps](https://img.shields.io/badge/dependencies-0-d9f55c?labelColor=16181d)](https://www.npmjs.com/package/wobnimo?activeTab=dependencies)
[![license](https://img.shields.io/npm/l/wobnimo?color=d9f55c&labelColor=16181d)](./LICENSE)

**[▶ Live playground](https://pouryaak.github.io/wobnimo/)** · **[Quickstart](#add-one-in-10-seconds)** · **[For AI agents](#for-ai-agents)**

</div>

---

Chatbots, copilots and apps feel alive when something on screen reacts. Wobnimo gives you a
character that **thinks while it works, talks while it streams, and celebrates when it's done** —
in a tag you drop anywhere, with no build step and nothing to configure.

## Add one in 10 seconds

No build, no npm, no framework. Two lines in any HTML page:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/wobnimo@0.1/dist/wobnimo.js"></script>

<wobnimo-mascot character="mochi" state="thinking"></wobnimo-mascot>
```

That's it — a living mascot is on your page. [Try every character and mood in the playground →](https://pouryaak.github.io/wobnimo/)

## Meet the team

**Volt** the LED robot · **Pip** the songbird · **Mochi** the jelly · **Boo** the ghost · **Inky** the octopus ·
**Miso** the plush cat · **Tad** the tree frog · **Pebble** the penguin · **Rex** the baby dino · **Microduck** the robot duck.

Each has its own body, surface and personality, and every one of them plays all ten moods.
Recolour any of them to match your brand, or write your own as plain data.

## Give your AI a face

This is the part that matters. An assistant that just spins a loader feels like a machine.
Wire a mascot to what your app is doing and it feels like someone is in there.

<div align="center">
<img src="https://pouryaak.github.io/wobnimo/media/moods.png" alt="Mochi in six moods: listening, thinking, speaking, working, celebrating, sleeping" width="900">
</div>

Using the [Vercel AI SDK](https://ai-sdk.dev)? It's **one prop** — the mascot thinks, speaks,
celebrates and shows errors for you:

```tsx
import { Mascot } from 'wobnimo/react';

const { status } = useChat();

<Mascot character="mochi" status={status} />
```

The ten states map straight onto what an app or agent actually does:

| State | Show it when | | State | Show it when |
| --- | --- | --- | --- | --- |
| `idle` | waiting for the user | | `working` | running a tool or long task |
| `listening` | the user is typing | | `error` | something failed |
| `thinking` | request sent, no reply yet | | `celebrating` | a task finished |
| `speaking` | a reply is streaming | | `surprised` | an unexpected event |
| `sleeping` | idle for a while | | `sad` | it couldn't help |

## For AI agents

Wobnimo is built to be installed *by* an agent. On the [playground](https://pouryaak.github.io/wobnimo/),
every character has a **Copy for agent** button: it copies one self-contained prompt that tells any
agent (Claude Code, Cursor, Copilot, v0…) exactly what to install and how to wire the mascot to your
app's real events. Paste it, and it's done.

Prefer to point your agent at the docs? Everything is at
**[pouryaak.github.io/wobnimo/llms.txt](https://pouryaak.github.io/wobnimo/llms.txt)**, and the package
ships an `AGENTS.md` so an agent inspecting `node_modules/wobnimo` already knows the rules.

## Use it with a bundler

```bash
npm i wobnimo
```

**React / Next.js** (`"use client"` in app-router files):

```tsx
import { Mascot } from 'wobnimo/react';

<Mascot character="volt" state="thinking" style={{ width: 160, height: 160 }} />
```

**Vanilla JS, Vue, Svelte, anything** — register the element once, then use the tag:

```ts
import 'wobnimo/element';
// <wobnimo-mascot character="pip" state="speaking"></wobnimo-mascot>
```

**Control it in code:**

```ts
import { mount } from 'wobnimo';
import { mochi } from 'wobnimo/characters/mochi';

const mascot = mount(document.querySelector('#mascot'), mochi);
agent.on('status', (s) => mascot.setState(s));   // idle · thinking · speaking · …
mascot.setPalette({ jelly: '#ff5d8f' });          // recolour live, no rebuild
```

Import one character (`wobnimo/characters/mochi`, ~1.2 KB) or the whole cast (`wobnimo/characters`) —
you only ship what you use.

## Why Wobnimo

- **Tiny.** One mascot is ~25 KB gzipped, the whole thing has **zero dependencies**, and no Three.js.
- **Real, not a sprite.** Characters are signed-distance 3D with studio lighting, so they're crisp at any size and animate from springs, not canned clips.
- **Characters are data.** A character is plain JSON — parts, materials, bones. Recolour, remix with `variant()`, or write your own.
- **Drops in anywhere.** A web component for every framework, a first-class React wrapper, and a CDN tag for no-build pages.
- **Respectful.** Honours `prefers-reduced-motion`, sleeps when off-screen, and shares one WebGL context so a page can hold a whole cast.

## Links

- 🎨 **[Live playground](https://pouryaak.github.io/wobnimo/)** — every character, every mood, copy-paste install
- 📦 **[npm](https://www.npmjs.com/package/wobnimo)**
- 🤖 **[llms.txt](https://pouryaak.github.io/wobnimo/llms.txt)** — the whole API for agents

---

<div align="center">

If Wobnimo makes your app smile, **drop a ⭐** — it genuinely helps other people find it.

Built with care. MIT licensed. · Next: a WebGPU renderer, a Rust + WebAssembly core, a visual editor.

</div>

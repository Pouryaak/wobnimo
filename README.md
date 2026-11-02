<div align="center">

<a href="https://pouryaak.github.io/wobnimo/">
  <picture>
    <img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/repo-hero.svg" width="100%" alt="wobnimo — GIVE YOUR APP A FACE  ·  ~25 KB GZIP  ·  0 DEPENDENCIES">
  </picture>
</a>

<br>

<a href="https://pouryaak.github.io/wobnimo/">
  <picture>
    <source srcset="https://pouryaak.github.io/wobnimo/media/team.webp" type="image/webp">
    <img src="https://pouryaak.github.io/wobnimo/media/team.gif" alt="The Wobnimo team: ten animated mascots lined up like a team photo, celebrating in a wave" width="100%">
  </picture>
</a>

<br>

<a href="https://pouryaak.github.io/wobnimo/"><picture><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/btn-studio.svg" height="40" alt="Enter the studio"></picture></a>&nbsp;&nbsp;<a href="https://www.npmjs.com/package/wobnimo"><picture><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/btn-npm.svg" height="40" alt="npm i wobnimo"></picture></a>&nbsp;&nbsp;<a href="https://pouryaak.github.io/wobnimo/llms.txt"><picture><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/btn-llms.svg" height="40" alt="llms.txt for agents"></picture></a>&nbsp;&nbsp;<a href="https://github.com/Pouryaak/wobnimo/tree/main/skills/wobnimo-mascot"><picture><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/btn-skill.svg" height="40" alt="Agent Skill"></picture></a>

</div>

<br>

<!-- 01 / FOR DEVELOPERS (Interactive Cream Band Code Switcher) -->
<picture>
  <img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/sec-01-devs.svg" width="100%" alt="01 / For Developers — Small code. Big feeling.">
</picture>

<details name="wobnimo-dev-tabs" open>
<summary><picture><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/tab-dev-html-cdn.svg" width="96%" align="middle" alt="Add One in 10 Seconds (HTML / CDN)"></picture></summary>

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/wobnimo@0.2/dist/wobnimo.js"></script>

<wobnimo-mascot character="mochi" state="thinking"></wobnimo-mascot>
```

> Drop those two lines anywhere and a living 3D mascot is on your page.

</details>

<details name="wobnimo-dev-tabs">
<summary><picture><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/tab-dev-react-nextjs.svg" width="96%" align="middle" alt="React &amp; Next.js Component"></picture></summary>

```tsx
// npm i wobnimo
"use client";
import { Mascot } from 'wobnimo/react';

export function CopilotAvatar() {
  return <Mascot character="volt" state="thinking" style={{ width: 160, height: 160 }} />;
}
```

> Import one character (`wobnimo/characters/mochi`, ~1.2 KB) or the full cast — you only ship what you use.

</details>

<details name="wobnimo-dev-tabs">
<summary><picture><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/tab-dev-vanilla-js.svg" width="96%" align="middle" alt="JavaScript, Vue, Svelte &amp; Live Palette Control"></picture></summary>

```ts
import { mount } from 'wobnimo';
import { mochi } from 'wobnimo/characters/mochi';

const mascot = mount(document.querySelector('#mascot'), mochi);
agent.on('status', (s) => mascot.setState(s));   // idle · thinking · speaking · celebrating…
mascot.setPalette({ jelly: '#ff5d8f' });          // recolour live, no rebuild
```

> Or register `<wobnimo-mascot>` once via `import "wobnimo/element"` in Vue, Svelte, or plain JS.

</details>

<br>

<!-- 02 / GIVE YOUR AI A FACE (Moods Showcase + 10-State Engine) -->
<picture>
  <img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/sec-02-moods.svg" width="100%" alt="02 / Give your AI a face">
</picture>

<div align="center">
  <a href="https://pouryaak.github.io/wobnimo/">
    <img src="https://pouryaak.github.io/wobnimo/media/moods.png" alt="Mochi in six moods: listening, thinking, speaking, working, celebrating, sleeping" width="100%">
  </a>
</div>

<picture>
  <img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/panel-states.svg" width="100%" alt="Ten expressive states">
</picture>

```tsx
import { Mascot } from 'wobnimo/react';

const { status } = useChat(); // Vercel AI SDK

<Mascot character="mochi" status={status} />
```

<br>

<!-- 03 / DESCRIBE IT. GET IT. (The Agent Forge) -->
<picture>
  <img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/sec-03-forge.svg" width="100%" alt="03 / Make your own — Describe it. Get it.">
</picture>

<picture>
  <img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/panel-forge.svg" width="100%" alt="Agent Forge workflow">
</picture>

```bash
npx wobnimo skill                      # installs the skill for Claude Code, Codex, Cursor, OpenCode…
npx wobnimo check mascots/drift.ts     # measures real 3D geometry & reports exact coordinate fixes
npx wobnimo preview mascots/drift.ts   # renders front, side, back, face close-up & all 10 moods to PNG
```

<br>

<!-- 04 / FEATHERWEIGHT ARCHITECTURE -->
<picture>
  <img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/sec-04-weight.svg" width="100%" alt="04 / Featherweight — Tiny by nature. Lively by design.">
</picture>

<picture>
  <img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/panel-weight.svg" width="100%" alt="23.7 KB Featherweight Engine">
</picture>

<br><br>

<!-- 05 / THE CAST (Interactive 20-Mascot Explorer) -->
<picture>
  <img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/sec-05-cast.svg" width="100%" alt="05 / The Cast — Twenty living personalities.">
</picture>

<details name="wobnimo-cast" open>
<summary><picture><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/cast-originals-trigger.svg" width="96%" align="middle" alt="The Studio Originals (10 Mascots)"></picture></summary>
<br>
<picture><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/cast-originals-stage.svg" width="100%" alt="The Studio Originals (10 Mascots)"></picture>
<br>
</details>

<details name="wobnimo-cast">
<summary><picture><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/cast-agent-made-trigger.svg" width="96%" align="middle" alt="The Agent-Described Cast (10 Mascots from 1 Sentence Each)"></picture></summary>
<br>
<picture><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/cast-agent-made-stage.svg" width="100%" alt="The Agent-Described Cast (10 Mascots from 1 Sentence Each)"></picture>
<br>
</details>

<br>

<!-- FINALE -->
<a href="https://github.com/Pouryaak/wobnimo">
  <picture>
    <img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/repo-finale.svg" width="100%" alt="Bring one home — Star Wobnimo on GitHub">
  </picture>
</a>

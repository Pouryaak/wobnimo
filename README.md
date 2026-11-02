<div align="center">

<a href="https://pouryaak.github.io/wobnimo/">
  <picture><source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/repo-hero-mobile.svg?v=edf64a24"><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/repo-hero.svg?v=c4459b4e" width="100%" alt="wobnimo — GIVE YOUR APP A FACE  ·  ~25 KB GZIP  ·  0 DEPENDENCIES"></picture>
</a>

<br>

<a href="https://pouryaak.github.io/wobnimo/">
  <picture>
    <source srcset="https://pouryaak.github.io/wobnimo/media/team.webp" type="image/webp">
    <img src="https://pouryaak.github.io/wobnimo/media/team.gif" alt="The Wobnimo team: ten animated mascots lined up like a team photo, celebrating in a wave" width="100%">
  </picture>
</a>

<br>

<a href="https://pouryaak.github.io/wobnimo/"><picture><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/btn-studio.svg?v=b418a0bf" height="38" alt="Enter the studio"></picture></a>&nbsp;&nbsp;<a href="https://www.npmjs.com/package/wobnimo"><picture><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/btn-npm.svg?v=0df30903" height="38" alt="npm i wobnimo"></picture></a>&nbsp;&nbsp;<a href="https://pouryaak.github.io/wobnimo/llms.txt"><picture><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/btn-llms.svg?v=2d040abb" height="38" alt="llms.txt for agents"></picture></a>&nbsp;&nbsp;<a href="https://github.com/Pouryaak/wobnimo/tree/main/skills/wobnimo-mascot"><picture><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/btn-skill.svg?v=0ce968d1" height="38" alt="Agent Skill"></picture></a>

</div>

<br>

<!-- 01 / FOR DEVELOPERS (Interactive Cream Band Code Switcher) -->
<picture><source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/sec-01-devs-mobile.svg?v=04087a7e"><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/sec-01-devs.svg?v=61cd1daf" width="100%" alt="01 / For Developers — Small code. Big feeling."></picture>

<details name="wobnimo-dev-tabs" open>
<summary><picture><source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/tab-dev-html-cdn-mobile.svg?v=32bc427e"><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/tab-dev-html-cdn.svg?v=80614d1c" width="95%" align="middle" alt="Add One in 10 Seconds (HTML / CDN)"></picture></summary>

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/wobnimo@0.2/dist/wobnimo.js"></script>

<wobnimo-mascot character="mochi" state="thinking"></wobnimo-mascot>
```

> Drop those two lines anywhere and a living 3D mascot is on your page.

</details>

<details name="wobnimo-dev-tabs">
<summary><picture><source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/tab-dev-react-nextjs-mobile.svg?v=0e64015c"><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/tab-dev-react-nextjs.svg?v=a88d2608" width="95%" align="middle" alt="React &amp; Next.js Component"></picture></summary>

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
<summary><picture><source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/tab-dev-vanilla-js-mobile.svg?v=98a7db5d"><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/tab-dev-vanilla-js.svg?v=6e0d22e9" width="95%" align="middle" alt="JavaScript, Vue, Svelte &amp; Live Palette Control"></picture></summary>

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
<picture><source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/sec-02-moods-mobile.svg?v=e5f62cbc"><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/sec-02-moods.svg?v=7905a394" width="100%" alt="02 / Give your AI a face"></picture>

<div align="center">
  <a href="https://pouryaak.github.io/wobnimo/">
    <img src="https://pouryaak.github.io/wobnimo/media/moods.png" alt="Mochi in six moods: listening, thinking, speaking, working, celebrating, sleeping" width="100%">
  </a>
</div>

<picture><source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/panel-states-mobile.svg?v=859b7345"><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/panel-states.svg?v=ab1ae308" width="100%" alt="Ten expressive states"></picture>

```tsx
import { Mascot } from 'wobnimo/react';

const { status } = useChat(); // Vercel AI SDK

<Mascot character="mochi" status={status} />
```

<br>

<!-- 03 / DESCRIBE IT. GET IT. (The Agent Forge) -->
<picture><source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/sec-03-forge-mobile.svg?v=7e839363"><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/sec-03-forge.svg?v=ebf61750" width="100%" alt="03 / Make your own — Describe it. Get it."></picture>

<picture><source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/panel-forge-mobile.svg?v=ec9b1890"><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/panel-forge.svg?v=e183c783" width="100%" alt="Agent Forge workflow"></picture>

```bash
npx wobnimo skill                      # installs the skill for Claude Code, Codex, Cursor, OpenCode…
npx wobnimo check mascots/drift.ts     # measures real 3D geometry & reports exact coordinate fixes
npx wobnimo preview mascots/drift.ts   # renders front, side, back, face close-up & all 10 moods to PNG
```

<br>

<!-- 04 / FEATHERWEIGHT ARCHITECTURE -->
<picture><source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/sec-04-weight-mobile.svg?v=3317ee1d"><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/sec-04-weight.svg?v=f7a7dfd7" width="100%" alt="04 / Featherweight — Tiny by nature. Lively by design."></picture>

<picture><source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/panel-weight-mobile.svg?v=08648953"><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/panel-weight.svg?v=10aad67a" width="100%" alt="23.7 KB Featherweight Engine"></picture>

<br><br>

<!-- 05 / THE CAST (Interactive 20-Mascot Explorer) -->
<picture><source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/sec-05-cast-mobile.svg?v=4c95c34f"><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/sec-05-cast.svg?v=f73c8a1e" width="100%" alt="05 / The Cast — Twenty living personalities."></picture>

<details name="wobnimo-cast" open>
<summary><picture><source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/cast-originals-trigger-mobile.svg?v=d95b78a2"><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/cast-originals-trigger.svg?v=63a31395" width="95%" align="middle" alt="The Studio Originals (10 Mascots)"></picture></summary>
<br>
<picture><source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/cast-originals-stage-mobile.svg?v=36a28307"><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/cast-originals-stage.svg?v=de042327" width="100%" alt="The Studio Originals (10 Mascots)"></picture>
<br>
</details>

<details name="wobnimo-cast">
<summary><picture><source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/cast-agent-made-trigger-mobile.svg?v=070ead07"><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/cast-agent-made-trigger.svg?v=365e8cbe" width="95%" align="middle" alt="The Agent-Described Cast (10 Mascots from 1 Sentence Each)"></picture></summary>
<br>
<picture><source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/cast-agent-made-stage-mobile.svg?v=b71abd73"><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/cast-agent-made-stage.svg?v=375f620a" width="100%" alt="The Agent-Described Cast (10 Mascots from 1 Sentence Each)"></picture>
<br>
</details>

<br>

<!-- FINALE -->
<a href="https://github.com/Pouryaak/wobnimo">
  <picture><source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/repo-finale-mobile.svg?v=d2f76522"><img src="https://raw.githubusercontent.com/Pouryaak/wobnimo/main/assets/repo-finale.svg?v=3cf62240" width="100%" alt="Bring one home — Star Wobnimo on GitHub"></picture>
</a>

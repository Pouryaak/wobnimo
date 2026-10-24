/* The prompts the site hands to a person's coding agent. Each one is
   self-contained, so it works pasted into any agent with no other context. */

import type { CharacterSpec, MascotState, Palette } from '@wobnimo/engine';

/** Copy for agent: has an agent (Claude Code, Cursor, Copilot, v0…) install
    and wire up one character. It names the chosen character and state so
    the paste lands exactly where the person was looking. */
export function agentPrompt(spec: CharacterSpec, state: MascotState, colors?: Palette): string {
  const entries = Object.entries(colors ?? {});
  const reactPalette = entries.length ? ` palette={{ ${entries.map(([k, v]) => `${k}: '${v}'`).join(', ')} }}` : '';
  const attrPalette = entries.length ? ` palette="${entries.map(([k, v]) => `${k}:${v}`).join(',')}"` : '';
  return `Add a Wobnimo mascot to this app.

Wobnimo (npm: "wobnimo") is a tiny web animation engine with twenty ready-made mascots and ten emotional states. Set it up:

1. Install it: npm i wobnimo
2. Render the "${spec.id}" character where the user or assistant lives, 96–160px square.
   - React / Next.js (add "use client" in app-router files):
       import { Mascot } from 'wobnimo/react';
       <Mascot character="${spec.id}" state="${state}"${reactPalette} style={{ width: 128, height: 128 }} />
   - Anything else (Vue, Svelte, plain HTML) — register the element once (import 'wobnimo/element'), then:
       <wobnimo-mascot character="${spec.id}" state="${state}"${attrPalette}></wobnimo-mascot>
3. Drive the state from what the app is actually doing — don't leave it stuck on idle. The ten states:
   idle (waiting for the user), listening (user is typing), thinking (request sent, no reply yet),
   speaking (reply streaming in), working (running a tool or long task), error (something failed),
   celebrating (a task finished), surprised (unexpected event), sad (couldn't help), sleeping (idle a while).
   If this is a chat UI on the Vercel AI SDK, it's one prop:
       const { status } = useChat();
       <Mascot character="${spec.id}" status={status}${reactPalette} />
   …and the mascot thinks, speaks, celebrates and errors on its own.
4. Verify: run the app and confirm the mascot renders and changes state during one chat turn.

Full reference: https://pouryaak.github.io/wobnimo/llms.txt`;
}

/** The prompt that has an agent design a new character from the person's sentence. */
export function describePrompt(sentence: string): string {
  const what = sentence.trim().replace(/[.!\s]+$/, '') || 'a friendly mascot that fits this app';
  return `Make a custom Wobnimo mascot for this app: ${what}.

Wobnimo (npm: "wobnimo") is a tiny web animation engine. A mascot is one TypeScript file of plain data, and the engine animates it through ten states. Do this:

1. Install it: npm i wobnimo
2. Add the mascot-design skill: npx wobnimo skill
   (it lands in .claude/skills/wobnimo-mascot and .agents/skills/wobnimo-mascot)
3. Read .claude/skills/wobnimo-mascot/SKILL.md and follow it step by step:
   plan, npx wobnimo new <id>, build it feature by feature, run npx wobnimo check after each
   one until it reports no errors and no warnings, then npx wobnimo preview and look at the picture.
4. Wire it into the app where the user or assistant lives, 96–160px square, and drive its state
   from what the app is actually doing: thinking while waiting, speaking while a reply streams,
   error when something fails, celebrating when a task finishes.
5. Tell me what you made, where the file is, and how to watch it live: npx wobnimo preview <file> --live

Skill source: https://github.com/Pouryaak/wobnimo/tree/main/skills/wobnimo-mascot`;
}

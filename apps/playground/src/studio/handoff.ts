/* What the person takes away from the studio: the spec as a file, a
   snippet that renders it, and a prompt that has their agent wire it in.
   A cast member is used by name; a new character travels as its file. */

import { recolor, type CharacterSpec, type MascotState, type Palette } from '@wobnimo/engine';
import { agentPrompt } from '../shared/prompts';

export interface Made {
  spec: CharacterSpec;
  palette?: Palette;
  state: MascotState;
  /** Whether the engine already ships it, so apps can name it instead of carrying the file. */
  inCast: boolean;
}

/* `sleepy-cloud` → `sleepyCloud`, safe to use as a variable name */
const ident = (id: string) => id.replace(/[^a-z0-9]+(.)?/gi, (_, c: string | undefined) => (c ?? '').toUpperCase()).replace(/^\d/, '_$&');

/** The spec as a TypeScript file, with the chosen colours baked in. */
export function specSource({ spec, palette }: Made): string {
  const baked = palette ? recolor(spec, palette) : spec;
  /* JSON, minus the quotes on keys that don't need them, reads like hand-written TS */
  const body = JSON.stringify(baked, null, 2).replace(/^(\s*)"([A-Za-z_$][\w$]*)":/gm, '$1$2:');
  return `import type { CharacterSpec } from 'wobnimo';

/** ${spec.name}: ${spec.tagline ?? 'made in the Wobnimo studio'}. */
export const ${ident(spec.id)}: CharacterSpec = ${body};
`;
}

/** A React snippet that renders it. */
export function reactSnippet(made: Made): string {
  const { spec, palette, state } = made;
  const colors = Object.entries(palette ?? {});
  const paletteProp = colors.length ? ` palette={{ ${colors.map(([k, v]) => `${k}: '${v}'`).join(', ')} }}` : '';
  if (made.inCast) {
    return `import { Mascot } from 'wobnimo/react';

<Mascot character="${spec.id}" state="${state}"${paletteProp} />`;
  }
  return `import { Mascot } from 'wobnimo/react';
import { ${ident(spec.id)} } from './mascots/${spec.id}';

<Mascot character={${ident(spec.id)}} state="${state}" />`;
}

/** A prompt that has the person's agent install Wobnimo and wire this mascot in. */
export function handoffPrompt(made: Made): string {
  if (made.inCast) return agentPrompt(made.spec, made.state, made.palette);
  return `Add this custom Wobnimo mascot to the app. It was designed in the Wobnimo studio.

1. Install it: npm i wobnimo
2. Save the spec below as mascots/${made.spec.id}.ts, then run npx wobnimo check mascots/${made.spec.id}.ts; it should report no errors.
3. Render it where the user or assistant lives, 96–160px square:
   - React / Next.js ("use client" in app-router files):
       import { Mascot } from 'wobnimo/react';
       import { ${ident(made.spec.id)} } from './mascots/${made.spec.id}';
       <Mascot character={${ident(made.spec.id)}} state="${made.state}" style={{ width: 128, height: 128 }} />
   - Anything else: import 'wobnimo/element', then set element.spec = ${ident(made.spec.id)} on a <wobnimo-mascot>.
4. Drive its state from what the app is doing: thinking while waiting, speaking while a reply streams,
   error when something fails, celebrating when a task finishes. With the Vercel AI SDK, pass useChat's status to the status prop.

\`\`\`ts
${specSource(made)}\`\`\`

Full reference: https://pouryaak.github.io/wobnimo/llms.txt`;
}

/** Hands the person a file to save. */
export function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/typescript' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

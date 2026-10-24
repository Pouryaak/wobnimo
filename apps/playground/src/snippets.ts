/* The code panel: the scene the visitor has set up, written out for three
   ways of using the engine, with just enough highlighting to read. */

import type { CharacterSpec, MascotState } from '@wobnimo/engine';

export type Tab = 'html' | 'js' | 'react';

export interface Scene {
  spec: CharacterSpec;
  state: MascotState;
  material: string;
  color: string | null;
  speed: number;
  effects: boolean;
}

export function snippet(tab: Tab, scene: Scene): string {
  const { id, name } = scene.spec;
  const attrs = [`character="${id}"`, `state="${scene.state}"`];
  const options = [`state: '${scene.state}'`];
  if (scene.color) {
    attrs.push(`palette="${scene.material}:${scene.color}"`);
    options.push(`palette: { ${scene.material}: '${scene.color}' }`);
  }
  if (scene.speed !== 1) {
    attrs.push(`speed="${scene.speed}"`);
    options.push(`speed: ${scene.speed}`);
  }
  if (!scene.effects) {
    attrs.push('effects="false"');
    options.push('effects: false');
  }

  if (tab === 'html') {
    return `<!-- no build step: one tag from the CDN -->
<script type="module" src="https://cdn.jsdelivr.net/npm/wobnimo@0.1/dist/wobnimo.js"></script>

<wobnimo-mascot ${attrs.join(' ')}></wobnimo-mascot>

<script>
  // follow whatever your agent is doing
  document.querySelector('wobnimo-mascot').state = 'speaking';
</script>`;
  }
  if (tab === 'js') {
    return `// npm i wobnimo
import { mount } from 'wobnimo';
import { ${id} } from 'wobnimo/characters/${id}';

const mascot = mount(document.querySelector('#mascot'), ${id}, {
  ${options.join(',\n  ')},
});

agent.on('status', (status) => mascot.setState(status));
mascot.on('poke', () => console.log('${name} was poked'));`;
  }
  const props = [`character="${id}"`, `state="${scene.state}"`];
  if (scene.color) props.push(`palette={{ ${scene.material}: '${scene.color}' }}`);
  if (scene.speed !== 1) props.push(`speed={${scene.speed}}`);
  if (!scene.effects) props.push('effects={false}');
  return `// npm i wobnimo
import { Mascot } from 'wobnimo/react';

export function Assistant() {
  return (
    <Mascot
      ${props.join('\n      ')}
      style={{ width: 160, height: 160 }}
    />
  );
}

// chatting with the Vercel AI SDK? one prop does it all:
// const { status } = useChat();
// <Mascot character="${id}" status={status} />`;
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Colours strings and comments, and nothing else. */
export function highlight(code: string): string {
  return escape(code).replace(/(\/\/.*$)|('[^'\n]*'|"[^"\n]*")/gm, (_, comment, str) =>
    comment ? `<span class="c">${comment}</span>` : `<span class="s">${str}</span>`,
  );
}

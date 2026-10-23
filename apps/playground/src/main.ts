/* The playground: one large stage, a roster of every character, and the
   controls and code to take one home. Everything on screen runs through
   the public engine API, the same way a product would use it. */

import { Mascot, STATES, type CharacterSpec, type MascotState, type Palette } from '@wobnimo/engine';
import { characters } from '@wobnimo/characters';

declare const __ENGINE_GZIP_BYTES__: number;

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

const LABELS: Record<MascotState, string> = {
  idle: 'Idle',
  thinking: 'Thinking',
  listening: 'Listening',
  speaking: 'Speaking',
  sleeping: 'Sleeping',
};

type Tab = 'html' | 'js' | 'react';

/* everything the visitor has chosen; the stage, the roster and the snippet all follow it */
const view = {
  state: 'idle' as MascotState,
  selected: characters[0],
  color: null as string | null,
  speed: 1,
  effects: true,
  tab: 'html' as Tab,
};

/** The material the colour picker drives: the first one, which every character uses for its body. */
const mainMaterial = (spec: CharacterSpec) => Object.keys(spec.materials)[0];
const palette = (): Palette | undefined => (view.color ? { [mainMaterial(view.selected)]: view.color } : undefined);

const stage = new Mascot($<HTMLCanvasElement>('#stage-canvas'), view.selected, { seed: 0.31, state: view.state });

const roster = characters.map((spec, i) => {
  const button = document.createElement('button');
  button.className = 'tile';
  button.type = 'button';
  button.style.setProperty('--tile-accent', spec.accent);
  button.innerHTML = `<canvas aria-hidden="true"></canvas><span class="tile-name">${spec.name}</span><span class="tile-plan">${spec.tagline}</span>`;
  $('#roster').append(button);
  const mascot = new Mascot(button.querySelector('canvas')!, spec, { seed: 0.17 * (i + 1), state: view.state, maxPixelRatio: 1.5 });
  /* the click both pokes the tile's mascot and puts it on stage */
  button.addEventListener('click', () => select(spec));
  return { spec, button, mascot };
});

/* states */
const stateBar = $('#states');
for (const s of STATES) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = LABELS[s];
  b.dataset.state = s;
  b.addEventListener('click', () => setState(s));
  stateBar.append(b);
}

function setState(s: MascotState) {
  view.state = s;
  stage.setState(s);
  roster.forEach((r) => r.mascot.setState(s));
  stateBar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.state === s)));
  renderSnippet();
}

function select(spec: CharacterSpec) {
  view.selected = spec;
  view.color = null;
  stage.setSpec(spec);
  roster.forEach((r) => {
    r.button.setAttribute('aria-current', String(r.spec === spec));
    r.mascot.setPalette(undefined);
  });
  document.documentElement.style.setProperty('--accent', spec.accent);
  $('#stage-name').textContent = spec.name;
  $('#stage-plan').textContent = spec.tagline;
  renderCustom();
  renderInspector(spec);
  renderSnippet();
}

/* ---- make it yours ---- */

const colorInput = $<HTMLInputElement>('#color-input');
const speedInput = $<HTMLInputElement>('#speed-input');
const fxInput = $<HTMLInputElement>('#fx-input');

function renderCustom() {
  const material = mainMaterial(view.selected);
  colorInput.value = view.color ?? view.selected.materials[material].color;
  $('#color-name').textContent = material;
  speedInput.value = String(view.speed);
  $('#speed-out').textContent = `${view.speed.toFixed(2).replace(/0$/, '')}×`;
  fxInput.checked = view.effects;
}

function applyCustom() {
  const p = palette();
  stage.setPalette(p);
  roster.find((r) => r.spec === view.selected)?.mascot.setPalette(p);
  for (const m of [stage, ...roster.map((r) => r.mascot)]) {
    m.setSpeed(view.speed);
    m.setEffects(view.effects);
  }
  renderCustom();
  renderSnippet();
}

colorInput.addEventListener('input', () => {
  view.color = colorInput.value;
  applyCustom();
});
speedInput.addEventListener('input', () => {
  view.speed = Number(speedInput.value);
  applyCustom();
});
fxInput.addEventListener('change', () => {
  view.effects = fxInput.checked;
  applyCustom();
});
$('#reset-custom').addEventListener('click', () => {
  Object.assign(view, { color: null, speed: 1, effects: true });
  applyCustom();
});

/* ---- use it ---- */

function snippet(tab: Tab): string {
  const { id } = view.selected;
  const p = palette();
  const material = mainMaterial(view.selected);
  const attrs = [`character="${id}"`, `state="${view.state}"`];
  const options = [`state: '${view.state}'`];
  if (p) {
    attrs.push(`palette="${material}:${view.color}"`);
    options.push(`palette: { ${material}: '${view.color}' }`);
  }
  if (view.speed !== 1) {
    attrs.push(`speed="${view.speed}"`);
    options.push(`speed: ${view.speed}`);
  }
  if (!view.effects) {
    attrs.push('effects="false"');
    options.push('effects: false');
  }
  const name = view.selected.name;

  if (tab === 'html') {
    return `<script type="module">
  import { defineWobnimoElement } from '@wobnimo/characters';
  defineWobnimoElement();
</script>

<wobnimo-mascot ${attrs.join(' ')}></wobnimo-mascot>

<script>
  // set state from whatever your agent is doing
  document.querySelector('wobnimo-mascot').state = 'speaking';
</script>`;
  }
  if (tab === 'js') {
    return `import { mount } from '@wobnimo/engine';
import { ${id} } from '@wobnimo/characters';

const mascot = mount(document.querySelector('#mascot'), ${id}, {
  ${options.join(',\n  ')},
});

agent.on('status', (status) => mascot.setState(status));
mascot.on('poke', () => console.log('${name} was poked'));`;
  }
  const opts = options.filter((o) => !o.startsWith('state'));
  return `import { useEffect, useRef } from 'react';
import { mount } from '@wobnimo/engine';
import { ${id} } from '@wobnimo/characters';

export function ${name}({ state = '${view.state}' }) {
  const host = useRef(null);
  const mascot = useRef(null);

  useEffect(() => {
    mascot.current = mount(host.current, ${id}${opts.length ? `, { ${opts.join(', ')} }` : ''});
    return () => mascot.current.dispose();
  }, []);

  useEffect(() => mascot.current?.setState(state), [state]);

  return <div ref={host} style={{ width: 160, height: 160 }} />;
}`;
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* just enough colour to read: strings and comments */
function highlight(code: string): string {
  return escape(code).replace(/(\/\/.*$)|('[^'\n]*'|"[^"\n]*")/gm, (_, comment, str) =>
    comment ? `<span class="c">${comment}</span>` : `<span class="s">${str}</span>`,
  );
}

function renderSnippet() {
  $('#snippet').innerHTML = highlight(snippet(view.tab));
  for (const tab of ['html', 'js', 'react'] as const) $(`#tab-${tab}`).setAttribute('aria-selected', String(tab === view.tab));
}

for (const tab of ['html', 'js', 'react'] as const) {
  $(`#tab-${tab}`).addEventListener('click', () => {
    view.tab = tab;
    renderSnippet();
  });
}

/* ---- the spec ---- */

async function gzipBytes(text: string): Promise<number | null> {
  if (typeof CompressionStream === 'undefined') return null;
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  return (await new Response(stream).arrayBuffer()).byteLength;
}

const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;

/* number arrays on one line, so the spec reads like a table */
function prettySpec(spec: CharacterSpec): string {
  return JSON.stringify(spec, null, 2).replace(/\[\s+([-\d.,\s"a-z]*?)\s+\]/gi, (_, inner: string) => `[${inner.replace(/\s+/g, ' ')}]`);
}

async function renderInspector(spec: CharacterSpec) {
  const s = stage.stats;
  const json = JSON.stringify(spec);
  $('#spec').textContent = prettySpec(spec);
  $('#stat-parts').textContent = String(s.parts);
  $('#stat-bones').textContent = String(s.bones);
  $('#stat-lines').textContent = String(s.shaderLines);
  $('#stat-spec').textContent = '…';
  const gz = await gzipBytes(json);
  if (view.selected === spec) $('#stat-spec').textContent = gz ? kb(gz) : kb(json.length);
}

/** Copies text, falling back to selecting `source` where the clipboard is off limits. */
function copyButton(button: HTMLButtonElement, text: () => string, source: HTMLElement) {
  const label = button.textContent;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text());
      button.textContent = 'Copied';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(source);
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(range);
      button.textContent = 'Selected';
    }
    setTimeout(() => (button.textContent = label), 1600);
  });
}

copyButton($('#copy-snippet'), () => snippet(view.tab), $('#snippet'));
copyButton($('#copy-spec'), () => JSON.stringify(view.selected, null, 2), $('#spec'));

$('#engine-size').textContent = kb(__ENGINE_GZIP_BYTES__);

select(view.selected);
setState(view.state);

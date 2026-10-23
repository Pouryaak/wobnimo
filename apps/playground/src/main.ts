/* The playground: one large stage, a roster of every character, and the
   spec of whichever is on stage. Everything on screen runs through the
   public engine API, the same way a product would use it. */

import { Mascot, STATES, type CharacterSpec, type MascotState } from '@animo/engine';
import { characters } from '@animo/characters';

declare const __ENGINE_GZIP_BYTES__: number;

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

const LABELS: Record<MascotState, string> = {
  idle: 'Idle',
  thinking: 'Thinking',
  listening: 'Listening',
  speaking: 'Speaking',
  sleeping: 'Sleeping',
};

let state: MascotState = 'idle';
let selected = characters[0];

const stage = new Mascot($<HTMLCanvasElement>('#stage-canvas'), selected, { seed: 0.31, state });
const roster = characters.map((spec, i) => {
  const button = document.createElement('button');
  button.className = 'tile';
  button.type = 'button';
  button.style.setProperty('--tile-accent', spec.accent);
  button.innerHTML = `<canvas aria-hidden="true"></canvas><span class="tile-name">${spec.name}</span><span class="tile-plan">${spec.tagline}</span>`;
  $('#roster').append(button);
  const mascot = new Mascot(button.querySelector('canvas')!, spec, { seed: 0.17 * (i + 1), state, interactive: true, maxPixelRatio: 1.5 });
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
  b.setAttribute('aria-pressed', String(s === state));
  b.addEventListener('click', () => setState(s));
  stateBar.append(b);
}

function setState(s: MascotState) {
  state = s;
  stage.setState(s);
  roster.forEach((r) => r.mascot.setState(s));
  stateBar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.state === s)));
  $('#snippet-state').textContent = `'${s}'`;
  renderSleep();
}

function select(spec: CharacterSpec) {
  selected = spec;
  stage.setSpec(spec);
  document.documentElement.style.setProperty('--accent', spec.accent);
  roster.forEach((r) => r.button.setAttribute('aria-current', String(r.spec === spec)));
  $('#stage-name').textContent = spec.name;
  $('#stage-plan').textContent = spec.tagline;
  $('#snippet-name').textContent = spec.id;
  renderInspector(spec);
  renderSleep();
}

/* z's drift up from characters that have no screen to show them on */
function renderSleep() {
  $('#zz').hidden = !(state === 'sleeping' && selected.face?.kind !== 'screen');
}

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
  if (selected === spec) $('#stat-spec').textContent = gz ? kb(gz) : kb(json.length);
}

$('#engine-size').textContent = kb(__ENGINE_GZIP_BYTES__);

$('#copy-spec').addEventListener('click', async (e) => {
  const button = e.currentTarget as HTMLButtonElement;
  try {
    await navigator.clipboard.writeText(JSON.stringify(selected, null, 2));
    button.textContent = 'Copied';
  } catch {
    const range = document.createRange();
    range.selectNodeContents($('#spec'));
    getSelection()?.removeAllRanges();
    getSelection()?.addRange(range);
    button.textContent = 'Selected';
  }
  setTimeout(() => (button.textContent = 'Copy spec'), 1600);
});

select(selected);
setState(state);

/* The Wobnimo site: an opening scene, the cast on a strip of film, a sound
   stage to direct one character on, the install steps, and the numbers.
   Every mascot on the page goes through the public engine API, exactly as
   a product would use it. */

import { STATES, compileCached, type CharacterSpec, type MascotState, type Palette } from '@wobnimo/engine';
import { characters } from '@wobnimo/characters';
import { Pool, type Slot } from './pool';
import { playScene } from './scene';
import { highlight, snippet, type Scene, type Tab } from './snippets';

declare const __ENGINE_GZIP_BYTES__: number;

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const byId = (id: string) => characters.find((c) => c.id === id)!;
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;

const LABELS: Record<MascotState, string> = {
  idle: 'Idle',
  thinking: 'Thinking',
  listening: 'Listening',
  speaking: 'Speaking',
  sleeping: 'Sleeping',
  working: 'Working',
  error: 'Error',
  surprised: 'Surprised',
  celebrating: 'Celebrating',
  sad: 'Sad',
};

/** When an app or agent would use each state. */
const WHEN: Record<MascotState, string> = {
  idle: 'Waiting for the user',
  thinking: 'Planning, before it answers',
  listening: 'The user is talking or typing',
  speaking: 'Streaming a reply',
  sleeping: 'Nothing has happened for a while',
  working: 'Running a tool, a build or a long task',
  error: 'Something failed',
  surprised: 'Something unexpected arrived',
  celebrating: 'A task finished, the tests passed',
  sad: 'It could not help, or the user is unhappy',
};

const SURFACES: Record<string, string> = { fur: 'Fur', scales: 'Scales', speckle: 'Speckled', ripple: 'Rippled' };

/* every mascot on the page shares one budget of live WebGL contexts */
const pool = new Pool(11);

/* frames per second, measured, for the viewfinder and the live meter */
let fps = 60;
{
  let last = performance.now();
  const sample = (now: number) => {
    const dt = now - last;
    last = now;
    if (dt > 0 && dt < 250) fps += (1000 / dt - fps) * 0.05;
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
}

/* ---- opening scene ---- */

const actors = new Map<string, Slot>();
document.querySelectorAll<HTMLElement>('[data-actor]').forEach((host, i) => {
  const spec = byId(host.dataset.actor!);
  host.style.setProperty('--pool', spec.accent);
  actors.set(spec.id, pool.add(host, spec, { seed: 0.21 + i * 0.29, framing: 1.02 }));
});
playScene($('.viewfinder'), actors, () => fps);

/* ---- the studio ---- */

const view = {
  state: 'idle' as MascotState,
  selected: byId('microduck'),
  color: null as string | null,
  speed: 1,
  effects: true,
  tab: 'html' as Tab,
};

/** The material the colour picker drives: the first one, which is each character's main body. */
const mainMaterial = (spec: CharacterSpec) => Object.keys(spec.materials)[0];
const palette = (): Palette | undefined => (view.color ? { [mainMaterial(view.selected)]: view.color } : undefined);
const scene = (): Scene => ({ spec: view.selected, state: view.state, material: mainMaterial(view.selected), color: view.color, speed: view.speed, effects: view.effects });

const stage = pool.add($('#stage'), view.selected, { seed: 0.31, framing: 1.18, pinned: true });

/* ---- the cast, on film ---- */

const strip = $('#filmstrip');
const frames = characters.map((spec, i) => {
  const { parts, bones } = compileCached(spec).stats;
  const surfaces = [...new Set(Object.values(spec.materials).flatMap((m) => (m.surface ? [SURFACES[m.surface.kind]] : [])))];
  const chips = [...surfaces, `${parts} parts`, `${bones} bones`];
  const frame = document.createElement('button');
  frame.type = 'button';
  frame.className = 'frame';
  frame.style.setProperty('--frame-accent', spec.accent);
  frame.innerHTML = `
    <span class="frame-shot"><span class="slot-host"></span><span class="frame-code">WBN ${String(i + 1).padStart(2, '0')}</span></span>
    <span class="frame-body">
      <span class="frame-name">${spec.name}</span>
      <span class="frame-plan">${spec.tagline}</span>
      <span class="chips">${chips.map((c) => `<span class="chip">${c}</span>`).join('')}</span>
    </span>`;
  strip.append(frame);
  const slot = pool.add(frame.querySelector('.slot-host')!, spec, { seed: 0.13 * (i + 1), framing: 1.12, maxPixelRatio: 1.5 });
  /* a frame perks up when you point at it, and puts its character on stage when picked */
  frame.addEventListener('pointerenter', () => slot.setState('listening'));
  frame.addEventListener('pointerleave', () => slot.setState('idle'));
  frame.addEventListener('click', () => {
    select(spec);
    $('#studio').scrollIntoView();
  });
  return { spec, frame };
});

/* ---- character picker and states ---- */

const picker = $('#picker');
const chips = characters.map((spec) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = spec.name;
  b.style.setProperty('--dot', spec.accent);
  b.addEventListener('click', () => select(spec));
  picker.append(b);
  return { spec, b };
});

const clapper = $('#states');
for (const s of STATES) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = LABELS[s];
  b.dataset.state = s;
  b.addEventListener('click', () => setState(s));
  clapper.append(b);
}

$('#state-table').innerHTML = STATES.map((s) => `<tr data-state="${s}"><td><code>${s}</code></td><td>${WHEN[s]}</td></tr>`).join('');
$('#state-table').addEventListener('click', (e) => {
  const row = (e.target as HTMLElement).closest<HTMLElement>('tr[data-state]');
  if (!row) return;
  setState(row.dataset.state as MascotState);
  $('#studio').scrollIntoView();
});

function setState(s: MascotState) {
  view.state = s;
  stage.setState(s);
  clapper.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.state === s)));
  renderSnippet();
}

function select(spec: CharacterSpec) {
  view.selected = spec;
  view.color = null;
  stage.setSpec(spec);
  stage.setState(view.state);
  chips.forEach((c) => c.b.setAttribute('aria-pressed', String(c.spec === spec)));
  frames.forEach((f) => f.frame.setAttribute('aria-current', String(f.spec === spec)));
  $('.studio').style.setProperty('--gel', spec.accent);
  $('#stage-name').textContent = spec.name;
  $('#stage-plan').textContent = spec.tagline;
  renderCustom();
  renderSpec(spec);
  renderSnippet();
}

/* ---- make it yours ---- */

const colorInput = $<HTMLInputElement>('#color-input');
const speedInput = $<HTMLInputElement>('#speed-input');
const fxInput = $<HTMLInputElement>('#fx-input');

function renderCustom() {
  const material = mainMaterial(view.selected);
  colorInput.value = view.color ?? view.selected.materials[material].color;
  $('#color-hex').textContent = colorInput.value;
  $('#color-name').textContent = material;
  speedInput.value = String(view.speed);
  $('#speed-out').textContent = `${view.speed.toFixed(2).replace(/\.?0+$/, '')}×`;
  fxInput.checked = view.effects;
}

function applyCustom() {
  stage.setPalette(palette());
  stage.setSpeed(view.speed);
  stage.setEffects(view.effects);
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

/* ---- code ---- */

function renderSnippet() {
  $('#snippet').innerHTML = highlight(snippet(view.tab, scene()));
  for (const tab of ['html', 'js', 'react'] as const) $(`#tab-${tab}`).setAttribute('aria-selected', String(tab === view.tab));
}

for (const tab of ['html', 'js', 'react'] as const) {
  $(`#tab-${tab}`).addEventListener('click', () => {
    view.tab = tab;
    renderSnippet();
  });
}

async function gzipBytes(text: string): Promise<number> {
  if (typeof CompressionStream === 'undefined') return text.length;
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  return (await new Response(stream).arrayBuffer()).byteLength;
}

/* number arrays on one line, so the spec reads like a table */
function prettySpec(spec: CharacterSpec): string {
  return JSON.stringify(spec, null, 2).replace(/\[\s+([-\d.,\s"a-z]*?)\s+\]/gi, (_, inner: string) => `[${inner.replace(/\s+/g, ' ')}]`);
}

async function renderSpec(spec: CharacterSpec) {
  const { parts, bones, shaderLines } = compileCached(spec).stats;
  $('#spec').textContent = prettySpec(spec);
  $('#stat-parts').textContent = String(parts);
  $('#stat-bones').textContent = String(bones);
  $('#stat-lines').textContent = String(shaderLines);
  const gz = await gzipBytes(JSON.stringify(spec));
  if (view.selected === spec) $('#stat-spec').textContent = `${kb(gz)} gzipped`;
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

copyButton($('#copy-snippet'), () => snippet(view.tab, scene()), $('#snippet'));
copyButton($('#copy-spec'), () => JSON.stringify(view.selected, null, 2), $('#spec'));
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((b) => {
  const source = $(`#${b.dataset.copy}`);
  copyButton(b, () => source.textContent ?? '', source);
});

/* ---- supporting cast around the page ---- */

pool.add($('#desk-buddy'), byId('rex'), { seed: 0.58, state: 'working', framing: 1.05 });
pool.add($('#footer-cloud'), byId('nimbus'), { seed: 0.77, state: 'sleeping', framing: 1.05 });

/* ---- size and speed ---- */

document.querySelectorAll('.engine-size').forEach((el) => (el.textContent = kb(__ENGINE_GZIP_BYTES__)));

(async () => {
  const sizes = await Promise.all(characters.map(async (spec) => ({ spec, bytes: await gzipBytes(JSON.stringify(spec)) })));
  sizes.sort((a, b) => a.bytes - b.bytes);
  const total = await gzipBytes(JSON.stringify(characters));
  const average = sizes.reduce((sum, s) => sum + s.bytes, 0) / sizes.length;
  $('#spec-average').textContent = kb(average);

  const smallest = sizes[0];
  const largest = sizes[sizes.length - 1];
  const rows: Array<[string, number, string]> = [
    ['Engine runtime', __ENGINE_GZIP_BYTES__, 'var(--ink)'],
    ['All eleven characters', total, 'var(--brand)'],
    [`Largest: ${largest.spec.name}`, largest.bytes, largest.spec.accent],
    [`Smallest: ${smallest.spec.name}`, smallest.bytes, smallest.spec.accent],
  ];
  const max = Math.max(...rows.map((r) => r[1]));
  $('#bars').innerHTML = rows
    .map(
      ([label, bytes, color]) =>
        `<div class="bar"><span>${label}</span><span class="track"><span class="fill" style="--w:${((bytes / max) * 100).toFixed(1)}%;--bar:${color}"></span></span><span class="bar-value tabular">${kb(bytes)}</span></div>`,
    )
    .join('');
})();

setInterval(() => {
  const n = pool.running;
  $('#live-count').textContent = `${n} live ${n === 1 ? 'mascot' : 'mascots'}`;
  $('#live-fps').textContent = `${Math.round(fps)} fps`;
}, 500);

select(view.selected);
setState(view.state);

/* The Wobnimo site. The opening scene, the studio, the code and the cast
   all go through the public engine API, exactly as a product would.

   First impressions are the point of the page, so the work is ordered:
   the opening scene starts at once, everything else waits until the
   browser is idle or until it scrolls near the screen. A shader build is
   the most expensive thing the engine does, so the page builds only the
   ones it shows live: the stills (avatars and cast posters) are images
   rendered at build time (npm run posters), and a studio character's
   shader starts building when its avatar is hovered. All of it shares one
   WebGL context, and each character's shader is built once. */

import { Mascot, STATES, isSupported, warm, type CharacterSpec, type MascotState, type Palette } from '@wobnimo/engine';
import { characters } from '@wobnimo/characters';
import { PROMPTS, startForge } from './forge';
import { highlight, snippet, type Scene, type Tab } from './snippets';
import { stillUrl } from './shared/assets';
import { agentPrompt, describePrompt } from './shared/prompts';
import { copyText, showStars } from './shared/ui';

declare const __ENGINE_GZIP_BYTES__: number;
declare const __SPEC_GZIP_BYTES__: number;

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const byId = (id: string) => characters.find((c) => c.id === id)!;
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;

async function copyAgent(spec: CharacterSpec, state: MascotState, msg: string, colors?: Palette) {
  await copyText(agentPrompt(spec, state, colors), msg);
}

/** Runs `fn` once, when `el` comes within a screen or so of the viewport. */
function whenNear(el: Element, fn: () => void) {
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      fn();
    },
    { rootMargin: '400px 0px' },
  );
  io.observe(el);
}

/* without WebGL2 (switched off on some locked-down devices) the page shows every character as its still */
const animated = isSupported();

/** A character's pre-rendered still, which fades in once it has loaded. */
function still(spec: CharacterSpec, kind: 'poster' | 'face', size: number) {
  const img = new Image(size, size);
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.addEventListener('load', () => img.classList.add('is-ready'), { once: true });
  img.src = stillUrl(spec, kind);
  return img;
}

/** Puts `spec`'s still in `host` in place of a live mascot, or swaps the one already there. */
function standIn(host: HTMLElement, spec: CharacterSpec) {
  const img = host.querySelector('img') ?? host.appendChild(new Image());
  img.alt = spec.name;
  img.src = stillUrl(spec);
  host.classList.add('is-ready');
}

/** A live mascot in `host`, which fades in once its first frame is drawn; a still where WebGL2 is off. */
function live(host: HTMLElement, spec: CharacterSpec, options: ConstructorParameters<typeof Mascot>[2] = {}) {
  if (!animated) return standIn(host, spec), null;
  const canvas = document.createElement('canvas');
  host.append(canvas);
  const mascot = new Mascot(canvas, spec, options);
  mascot.on('ready', () => host.classList.add('is-ready'));
  return mascot;
}

/* ---- opening scene ---- */

const actors = [...document.querySelectorAll<HTMLElement>('[data-actor]')];
actors.forEach((host, i) => {
  host.style.setProperty('--i', String(i));
  live(host, byId(host.dataset.actor!), {
    state: (host.dataset.state as MascotState) ?? 'idle',
    seed: 0.21 + i * 0.29,
    maxPixelRatio: host.classList.contains('lead') ? 1.25 : 1.5,
    effects: host.dataset.effects !== 'false',
    /* they stand on the lettering, not on a floor */
    floor: 0,
  });
});

document.querySelectorAll('.engine-size').forEach((el) => (el.textContent = kb(__ENGINE_GZIP_BYTES__)));
{
  /* the giant number splits around the dot, where Volt hops */
  const [whole, tenths] = kb(__ENGINE_GZIP_BYTES__).split('.');
  $('#kb-int').textContent = `${whole}.`;
  $('#kb-rest').textContent = tenths;
}

/* ---- the studio ---- */

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

/** Colours to try on each character's main material; the first swatch is its own. */
const SWATCHES = ['#ff5d8f', '#4f7cff', '#ffb021', '#2fcf8f', '#a774ff'];

/** How long the timeline holds each state, in seconds. */
const BEAT = 2.4;

const view = {
  spec: byId('mochi'),
  state: 'idle' as MascotState,
  color: null as string | null,
  tab: 'react' as Tab,
};

/** The material the swatches drive: the first one, which is each character's main body. */
const mainMaterial = (spec: CharacterSpec) => Object.keys(spec.materials)[0];
const palette = (): Palette | undefined => (view.color ? { [mainMaterial(view.spec)]: view.color } : undefined);
const scene = (): Scene => ({ spec: view.spec, state: view.state, material: mainMaterial(view.spec), color: view.color, speed: 1, effects: true });

let stage: Mascot | null = null;
whenNear($('#studio'), () => {
  stage = live($('#stage'), view.spec, { state: view.state, palette: palette(), seed: 0.31, framing: 1.05, maxPixelRatio: 1.5 });
});

const stateList = $('#states');
const stateButtons = STATES.map((s) => {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = LABELS[s];
  b.addEventListener('click', () => {
    stop();
    setState(s);
  });
  li.append(b);
  stateList.append(li);
  return b;
});

const avatarRow = $('#avatars');
const avatars = characters.map((spec) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'avatar';
  b.innerHTML = `<span class="avatar-face"></span>${spec.name}`;
  b.querySelector('.avatar-face')!.append(still(spec, 'face', 68));
  b.addEventListener('click', () => select(spec));
  /* a pause on an avatar is a likely click: start building its shader, so the stage changes at once */
  let intent = 0;
  const warmUp = () => animated && (intent = window.setTimeout(() => warm(spec), 120));
  b.addEventListener('pointerenter', warmUp);
  b.addEventListener('focus', warmUp);
  b.addEventListener('pointerleave', () => clearTimeout(intent));
  b.addEventListener('blur', () => clearTimeout(intent));
  avatarRow.append(b);
  return b;
});

/* the last seat in the row is for a character of your own */
{
  const own = document.createElement('a');
  own.className = 'avatar avatar-own';
  own.href = 'studio/';
  own.innerHTML = '<span class="avatar-face" aria-hidden="true">+</span>Yours';
  avatarRow.append(own);
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

/** Scrolls `row` so `item` sits in its middle, without moving the page. Positions
    are measured on screen, so padding, buttons and offset parents can't skew it. */
function centreInRow(row: HTMLElement, item: HTMLElement) {
  const r = row.getBoundingClientRect();
  const i = item.getBoundingClientRect();
  row.scrollTo({ left: row.scrollLeft + i.left - r.left - (r.width - i.width) / 2, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
}

const step = (by: number) => select(characters[(characters.indexOf(view.spec) + by + characters.length) % characters.length]);
$('#cast-prev').addEventListener('click', () => step(-1));
$('#cast-next').addEventListener('click', () => step(1));

const swatchRow = $('#swatches');
function renderSwatches() {
  const own = view.spec.materials[mainMaterial(view.spec)].color;
  $('#material-name').textContent = mainMaterial(view.spec);
  swatchRow.replaceChildren(
    ...[null, ...SWATCHES].map((color) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.style.setProperty('--c', color ?? own);
      b.setAttribute('aria-label', color ? `Recolour to ${color}` : `${view.spec.name}'s own colour`);
      b.setAttribute('aria-pressed', String(color === view.color));
      b.addEventListener('click', () => {
        view.color = color;
        stage?.setPalette(palette());
        renderSwatches();
        renderSnippet();
        renderGrab();
      });
      return b;
    }),
  );
}

function setState(s: MascotState) {
  view.state = s;
  stage?.setState(s);
  const at = STATES.indexOf(s);
  stateButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === at)));
  ticks.forEach((t, i) => t.classList.toggle('on', i === at * 4));
  $('#track-now').textContent = LABELS[s];
  renderGrab();
  if (!playing) movePlayhead(at / STATES.length);
  renderSnippet();
}

function select(spec: CharacterSpec, centre = true) {
  view.spec = spec;
  view.color = null;
  if (stage) stage.setSpec(spec);
  else if (!animated && $('#stage').childElementCount) standIn($('#stage'), spec);
  const at = characters.indexOf(spec);
  avatars.forEach((b, i) => b.setAttribute('aria-pressed', String(i === at)));
  if (centre) centreInRow(avatarRow, avatars[at]);
  renderSwatches();
  renderSnippet();
  renderGrab();
}

/** The studio's copy button says exactly what it will hand over. */
function renderGrab() {
  $('#agent-copy-what').textContent = `${view.spec.name} · ${LABELS[view.state].toLowerCase()}${view.color ? ' · your colour' : ''}`;
}

/* ---- the timeline: plays through every state in turn ---- */

const track = $('#track-now').closest<HTMLElement>('.track')!;
const playhead = $('#playhead');
const ticks = Array.from({ length: STATES.length * 4 + 1 }, (_, i) => {
  const t = document.createElement('span');
  if (i % 4 === 0) t.className = 'major';
  t.style.left = `${(i / (STATES.length * 4)) * 100}%`;
  $('#ticks').append(t);
  return t;
});
$('#track-end').textContent = `${(STATES.length * BEAT).toFixed(1)}s`;

let playing = false;
let playStart = 0;

function movePlayhead(progress: number) {
  playhead.style.transform = `translateX(${progress * track.clientWidth}px)`;
}

function frame(now: number) {
  if (!playing) return;
  const total = STATES.length * BEAT * 1000;
  const progress = ((now - playStart) % total) / total;
  movePlayhead(progress);
  const s = STATES[Math.floor(progress * STATES.length)];
  if (s !== view.state) setState(s);
  requestAnimationFrame(frame);
}

function play(from = STATES.indexOf(view.state)) {
  playing = true;
  playStart = performance.now() - from * BEAT * 1000;
  $('#play').setAttribute('aria-pressed', 'true');
  $('#play-icon').setAttribute('d', 'M6 4.5h3v11H6zM11 4.5h3v11h-3z');
  requestAnimationFrame(frame);
}

function stop() {
  if (!playing) return;
  playing = false;
  $('#play').setAttribute('aria-pressed', 'false');
  $('#play-icon').setAttribute('d', 'M7 4.5v11l9-5.5z');
  movePlayhead(STATES.indexOf(view.state) / STATES.length);
}

$('#play').addEventListener('click', () => (playing ? stop() : play()));
track.addEventListener('click', (e) => {
  const at = Math.min(STATES.length - 1, Math.floor(((e.clientX - track.getBoundingClientRect().left) / track.clientWidth) * STATES.length));
  setState(STATES[Math.max(0, at)]);
  if (playing) play(at);
});
addEventListener('resize', () => playing || movePlayhead(STATES.indexOf(view.state) / STATES.length));

/* ---- code ---- */

const TABS: Tab[] = ['react', 'js', 'html'];

function renderSnippet() {
  const code = highlight(snippet(view.tab, scene()));
  $('#snippet').innerHTML = code
    .split('\n')
    .map((line) => `<span class="ln">${line || ' '}</span>`)
    .join('');
  for (const tab of TABS) $(`#tab-${tab}`).setAttribute('aria-selected', String(tab === view.tab));
}

for (const tab of TABS) {
  $(`#tab-${tab}`).addEventListener('click', () => {
    view.tab = tab;
    renderSnippet();
  });
}

const copy = $<HTMLButtonElement>('#copy');
copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(snippet(view.tab, scene()));
    copy.classList.add('done');
    copy.setAttribute('aria-label', 'Copied');
  } catch {
    /* the clipboard can be off limits in frames: select the code instead */
    getSelection()?.selectAllChildren($('#snippet'));
  }
  setTimeout(() => {
    copy.classList.remove('done');
    copy.setAttribute('aria-label', 'Copy code');
  }, 1600);
});

/* ---- the cast ---- */

const castGrid = $('#cast-grid');
characters.forEach((spec) => {
  const li = document.createElement('li');
  const said = PROMPTS[spec.id] ? `<span class="said">“${PROMPTS[spec.id]}”</span>` : '';
  li.innerHTML = `<div class="cast-card"><button type="button" class="cast-open"><span class="poster"></span><h3>${spec.name}</h3><p>${spec.tagline}</p>${said}</button><button type="button" class="cast-copy mono" aria-label="Copy a setup prompt for ${spec.name} for your AI agent">Copy for agent</button></div>`;
  li.querySelector('.cast-open')!.addEventListener('click', () => {
    select(spec);
    $('#studio').scrollIntoView();
  });
  li.querySelector('.cast-copy')!.addEventListener('click', () => copyAgent(spec, 'idle', `${spec.name} setup prompt copied — paste it into your agent`));
  li.querySelector('.poster')!.append(still(spec, 'poster', 240));
  castGrid.append(li);
});

$('#spec-average').textContent = `~${kb(__SPEC_GZIP_BYTES__)}`;

/* the studio's agent button follows whatever character and state are on stage */
$('#agent-copy').addEventListener('click', () =>
  copyAgent(view.spec, view.state, `${view.spec.name} (${LABELS[view.state].toLowerCase()}) setup prompt copied — paste it into your agent`, palette()),
);

/* the developers callout hands over a generic prompt for the default character */
$('#dev-agent-copy').addEventListener('click', () => copyAgent(byId('mochi'), 'thinking', 'Setup prompt copied — paste it into your agent'));

/* ---- make your own ---- */

whenNear($('#describe'), () =>
  startForge(characters, { section: $('#describe'), stage: $('#forge-stage'), log: $('#forge-log'), status: $('#forge-status'), chips: $('#forge-chips') }, stillUrl),
);

$('#skill-copy').addEventListener('click', () => copyText('npx wobnimo skill', 'Copied — run it in your project'));
$<HTMLFormElement>('#describe-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $<HTMLInputElement>('#describe-input');
  copyText(describePrompt(input.value || input.placeholder), 'Prompt copied — paste it into your agent');
});

/* ---- GitHub stars in the nav ---- */

showStars();

/* the first pick is already in view; scrolling the row now would also end the page's LCP measurement */
select(view.spec, false);
setState(view.state);

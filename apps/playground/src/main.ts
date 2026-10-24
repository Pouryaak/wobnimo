/* The Wobnimo site. The opening scene, the studio, the code and the cast
   all go through the public engine API, exactly as a product would.

   First impressions are the point of the page, so the work is ordered:
   the opening scene starts at once, everything else waits until the
   browser is idle or until it scrolls near the screen, and the stills
   (avatars and cast posters) are drawn once and never animate. All of it
   shares one WebGL context, and each character's shader is built once. */

import { Mascot, STATES, snapshot, type CharacterSpec, type MascotState, type Palette } from '@wobnimo/engine';
import { characters } from '@wobnimo/characters';
import { highlight, snippet, type Scene, type Tab } from './snippets';

declare const __ENGINE_GZIP_BYTES__: number;

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const byId = (id: string) => characters.find((c) => c.id === id)!;
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;

/* ---- copy for agent ----
   One self-contained prompt a person can paste into any coding agent
   (Claude Code, Cursor, Copilot, v0…) to have it install and wire up a
   mascot. It names the chosen character and state so the paste lands
   exactly where the person was looking. */
function agentPrompt(spec: CharacterSpec, state: MascotState): string {
  return `Add a Wobnimo mascot to this app.

Wobnimo (npm: "wobnimo") is a tiny web animation engine with ten ready-made mascots and ten emotional states. Set it up:

1. Install it: npm i wobnimo
2. Render the "${spec.id}" character where the user or assistant lives, 96–160px square.
   - React / Next.js (add "use client" in app-router files):
       import { Mascot } from 'wobnimo/react';
       <Mascot character="${spec.id}" state="${state}" style={{ width: 128, height: 128 }} />
   - Anything else (Vue, Svelte, plain HTML) — register the element once (import 'wobnimo/element'), then:
       <wobnimo-mascot character="${spec.id}" state="${state}"></wobnimo-mascot>
3. Drive the state from what the app is actually doing — don't leave it stuck on idle. The ten states:
   idle (waiting for the user), listening (user is typing), thinking (request sent, no reply yet),
   speaking (reply streaming in), working (running a tool or long task), error (something failed),
   celebrating (a task finished), surprised (unexpected event), sad (couldn't help), sleeping (idle a while).
   If this is a chat UI on the Vercel AI SDK, it's one prop:
       const { status } = useChat();
       <Mascot character="${spec.id}" status={status} />
   …and the mascot thinks, speaks, celebrates and errors on its own.
4. Verify: run the app and confirm the mascot renders and changes state during one chat turn.

Full reference: https://pouryaak.github.io/wobnimo/llms.txt`;
}

let toastTimer: number | undefined;
function toast(msg: string) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove('show'), 2600);
}

async function copyAgent(spec: CharacterSpec, state: MascotState, msg: string) {
  const text = agentPrompt(spec, state);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* the clipboard can be off limits in frames: fall back to a hidden textarea */
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } finally {
      ta.remove();
    }
  }
  toast(msg);
}

/** Runs `fn` when the browser has a moment, or soon anyway. */
const idle = (fn: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));

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

/** A live mascot in `host`, which fades in once its first frame is drawn. */
function live(host: HTMLElement, spec: CharacterSpec, options: ConstructorParameters<typeof Mascot>[2] = {}) {
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
  b.addEventListener('click', () => select(spec));
  avatarRow.append(b);
  return b;
});

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
  if (!playing) movePlayhead(at / STATES.length);
  renderSnippet();
}

function select(spec: CharacterSpec) {
  view.spec = spec;
  view.color = null;
  stage?.setSpec(spec);
  const at = characters.indexOf(spec);
  avatars.forEach((b, i) => b.setAttribute('aria-pressed', String(i === at)));
  /* keep the picked avatar in view without moving the page */
  const b = avatars[at];
  avatarRow.scrollTo({ left: b.offsetLeft - (avatarRow.clientWidth - b.offsetWidth) / 2, behavior: 'smooth' });
  renderSwatches();
  renderSnippet();
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
const posters = characters.map((spec) => {
  const li = document.createElement('li');
  li.innerHTML = `<div class="cast-card"><button type="button" class="cast-open"><span class="poster"></span><h3>${spec.name}</h3><p>${spec.tagline}</p></button><button type="button" class="cast-copy mono" aria-label="Copy a setup prompt for ${spec.name} for your AI agent">Copy for agent</button></div>`;
  li.querySelector('.cast-open')!.addEventListener('click', () => {
    select(spec);
    $('#studio').scrollIntoView();
  });
  li.querySelector('.cast-copy')!.addEventListener('click', () => copyAgent(spec, 'idle', `${spec.name} setup prompt copied — paste it into your agent`));
  castGrid.append(li);
  return li.querySelector<HTMLElement>('.poster')!;
});

async function gzipBytes(text: string): Promise<number> {
  if (typeof CompressionStream === 'undefined') return text.length;
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  return (await new Response(stream).arrayBuffer()).byteLength;
}

idle(async () => {
  const sizes = await Promise.all(characters.map((spec) => gzipBytes(JSON.stringify(spec))));
  $('#spec-average').textContent = `~${kb(sizes.reduce((a, b) => a + b, 0) / sizes.length)}`;
});

/* Stills for the avatars and the cast, one character at a time, once the
   opening scene is up: each is drawn once, then the avatar reuses it. */
async function drawStills() {
  for (const [i, spec] of characters.entries()) {
    const still = await snapshot(spec, { size: 240, pixelRatio: Math.min(devicePixelRatio || 1, 2), seed: 0.4 + i * 0.07, framing: 1.04 });
    still.classList.add('is-ready');
    posters[i].append(still);

    const face = document.createElement('canvas');
    face.width = face.height = 136;
    face.getContext('2d')!.drawImage(still, 0, 0, face.width, face.height);
    face.className = 'is-ready';
    avatars[i].querySelector('.avatar-face')!.append(face);
    await new Promise((resolve) => idle(() => resolve(null)));
  }
}

let stillsStarted = false;
const startStills = () => {
  if (stillsStarted) return;
  stillsStarted = true;
  idle(drawStills);
};
/* start as soon as the opening scene is on screen, or straight away when it has no live actors */
if (actors.length) {
  let waiting = actors.length;
  actors.forEach((a) => {
    const done = () => --waiting || startStills();
    a.classList.contains('is-ready') ? done() : new MutationObserver((_, mo) => a.classList.contains('is-ready') && (mo.disconnect(), done())).observe(a, { attributes: true, attributeFilter: ['class'] });
  });
  setTimeout(startStills, 2500);
} else startStills();
whenNear($('#studio'), startStills);

/* the studio's agent button follows whatever character and state are on stage */
$('#agent-copy').addEventListener('click', () =>
  copyAgent(view.spec, view.state, `${view.spec.name} (${LABELS[view.state].toLowerCase()}) setup prompt copied — paste it into your agent`),
);

/* the developers callout hands over a generic prompt for the default character */
$('#dev-agent-copy').addEventListener('click', () => copyAgent(byId('mochi'), 'thinking', 'Setup prompt copied — paste it into your agent'));

select(view.spec);
setState(view.state);

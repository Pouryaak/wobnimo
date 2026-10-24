/* "Describe it. Get it.": a replay of an agent building a mascot from one
   sentence. The prompt types itself, the spec streams in, and the stage
   shows the character the way the agent assembles it: bare clay shapes
   bone by bone, then the face, then colour, then the check, then life.

   Every step is the real character in the real engine. It is built once,
   as a revealable shader, and each step only changes what that shader
   shows, so a whole replay costs one shader build. The next character's is
   built while the page is idle, and the replay only advances while the
   section is on screen. */

import { Mascot, isSupported, warm, type CharacterSpec, type MascotState, type Palette, type Reveal } from '@wobnimo/engine';
import { planBuild, type BuildPlan } from './shared/build-plan';

/** The sentence each of the described characters was made from. */
export const PROMPTS: Record<string, string> = {
  drift: 'A sleepy cloud in brand blue, wearing headphones',
  cacti: 'A tiny potted cactus with a pink flower on its head',
  latte: 'A coffee cup with a foam-art heart and steam for hair',
  bumble: 'A round bumblebee with tiny wings',
  swirl: 'A snail whose shell looks like a cinnamon roll',
  ember: 'A fox cub with a big fluffy tail',
  cap: 'A red mushroom with white spots',
  berry: 'A strawberry with a leafy hat',
  bao: 'A chubby panda',
  hop: 'A white bunny with long floppy ears',
};

class Aborted extends Error {}

export interface ForgeElements {
  section: HTMLElement;
  stage: HTMLElement;
  log: HTMLElement;
  status: HTMLElement;
  chips: HTMLElement;
}

export function startForge(cast: CharacterSpec[], el: ForgeElements, stillUrl: (spec: CharacterSpec) => string) {
  const animated = isSupported();
  const order = cast.filter((c) => PROMPTS[c.id]);
  const builds = new Map<string, BuildPlan>();
  const build = (spec: CharacterSpec) => builds.get(spec.id) ?? builds.set(spec.id, planBuild(spec)).get(spec.id)!;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let mascot: Mascot | null = null;
  let run = 0;
  let current = order[0];

  /* ---- pacing: only while the section is on screen and the tab is visible ---- */
  let onScreen = false;
  let resume: (() => void) | null = null;
  const awake = () => onScreen && document.visibilityState === 'visible';
  const wake = () => awake() && resume?.();
  new IntersectionObserver(([e]) => ((onScreen = e.isIntersecting), wake())).observe(el.section);
  document.addEventListener('visibilitychange', wake);

  const until = (token: number) => {
    if (token !== run) throw new Aborted();
  };
  async function wait(ms: number, token: number) {
    await new Promise((r) => setTimeout(r, ms));
    until(token);
    if (!awake()) await new Promise<void>((r) => (resume = r));
    until(token);
  }

  /* ---- the terminal ---- */
  function line(html: string, cls = '') {
    const p = document.createElement('p');
    p.className = cls;
    p.innerHTML = html;
    el.log.append(p);
    /* keep the log short: old lines scroll off the top */
    while (el.log.children.length > 13) el.log.firstElementChild!.remove();
    return p;
  }
  async function type(text: string, token: number) {
    const p = line('<span class="caret-mark">›</span> <span class="typed"></span><span class="caret"></span>', 'prompt');
    const out = p.querySelector('.typed')!;
    for (let i = 1; i <= text.length; i++) {
      out.textContent = text.slice(0, i);
      await wait(still ? 0 : 26, token);
    }
    p.querySelector('.caret')!.remove();
  }
  const swatch = (c: string) => `<i class="sw" style="--c:${c}"></i>`;
  const status = (text: string, phase: string) => {
    el.status.textContent = text;
    el.stage.dataset.phase = phase;
  };

  function show(spec: CharacterSpec, palette: Palette | undefined, state: MascotState, reveal: Reveal | null) {
    if (!animated) {
      /* no WebGL2: the finished character's still stands in for the whole build */
      const img = el.stage.querySelector('img') ?? el.stage.appendChild(new Image());
      img.alt = spec.name;
      img.src = stillUrl(spec);
      el.stage.classList.add('is-ready');
      return;
    }
    if (!mascot) {
      const canvas = document.createElement('canvas');
      el.stage.append(canvas);
      mascot = new Mascot(canvas, spec, { state, palette, effects: false, seed: 0.42, framing: 1.14, maxPixelRatio: 1.5, revealable: true });
      mascot.on('ready', () => el.stage.classList.add('is-ready'));
    } else {
      if (mascot.spec !== spec) mascot.setSpec(spec);
      mascot.setPalette(palette);
      mascot.setState(state);
    }
    mascot.reveal(reveal);
  }

  /* build the next character's shader before its turn, while the page has a moment */
  const warmNext = (spec: CharacterSpec) => {
    const next = order[(order.indexOf(spec) + 1) % order.length];
    const go = () => animated && warm(next, { revealable: true });
    'requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 2000 }) : setTimeout(go, 300);
  };

  async function replay(spec: CharacterSpec, token: number) {
    const b = build(spec);
    const prompt = PROMPTS[spec.id];
    el.log.replaceChildren();
    mascot?.setEffects(false);
    status('listening', 'idle');

    await type(`make me a mascot: ${prompt[0].toLowerCase()}${prompt.slice(1)}`, token);
    await wait(320, token);
    line('reading skill <b>wobnimo-mascot</b>', 'dim');
    await wait(260, token);
    const colours = Object.values(spec.materials).map((m) => m.color);
    line(`plan  ${spec.parts.length} parts · ${spec.bones.length} bones · ${[...new Set(colours)].slice(0, 5).map(swatch).join('')}`, 'dim');
    await wait(300, token);
    line(`<span class="cmd">$</span> npx wobnimo new ${spec.id}`);
    await wait(260, token);

    /* bare stages: no paint, no face, no effects, so only the shapes show */
    for (const [i, s] of b.steps.entries()) {
      show(spec, b.clay, 'idle', { parts: s.parts, face: false, paints: false });
      status(`shaping ${i + 1}/${b.steps.length}`, 'clay');
      line(`<span class="add">+</span> ${s.label.padEnd(15, ' ')}<span class="dim">${s.shapes}</span>`);
      await wait(still ? 0 : 560, token);
    }

    /* the face arrives asleep, then wakes up */
    show(spec, b.clay, 'sleeping', { face: true, paints: false });
    status('adding a face', 'clay');
    line(`<span class="add">+</span> ${'face'.padEnd(15, ' ')}<span class="dim">${spec.eyes ? `${spec.eyes.kind} eyes ×2` : 'screen'}${spec.face?.kind === 'mouth' ? ' · mouth' : ''}</span>`);
    await wait(still ? 0 : 650, token);
    mascot?.setState('surprised');
    await wait(still ? 0 : 520, token);

    /* colour floods in one material at a time */
    status('painting', 'paint');
    const names = Object.keys(spec.materials);
    const p = line(`<span class="add">+</span> ${'colour'.padEnd(15, ' ')}`);
    const reveal: Palette = { ...b.clay };
    for (const name of names) {
      delete reveal[name];
      mascot?.setPalette({ ...reveal });
      p.insertAdjacentHTML('beforeend', swatch(spec.materials[name].color));
      await wait(still ? 0 : Math.max(70, 520 / names.length), token);
    }
    show(spec, undefined, 'idle', null);
    if (spec.paints?.length) line(`<span class="add">+</span> ${'paint'.padEnd(15, ' ')}<span class="dim">${spec.paints.length} soft paints</span>`);
    await wait(320, token);

    status('checking', 'check');
    line(`<span class="cmd">$</span> npx wobnimo check mascots/${spec.id}.ts`);
    await wait(still ? 0 : 520, token);
    line('✓ 0 errors · 0 warnings', 'ok');
    await wait(260, token);
    line(`<span class="cmd">$</span> npx wobnimo preview mascots/${spec.id}.ts`);
    await wait(still ? 0 : 520, token);
    line(`✓ 15 views → .wobnimo/${spec.id}.png`, 'ok');

    status(`${spec.name} is alive`, 'alive');
    warmNext(spec);
    mascot?.setEffects(true);
    mascot?.setState('celebrating');
    await wait(2300, token);
    mascot?.setState('speaking');
    await wait(2400, token);
    mascot?.setState('idle');
    await wait(1600, token);
  }

  /* ---- the sentences to pick from ---- */
  const chips = order.map((spec) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = PROMPTS[spec.id];
    b.addEventListener('click', () => play(spec));
    el.chips.append(b);
    return b;
  });

  async function play(spec: CharacterSpec) {
    const token = ++run;
    current = spec;
    chips.forEach((c, i) => c.setAttribute('aria-pressed', String(order[i] === spec)));
    try {
      await replay(spec, token);
      /* and on to the next sentence */
      play(order[(order.indexOf(current) + 1) % order.length]);
    } catch (e) {
      if (!(e instanceof Aborted)) throw e;
    }
  }

  play(current);
}

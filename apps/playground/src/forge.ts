/* "Describe it. Get it.": a replay of an agent building a mascot from one
   sentence. The prompt types itself, the spec streams in, and the stage
   shows the character the way the agent assembles it: bare clay shapes
   bone by bone, then the face, then colour, then the check, then life.

   Every step is a real spec handed to the real engine. Each intermediate
   spec is built once and kept, so the second time round every shader is
   already compiled and only uniforms change. The replay only advances
   while the section is on screen. */

import { Mascot, type CharacterSpec, type MascotState, type Palette, type PartSpec } from '@wobnimo/engine';

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

const CLAY = '#b8b0a2';
const MAX_STAGES = 6;
/* a family with more parts than this is shaped in two passes */
const SPLIT = 7;

interface Stage {
  spec: CharacterSpec;
  label: string;
  shapes: string;
}

interface Build {
  stages: Stage[];
  /** The eyes and mouth on the finished clay body. */
  face: CharacterSpec;
  clay: Palette;
}

/* a bone's family name: earL and earR are both "ear", tentacle3 is "tentacle" */
const family = (bone: string) => bone.replace(/([a-z])(L|R|\d+)$/, '$1').replace(/([A-Z])/g, ' $1').toLowerCase();

function plan(spec: CharacterSpec): Build {
  /* runs of parts on one family of bones, in the order the spec lists them */
  const runs: Array<{ label: string; end: number; size: number }> = [];
  spec.parts.forEach((p, i) => {
    const label = family(p.bone);
    const last = runs[runs.length - 1];
    if (last?.label === label) (last.end = i + 1), last.size++;
    else runs.push({ label, end: i + 1, size: 1 });
  });
  /* big runs take two passes, the second one the detail */
  const passes = runs.flatMap((r) =>
    r.size > SPLIT ? [{ label: r.label, end: r.end - Math.floor(r.size / 2), size: Math.ceil(r.size / 2) }, { label: `${r.label} detail`, end: r.end, size: Math.floor(r.size / 2) }] : [r],
  );
  /* too many passes: fold the smallest into the one before it */
  while (passes.length > MAX_STAGES) {
    let k = 1;
    for (let i = 2; i < passes.length; i++) if (passes[i].size < passes[k].size) k = i;
    passes[k - 1] = { label: passes[k - 1].label, end: passes[k].end, size: passes[k - 1].size + passes[k].size };
    passes.splice(k, 1);
  }
  /* bare stages: no paint, no face, no effects, so only the shapes show */
  const bare = { ...spec, paints: [], eyes: undefined, face: undefined, fx: undefined, acting: {} };
  let start = 0;
  const stages = passes.map((pass): Stage => {
    const stage = { spec: { ...bare, parts: spec.parts.slice(0, pass.end) }, label: pass.label, shapes: count(spec.parts.slice(start, pass.end)) };
    start = pass.end;
    return stage;
  });
  return {
    stages,
    face: { ...spec, paints: [], fx: undefined },
    clay: Object.fromEntries(Object.keys(spec.materials).map((m) => [m, CLAY])),
  };
}

function count(parts: PartSpec[]): string {
  const n = new Map<string, number>();
  for (const p of parts) {
    const key = p.op === 'sub' ? `${p.shape} cut` : p.shape;
    n.set(key, (n.get(key) ?? 0) + 1);
  }
  return [...n].map(([k, v]) => (v > 1 ? `${k} ×${v}` : k)).join(' · ');
}

class Aborted extends Error {}

export interface ForgeElements {
  section: HTMLElement;
  stage: HTMLElement;
  log: HTMLElement;
  status: HTMLElement;
  chips: HTMLElement;
}

export function startForge(cast: CharacterSpec[], el: ForgeElements) {
  const order = cast.filter((c) => PROMPTS[c.id]);
  const builds = new Map<string, Build>();
  const build = (spec: CharacterSpec) => builds.get(spec.id) ?? builds.set(spec.id, plan(spec)).get(spec.id)!;
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

  function show(spec: CharacterSpec, palette: Palette | undefined, state: MascotState) {
    if (!mascot) {
      const canvas = document.createElement('canvas');
      el.stage.append(canvas);
      mascot = new Mascot(canvas, spec, { state, palette, effects: false, seed: 0.42, framing: 1.14, maxPixelRatio: 1.5 });
      mascot.on('ready', () => el.stage.classList.add('is-ready'));
    } else {
      mascot.setSpec(spec, palette);
      mascot.setState(state);
    }
  }

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

    for (const [i, s] of b.stages.entries()) {
      show(s.spec, b.clay, 'idle');
      status(`shaping ${i + 1}/${b.stages.length}`, 'clay');
      line(`<span class="add">+</span> ${s.label.padEnd(15, ' ')}<span class="dim">${s.shapes}</span>`);
      await wait(still ? 0 : 560, token);
    }

    /* the face arrives asleep, then wakes up */
    show(b.face, b.clay, 'sleeping');
    status('adding a face', 'clay');
    line(`<span class="add">+</span> ${'face'.padEnd(15, ' ')}<span class="dim">${spec.eyes ? `${spec.eyes.kind} eyes ×2` : 'screen'}${spec.face?.kind === 'mouth' ? ' · mouth' : ''}</span>`);
    await wait(still ? 0 : 650, token);
    mascot!.setState('surprised');
    await wait(still ? 0 : 520, token);

    /* colour floods in one material at a time */
    status('painting', 'paint');
    const names = Object.keys(spec.materials);
    const p = line(`<span class="add">+</span> ${'colour'.padEnd(15, ' ')}`);
    const reveal: Palette = { ...b.clay };
    for (const name of names) {
      delete reveal[name];
      mascot!.setPalette({ ...reveal });
      p.insertAdjacentHTML('beforeend', swatch(spec.materials[name].color));
      await wait(still ? 0 : Math.max(70, 520 / names.length), token);
    }
    show(spec, undefined, 'idle');
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
    mascot!.setEffects(true);
    mascot!.setState('celebrating');
    await wait(2300, token);
    mascot!.setState('speaking');
    await wait(2400, token);
    mascot!.setState('idle');
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

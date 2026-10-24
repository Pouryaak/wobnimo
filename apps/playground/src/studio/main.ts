/* The Wobnimo studio: type a sentence, watch a mascot get built.

   The page is three parts talking through narrow interfaces. A
   `MascotGenerator` designs the character and streams what it is doing;
   the `Chat` shows that as a conversation; the `Stage` plays the build on
   one live mascot. This file is the director between them, and the only
   place that knows which generator is in use.

   Nothing is built before it is needed: the stage is an empty drawing
   until the first draft arrives, and the shelf of past builds is images
   captured from the stage, not more live mascots. */

import { STATES, type CharacterSpec, type MascotState, type Palette } from '@wobnimo/engine';
import { characters } from '@wobnimo/characters';
import { PROMPTS } from '../forge';
import { copyText, showStars } from '../shared/ui';
import { Chat, type BuildCard } from './chat';
import { RemoteBrain } from './brain';
import { DemoGenerator } from './demo-generator';
import { GenerationAborted, type MascotGenerator, type Turn } from './generator';
import { download, handoffPrompt, reactSnippet, specSource, type Made } from './handoff';
import { SkillGenerator } from './skill-generator';
import { STEPS, Stage, type Step } from './stage';

/** The studio API's URL, set at build time (STUDIO_API_URL). Without one, the studio runs on the demo. */
declare const __STUDIO_API__: string;

const generator: MascotGenerator = __STUDIO_API__ ? new SkillGenerator(new RemoteBrain(__STUDIO_API__), 'Wobnimo AI') : new DemoGenerator(characters);

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

const IDEAS = [
  ...Object.values(PROMPTS).slice(0, 3),
  'A tiny robot with a screen for a face',
  'A grumpy cat who secretly loves cuddles',
  'A baby dinosaur with wobbly spikes',
];

/** What to offer next, once a build lands: a few the person hasn't asked for yet. */
const FOLLOW_UPS = ['Make it pink', 'Make it sleepy', 'Make it blue', 'Make it cheerful', 'Make it purple', 'Something completely different'];
const followUps = () => {
  const asked = new Set(session.turns.filter((t) => t.role === 'user').map((t) => t.text));
  const fresh = FOLLOW_UPS.slice(0, -1).filter((f) => !asked.has(f));
  return [...fresh.slice(0, 2), FOLLOW_UPS[FOLLOW_UPS.length - 1]];
};

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

interface Shelved extends Made {
  name: string;
  thumb: string | null;
}

const narrow = matchMedia('(max-width: 820px)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

const chat = new Chat($('#log'));
const stage = new Stage($('#stage'));
const bench = $('#bench');
const prompt = $<HTMLTextAreaElement>('#prompt');
const form = $<HTMLFormElement>('#composer');

const session = {
  turns: [] as Turn[],
  current: null as Made | null,
  build: null as AbortController | null,
};

/* ---- the stage's frame: title, progress rail, status ---- */

const rail = new Map(STEPS.map((s) => [s, $(`#rail [data-step="${s}"]`)]));

function railAt(step: Step | null) {
  const at = step ? STEPS.indexOf(step) : -1;
  for (const [s, li] of rail) li.dataset.state = STEPS.indexOf(s) < at || step === 'alive' ? 'done' : STEPS.indexOf(s) === at ? 'now' : 'todo';
}

function status(text: string, phase: string) {
  $('#status').textContent = text;
  bench.dataset.phase = phase;
}

function title(kicker: string, name: string) {
  $('#bench-kicker').textContent = kicker;
  $('#bench-name').textContent = name;
}

/* ---- building ---- */

async function build(text: string) {
  const ask = text.trim();
  if (!ask) return;
  session.build?.abort();
  const controller = new AbortController();
  session.build = controller;
  const { signal } = controller;

  chat.said(ask);
  intro(false);
  /* on a phone the stage sits above the conversation: bring the show into view */
  if (narrow.matches) bench.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
  const card = chat.build(generator.label);
  card.changed = () => chat.follow();
  setBuilding(true);
  dock(false);
  railAt(null);
  status('thinking', 'thinking');
  if (!session.current) title('Designing', 'Your mascot');

  const base = session.current ?? undefined;
  let drafted = false;
  try {
    for await (const event of generator.generate({ prompt: ask, base, history: session.turns.slice(), signal })) {
      if (signal.aborted) throw new GenerationAborted();
      switch (event.type) {
        case 'note':
          card.line(event.text);
          status(event.text.toLowerCase(), bench.dataset.phase ?? 'thinking');
          break;
        case 'plan':
          card.plan(event.name, event.summary, event.colors);
          title('Designing', event.name);
          break;
        case 'draft':
          placeholder(false);
          /* the first spec that can be drawn is built up; later rounds swap in place */
          if (!drafted) {
            await stage.assemble(event.spec, signal, {
              step: (step, detail) => (railAt(step), status(detail, step)),
              line: (t) => card.line(t, 'add'),
            });
          } else {
            card.line(`Round ${event.round}: swapping in the fix`, 'add');
            stage.place(event.spec);
          }
          drafted = true;
          break;
        case 'check':
          railAt('check');
          status('checking', 'check');
          card.check(event.report);
          break;
        case 'done':
          await land(event, drafted, card, ask, signal);
          break;
      }
    }
  } catch (e) {
    if (e instanceof GenerationAborted || signal.aborted) {
      card.stopped();
      /* stopped by the person, not replaced by a newer build: put back what was there */
      if (session.build === controller) session.current ? restore(session.current) : reset(false);
    } else {
      const message = e instanceof Error ? e.message : String(e);
      card.failed(message);
      status('something went wrong', 'error');
      stage.setState('error');
    }
  } finally {
    if (session.build === controller) {
      session.build = null;
      setBuilding(false);
    }
  }
}

/** The build is finished: bring it to life, say so, and keep it. */
async function land(
  done: { spec: CharacterSpec; reply: string; palette?: Palette; state?: MascotState; still?: string },
  drafted: boolean,
  card: BuildCard,
  ask: string,
  signal: AbortSignal,
) {
  const made: Made = { spec: done.spec, palette: done.palette, state: done.state ?? 'idle', inCast: characters.includes(done.spec) };
  placeholder(false);
  /* the finished spec is usually the one on stage; when an earlier round was better, it goes back up */
  if (drafted && stage.spec === made.spec) stage.setPalette(made.palette);
  else stage.place(made.spec, made.palette, 'idle', done.still);
  session.current = made;
  railAt('alive');
  title('Alive', made.spec.name);
  status(`${made.spec.name} is alive`, 'alive');
  session.turns.push({ role: 'user', text: ask }, { role: 'assistant', text: done.reply });
  card.reply(done.reply, followUps(), (f) => submit(f));
  dock(true);
  moods(made.state);

  const waking = stage.wake(made.state, signal);
  /* the shelf's picture is taken mid-celebration, when it looks its best */
  setTimeout(() => shelve(made), 900);
  await waking;
}

function setBuilding(on: boolean) {
  form.classList.toggle('is-building', on);
  $('#send').setAttribute('aria-label', on ? 'Stop building' : 'Build it');
}

/* ---- after a build: moods, hand-off, the shelf ---- */

const moodButtons = STATES.map((s) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'mood';
  b.textContent = LABELS[s];
  b.addEventListener('click', () => {
    if (!session.current) return;
    session.current.state = s;
    stage.setState(s);
    moods(s);
  });
  $('#moods').append(b);
  return b;
});

function moods(state: MascotState) {
  moodButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(STATES[i] === state)));
}

function dock(on: boolean) {
  $('#dock').toggleAttribute('inert', !on);
  $('#dock').classList.toggle('is-off', !on);
}

$('#copy-agent').addEventListener('click', () => session.current && copyText(handoffPrompt(session.current), `${session.current.spec.name} prompt copied — paste it into your agent`));
$('#copy-code').addEventListener('click', () => session.current && copyText(reactSnippet(session.current), 'React snippet copied'));
$('#download').addEventListener('click', () => session.current && download(`${session.current.spec.id}.ts`, specSource(session.current)));

const shelf = $('#shelf');
const shelved: Shelved[] = [];
const samePalette = (a?: Palette, b?: Palette) => JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});

function shelve(made: Made) {
  /* a mood change is the same mascot; a new colour is worth keeping */
  if (shelved.some((s) => s.spec === made.spec && samePalette(s.palette, made.palette))) return;
  const item: Shelved = { ...made, name: made.spec.name, thumb: stage.capture() };
  shelved.push(item);
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'shelf-item';
  b.setAttribute('aria-label', `Put ${item.name} back on stage`);
  if (item.thumb) {
    const img = new Image(72, 72);
    img.alt = '';
    img.src = item.thumb;
    b.append(img);
  }
  b.append(Object.assign(document.createElement('span'), { textContent: item.name }));
  b.addEventListener('click', () => {
    if (session.build) return;
    restore(item);
  });
  shelf.prepend(b);
  $('#shelf-wrap').hidden = false;
}

/** Puts a past build back on stage, ready to refine. */
function restore(made: Made) {
  session.current = { ...made };
  placeholder(false);
  stage.place(made.spec, made.palette, made.state);
  stage.setEffects(true);
  railAt('alive');
  title('Alive', made.spec.name);
  status(`${made.spec.name} is back`, 'alive');
  dock(true);
  moods(made.state);
}

/* ---- the empty studio ---- */

function placeholder(on: boolean) {
  $('#placeholder').hidden = !on;
}

function intro(on: boolean) {
  $('#intro').hidden = !on;
}

/** Back to an empty studio. The shelf stays: it is this visit's work. */
function reset(clearChat = true) {
  session.build?.abort();
  session.build = null;
  setBuilding(false);
  session.current = null;
  session.turns = [];
  if (clearChat) chat.clear(), intro(true);
  stage.clear();
  placeholder(true);
  railAt(null);
  title('Stage', 'Your mascot');
  status('ready when you are', 'empty');
  dock(false);
}

const ideas = $('#ideas');
for (const idea of IDEAS) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'idea';
  b.textContent = idea;
  b.addEventListener('click', () => submit(idea));
  ideas.append(b);
}

$('#new').addEventListener('click', () => {
  reset();
  prompt.focus();
});

if (!stage.animated) $('#placeholder-note').textContent = 'WebGL2 is off in this browser, so builds show as stills';

/* ---- the composer ---- */

const MAX = Number(prompt.maxLength);

function submit(text: string) {
  prompt.value = '';
  sync();
  build(text);
}

/** Grows the box with what is written, and keeps the counter and the button honest. */
function sync() {
  prompt.style.height = 'auto';
  prompt.style.height = `${Math.min(prompt.scrollHeight, 180)}px`;
  $('#count').textContent = `${prompt.value.length}/${MAX}`;
  form.classList.toggle('has-text', prompt.value.trim().length > 0);
}

prompt.addEventListener('input', sync);
prompt.addEventListener('keydown', (e) => {
  /* Enter builds; Shift+Enter is a new line; nothing fires mid-composition (IME) */
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    form.requestSubmit();
  }
});
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (session.build && !prompt.value.trim()) return session.build.abort();
  submit(prompt.value);
});

/* the placeholder cycles through ideas while the box is empty and unfocused */
{
  let i = 0;
  setInterval(() => {
    if (document.activeElement === prompt || prompt.value || document.hidden) return;
    i = (i + 1) % IDEAS.length;
    prompt.placeholder = session.current ? 'Change it: make it pink, make it sleepy…' : `${IDEAS[i]}…`;
  }, 3600);
}

/* ---- start ---- */

$('#engine-label').textContent = generator.label;
$('#demo-note').hidden = !generator.demo;
reset();
sync();
showStars();

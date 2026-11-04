/* A stand-in generator, until the studio is wired to a real model.

   It doesn't design anything: it picks the cast member that best matches
   what the person wrote and replays building it, at the pace a model
   would. Everything after the pick is real: the spec is the character's
   own, the check is the engine's own checker run on it in the page, and
   follow-ups that name a colour recolour the mascot on stage. The studio
   labels its results as a demo, so nobody mistakes the pick for a design. */

import type { CharacterSpec, MascotState, Palette } from '@wobnimo/engine';
import { checkCharacter } from '@wobnimo/engine/check';
import { stillUrl } from '../shared/assets';
import { pause, type GenerateRequest, type GenerationEvent, type MascotGenerator } from './generator';

/** Words that point at a character beyond what its name and tagline already say. */
const HINTS: Record<string, string[]> = {
  volt: ['robot', 'bot', 'ai', 'assistant', 'machine', 'android', 'tech', 'screen', 'led'],
  pip: ['bird', 'chick', 'sparrow', 'parrot', 'singer', 'song', 'tweet'],
  mochi: ['jelly', 'slime', 'blob', 'gummy', 'sprout', 'mochi', 'water', 'drop'],
  boo: ['ghost', 'spirit', 'spooky', 'halloween', 'glow', 'night'],
  inky: ['octopus', 'squid', 'tentacle', 'sea', 'ocean', 'ink'],
  miso: ['cat', 'kitten', 'kitty', 'tabby', 'plush', 'meow'],
  tad: ['frog', 'toad', 'pond', 'tadpole', 'amphibian'],
  pebble: ['penguin', 'scarf', 'ice', 'snow', 'winter', 'cold'],
  rex: ['dinosaur', 'dino', 't-rex', 'trex', 'dragon', 'lizard', 'reptile'],
  microduck: ['duck', 'mech', 'mecha', 'boots', 'quack'],
  drift: ['cloud', 'sky', 'weather', 'music', 'headphones', 'sleepy', 'dream'],
  cacti: ['cactus', 'plant', 'succulent', 'pot', 'desert', 'flower', 'garden'],
  latte: ['coffee', 'cup', 'mug', 'tea', 'latte', 'cafe', 'steam', 'drink'],
  bumble: ['bee', 'bumblebee', 'honey', 'insect', 'bug', 'wings'],
  swirl: ['snail', 'shell', 'cinnamon', 'roll', 'bun', 'pastry', 'slow'],
  ember: ['fox', 'cub', 'tail', 'fire', 'orange', 'wolf', 'dog', 'puppy'],
  cap: ['mushroom', 'toadstool', 'fungus', 'forest', 'spots'],
  berry: ['strawberry', 'berry', 'fruit', 'sweet', 'leaf'],
  bao: ['panda', 'bear', 'bamboo', 'chubby', 'teddy'],
  hop: ['bunny', 'rabbit', 'hare', 'ears', 'easter', 'carrot'],
};

const COLORS: Record<string, string> = {
  red: '#e5484d',
  pink: '#ff5d8f',
  rose: '#f0628a',
  orange: '#ff8a3d',
  peach: '#ffad85',
  yellow: '#ffc93c',
  gold: '#e8b33a',
  lime: '#b7e34a',
  green: '#2fcf8f',
  mint: '#7fe0b8',
  teal: '#22b3a6',
  blue: '#4f7cff',
  navy: '#2a3f8f',
  sky: '#7ab8ff',
  purple: '#a774ff',
  violet: '#8b5cf6',
  lilac: '#c4a6ff',
  black: '#2a2b30',
  white: '#f4f1ea',
  grey: '#9aa0aa',
  gray: '#9aa0aa',
  brown: '#9a6a45',
};

const MOODS: Array<[RegExp, MascotState]> = [
  [/\b(sleep|sleepy|tired|dreamy|lazy|nap)/, 'sleeping'],
  [/\b(happy|cheer|cheerful|joy|party|excited|bubbly)/, 'celebrating'],
  [/\b(curious|clever|smart|wise|thoughtful|nerd)/, 'thinking'],
  [/\b(shy|sad|gloomy|grumpy|blue mood)/, 'sad'],
  [/\b(chatty|talk|singing|sings|loud)/, 'speaking'],
  [/\b(busy|hard.?working|worker|builder|engineer)/, 'working'],
];

const words = (text: string) => text.toLowerCase().match(/[a-z][a-z-]*/g) ?? [];

/** How well a sentence fits a character: hint words count most, then its tagline and name. */
function score(spec: CharacterSpec, said: string[]): number {
  const hints = new Set(HINTS[spec.id] ?? []);
  const tagline = new Set(words(`${spec.name} ${spec.tagline ?? ''}`));
  return said.reduce((sum, w) => sum + (hints.has(w) ? 3 : 0) + (tagline.has(w) && w.length > 3 ? 1 : 0) + (w === spec.id ? 5 : 0), 0);
}

/* the same sentence always lands on the same character, even when nothing matches */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function pick(cast: CharacterSpec[], prompt: string, avoid?: CharacterSpec): CharacterSpec {
  const said = words(prompt);
  const pool = cast.filter((c) => c !== avoid);
  let best = pool[hash(prompt) % pool.length];
  let top = 0;
  for (const spec of pool) {
    const s = score(spec, said);
    if (s > top) (top = s), (best = spec);
  }
  return best;
}

const colorIn = (prompt: string) => words(prompt).find((w) => w in COLORS);
const moodIn = (prompt: string): MascotState | undefined => MOODS.find(([re]) => re.test(prompt.toLowerCase()))?.[1];
const mainMaterial = (spec: CharacterSpec) => Object.keys(spec.materials)[0];
const unique = <T>(xs: T[]) => [...new Set(xs)];

export class DemoGenerator implements MascotGenerator {
  readonly label = 'Demo · replays the cast';
  readonly demo = true;

  constructor(private readonly cast: CharacterSpec[]) {}

  async *generate({ prompt, base, signal }: GenerateRequest): AsyncGenerator<GenerationEvent> {
    const color = colorIn(prompt);
    const mood = moodIn(prompt);

    /* a follow-up that asks for a colour or a mood keeps the mascot and changes just that */
    if (base && (color || mood) && !this.namesAnother(prompt, base.spec)) {
      const material = mainMaterial(base.spec);
      if (color) yield { type: 'note', text: `Recolouring ${material} to ${color}` };
      if (mood) yield { type: 'note', text: `Settling it into ${mood}` };
      await pause(900, signal);
      const palette: Palette | undefined = color ? { ...base.palette, [material]: COLORS[color] } : base.palette;
      const change = [color && `in ${color}`, mood && `feeling ${mood}`].filter(Boolean).join(', ');
      yield {
        type: 'done',
        spec: base.spec,
        palette,
        state: mood ?? 'celebrating',
        reply: `Done: ${base.spec.name}, ${change}. Colours and moods are live settings, so that didn't rebuild anything.`,
      };
      return;
    }

    const spec = pick(this.cast, prompt, base?.spec);
    yield { type: 'note', text: 'Reading the wobnimo-mascot skill' };
    await pause(700, signal);
    yield { type: 'note', text: 'Sketching a body plan' };
    await pause(900, signal);
    yield { type: 'plan', name: spec.name, summary: spec.tagline ?? '', colors: unique(Object.values(spec.materials).map((m) => m.color)).slice(0, 6) };
    await pause(1100, signal);
    yield { type: 'note', text: `Writing ${spec.parts.length} parts on ${spec.bones.length} bones` };
    await pause(800, signal);
    yield { type: 'draft', spec, round: 1 };

    yield { type: 'note', text: `npx wobnimo check mascots/${spec.id}.ts` };
    await pause(200, signal);
    const report = checkCharacter(spec);
    yield { type: 'check', round: 1, report };
    await pause(500, signal);

    const palette = color ? { [mainMaterial(spec)]: COLORS[color] } : undefined;
    const warnings = report.issues.filter((i) => i.level === 'warning').length;
    const verdict = report.ok ? (warnings ? `the checker passed it with ${warnings} small warning${warnings > 1 ? 's' : ''}` : 'the checker had nothing to fix') : 'the checker still has notes on it';
    yield {
      type: 'done',
      spec,
      palette,
      state: mood,
      still: stillUrl(spec),
      reply: `Meet ${spec.name}. ${spec.tagline ?? ''}${spec.tagline?.endsWith('.') ? '' : '.'} ${spec.parts.length} parts on ${spec.bones.length} bones, and ${verdict}.`,
    };
  }

  /** Whether the follow-up asks for a different kind of character, not just a new colour. */
  private namesAnother(prompt: string, current: CharacterSpec): boolean {
    const said = words(prompt);
    return this.cast.some((c) => c !== current && score(c, said) >= 3);
  }
}

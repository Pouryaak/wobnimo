/* The real generator: a brain designs the mascot with the wobnimo-mascot
   skill, and the engine's own checker keeps it honest.

   The loop is the one the skill teaches a coding agent, run in the page:
   the brain writes a spec, the checker measures it, and every error goes
   back to the brain with the exact fix, until it is clean or out of rounds.
   Which model is thinking doesn't matter here; see brain.ts.

   The brain answers in a small fixed format (the studio API's system
   prompt asks for it), so the studio can show the plan the moment it is
   written, narrate while the spec streams, and say something at the end:

     PLAN: Name | one line about it | #rrggbb #rrggbb …
     - a short note per step, as it works
     ```json
     { …the CharacterSpec… }
     ```
     SAY: a sentence or two to the person */

import { compileCached, recolor, type CharacterSpec, type Hex } from '@wobnimo/engine';
import { checkCharacter, formatCheck, type CheckReport } from '@wobnimo/engine/check';
import type { Brain, BrainMessage } from './brain';
import { GenerationAborted, type GenerateRequest, type GenerationEvent, type MascotGenerator } from './generator';

/** Tries at a clean spec before the studio settles for the best one so far. */
const MAX_ROUNDS = 3;
/** How often, in characters, the studio says how much spec has streamed in. */
const PROGRESS_EVERY = 2400;

interface Reply {
  text: string;
  spec: CharacterSpec | null;
  /** Why no spec could be read from the reply, to send back to the brain. */
  problem: string | null;
  say: string;
}

export class SkillGenerator implements MascotGenerator {
  readonly demo = false;

  constructor(
    private readonly brain: Brain,
    readonly label: string,
  ) {}

  async *generate({ prompt, base, signal }: GenerateRequest): AsyncGenerator<GenerationEvent> {
    const messages: BrainMessage[] = [{ role: 'user', content: base ? refine(base.palette ? recolor(base.spec, base.palette) : base.spec, prompt) : `Make me a mascot: ${prompt}` }];
    let best: { spec: CharacterSpec; report: CheckReport; say: string } | null = null;
    let planned = false;

    yield { type: 'note', text: base ? `Changing ${base.spec.name}` : 'Reading the wobnimo-mascot skill' };

    for (let round = 1; round <= MAX_ROUNDS; round++) {
      if (round > 1) yield { type: 'note', text: `Round ${round}: fixing what came back` };

      /* stream the reply, surfacing the plan and the notes as they arrive */
      let text = '';
      let shown = 0;
      let reported = 0;
      for await (const piece of this.brain.think(messages, signal)) {
        if (signal.aborted) throw new GenerationAborted();
        text += piece;
        const lines = text.split('\n');
        /* only whole lines: the last one may still be arriving */
        for (; shown < lines.length - 1; shown++) {
          const line = lines[shown].trim();
          const plan = !planned && parsePlan(line);
          if (plan) (planned = true), yield { type: 'plan', ...plan };
          else if (line.startsWith('- ') && !inJson(lines, shown)) yield { type: 'note', text: line.slice(2) };
        }
        const json = text.indexOf('```json');
        if (json >= 0 && text.length - json - reported >= PROGRESS_EVERY) {
          reported = text.length - json;
          yield { type: 'note', text: `Writing the spec · ${(reported / 1024).toFixed(1)} KB` };
        }
      }
      if (signal.aborted) throw new GenerationAborted();

      const reply = read(text);
      messages.push({ role: 'assistant', content: text });
      if (!reply.spec) {
        yield { type: 'note', text: `That reply had no usable spec: ${reply.problem}` };
        messages.push({ role: 'user', content: `I couldn't read a spec from that: ${reply.problem}\nAnswer again in the exact format: PLAN line, notes, one \`\`\`json block with the whole spec, SAY line.` });
        continue;
      }

      const spec = base ? { ...reply.spec, id: base.spec.id } : reply.spec;
      yield { type: 'note', text: `npx wobnimo check mascots/${spec.id}.ts` };
      const report = checkCharacter(spec);
      /* only a spec the engine can build goes on stage */
      const drawable = builds(spec);
      if (drawable) {
        yield { type: 'draft', spec, round };
        yield { type: 'check', round, report };
        if (!best || score(report) < score(best.report)) best = { spec, report, say: reply.say };
      }
      if (drawable && clean(report)) break;
      if (round < MAX_ROUNDS) {
        messages.push({
          role: 'user',
          content: `The checker measured it:\n\n${formatCheck(report)}\n\nFix every error, then every warning, using the fix lines. Answer again in the same format with the whole corrected spec.`,
        });
      }
    }

    if (!best) throw new Error("the brain couldn't produce a spec the engine can build. Try describing it another way.");
    const { spec, say } = best;
    yield { type: 'done', spec, reply: say || `Meet ${spec.name}.` };
  }
}

/* ---- the reply format ---- */

function parsePlan(line: string): { name: string; summary: string; colors: Hex[] } | null {
  const m = /^PLAN:\s*(.+?)\s*\|\s*(.+?)\s*(?:\|\s*(.*))?$/.exec(line);
  if (!m) return null;
  const colors = (m[3]?.match(/#[0-9a-f]{6}\b/gi) ?? []).slice(0, 6) as Hex[];
  return { name: m[1], summary: m[2], colors };
}

/** Whether line `i` sits inside the ```json block. */
function inJson(lines: string[], i: number): boolean {
  let open = false;
  for (let k = 0; k < i; k++) if (lines[k].trim().startsWith('```')) open = !open;
  return open;
}

function read(text: string): Reply {
  const say = /^SAY:\s*(.+)$/m.exec(text)?.[1]?.trim() ?? '';
  const block = /```(?:json)?\s*\n([\s\S]*?)\n```/.exec(text)?.[1];
  if (!block) return { text, spec: null, problem: 'there was no ```json block', say };
  try {
    const spec = JSON.parse(block);
    if (!spec || typeof spec !== 'object' || Array.isArray(spec)) return { text, spec: null, problem: 'the json block is not an object', say };
    return { text, spec: spec as CharacterSpec, problem: null, say };
  } catch (e) {
    return { text, spec: null, problem: `the json block is not valid JSON (${(e as Error).message})`, say };
  }
}

function refine(spec: CharacterSpec, ask: string): string {
  return `Here is the mascot as it is now:

\`\`\`json
${JSON.stringify(spec)}
\`\`\`

Change it: ${ask}
Keep everything that wasn't asked about. Answer in the same format with the whole spec.`;
}

/* ---- judging a round ---- */

function builds(spec: CharacterSpec): boolean {
  try {
    compileCached(spec, { reveal: true });
    return true;
  } catch {
    return false;
  }
}

const clean = (r: CheckReport) => !r.issues.some((i) => i.level !== 'note');
/** Lower is better: an error outweighs any number of warnings. */
const score = (r: CheckReport) => r.issues.reduce((s, i) => s + (i.level === 'error' ? 100 : i.level === 'warning' ? 1 : 0), 0);

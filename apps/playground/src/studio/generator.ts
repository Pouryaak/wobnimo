/* The seam between the studio and whatever designs the mascot.

   The studio knows nothing about models or providers. It hands a
   generator what the person wrote and reads back a stream of events,
   and it stages everything it shows from those events: the clay going
   up, the face, the colour, the check, the moment it comes alive.

   A real provider plugs in by implementing `MascotGenerator`. The shape
   it will usually take, with the wobnimo-mascot skill as its system prompt:

     async *generate(request) {
       yield { type: 'note', text: 'Reading the skill' };
       for (let round = 1; ; round++) {
         const spec = await askTheModel(request, lastReport);   // streams `note`s as it goes
         yield { type: 'draft', spec, round };
         const report = checkCharacter(spec);                  // @wobnimo/engine/check
         yield { type: 'check', round, report };
         if (report.ok || round === MAX_ROUNDS) break;          // else feed the issues back
       }
       yield { type: 'done', spec, reply: 'Meet …' };
     }

   Events are pulled, so a slow step in the studio (the build-up plays at
   its own pace) simply holds the stream; a provider never needs to buffer. */

import type { CharacterSpec, Hex, MascotState, Palette } from '@wobnimo/engine';
import type { CheckReport } from '@wobnimo/engine/check';

/** One line of the conversation, oldest first. */
export interface Turn {
  role: 'user' | 'assistant';
  text: string;
}

export interface GenerateRequest {
  /** What the person just wrote. */
  prompt: string;
  /** The mascot on stage when this is a follow-up ("make it pinker"), to change rather than start over. */
  base?: { spec: CharacterSpec; palette?: Palette };
  /** The conversation so far, not counting `prompt`. */
  history: Turn[];
  /** Fires when the person stops the build or starts another one. */
  signal: AbortSignal;
}

export type GenerationEvent =
  /** A line about what the generator is doing right now: reading, planning, fixing. */
  | { type: 'note'; text: string }
  /** The idea, before any shape exists: shown while the model works out the spec. */
  | { type: 'plan'; name: string; summary: string; colors: Hex[] }
  /** A complete spec to put on stage. Round 1 is built up piece by piece; later rounds swap in place. */
  | { type: 'draft'; spec: CharacterSpec; round: number }
  /** The checker's verdict on the latest draft. */
  | { type: 'check'; round: number; report: CheckReport }
  /** The finished mascot. `reply` is said in the conversation; `state` is the mood it lands in. */
  | { type: 'done'; spec: CharacterSpec; reply: string; palette?: Palette; state?: MascotState; still?: string };

export interface MascotGenerator {
  /** Shown in the composer, so the person knows what is building their mascot. */
  readonly label: string;
  /** True for a stand-in that doesn't really design anything; the studio says so. */
  readonly demo: boolean;
  generate(request: GenerateRequest): AsyncIterable<GenerationEvent>;
}

/** Thrown by generators when the request's signal fires. */
export class GenerationAborted extends Error {
  constructor() {
    super('The build was stopped');
  }
}

/** Waits `ms`, or throws `GenerationAborted` as soon as `signal` fires. */
export function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new GenerationAborted());
    const timer = setTimeout(done, ms);
    function done() {
      signal.removeEventListener('abort', stop);
      resolve();
    }
    function stop() {
      clearTimeout(timer);
      reject(new GenerationAborted());
    }
    signal.addEventListener('abort', stop, { once: true });
  });
}

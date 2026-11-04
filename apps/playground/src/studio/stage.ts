/* The studio's stage: one live mascot that a build plays out on.

   It is the site's replay technique applied to any spec: the character is
   built once as a revealable shader, and every step of the build (each
   batch of clay shapes, the face, each colour) only changes what that one
   shader shows. A build costs one shader, a recolour costs none, and
   nothing is built offscreen or ahead of need. Where WebGL2 is off, a
   still stands in when the generator supplies one. */

import { Mascot, isSupported, type CharacterSpec, type MascotState, type Palette, type Reveal } from '@wobnimo/engine';
import { planBuild } from '../shared/build-plan';
import { pause } from './generator';

/** The five beats of a build, in order. */
export const STEPS = ['clay', 'face', 'colour', 'check', 'alive'] as const;
export type Step = (typeof STEPS)[number];

export interface StageEvents {
  /** A step has started; `detail` says what is happening in it. */
  step(step: Step, detail: string): void;
  /** One line for the build log. */
  line(text: string): void;
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
/* with reduced motion the build jumps straight to each step's end */
const beat = (ms: number) => (reducedMotion.matches ? 0 : ms);

export class Stage {
  readonly animated = isSupported();
  private mascot: Mascot | null = null;

  constructor(private readonly host: HTMLElement) {}

  get spec(): CharacterSpec | null {
    return this.mascot?.spec ?? null;
  }

  /** Builds `spec` up on stage: clay shapes a few at a time, then the face, then colour. */
  async assemble(spec: CharacterSpec, signal: AbortSignal, on: StageEvents) {
    const plan = planBuild(spec);
    this.setEffects(false);

    for (const [i, s] of plan.steps.entries()) {
      this.show(spec, plan.clay, 'idle', { parts: s.parts, face: false, paints: false });
      on.step('clay', `shaping ${i + 1}/${plan.steps.length}`);
      on.line(`+ ${s.label} · ${s.shapes}`);
      await pause(beat(520), signal);
    }

    /* the face arrives asleep, then wakes up */
    this.show(spec, plan.clay, 'sleeping', { face: true, paints: false });
    on.step('face', 'adding a face');
    on.line(`+ face · ${spec.eyes ? `${spec.eyes.kind} eyes` : 'screen'}${spec.face?.kind === 'mouth' ? ' · mouth' : ''}`);
    await pause(beat(650), signal);
    this.mascot?.setState('surprised');
    await pause(beat(480), signal);

    /* colour floods in one material at a time */
    on.step('colour', 'painting');
    const names = Object.keys(spec.materials);
    const clay: Palette = { ...plan.clay };
    for (const name of names) {
      delete clay[name];
      this.mascot?.setPalette({ ...clay });
      await pause(beat(Math.max(70, 560 / names.length)), signal);
    }
    on.line(`+ colour · ${names.length} materials${spec.paints?.length ? ` · ${spec.paints.length} paints` : ''}`);
    this.show(spec, undefined, 'idle', null);
  }

  /** Puts a finished spec on stage at once: a later round of a build, or one picked from the shelf. */
  place(spec: CharacterSpec, palette?: Palette, state: MascotState = 'idle', still?: string) {
    if (!this.animated) return this.standIn(spec, still);
    this.show(spec, palette, state, null);
  }

  /** The mascot comes alive: effects on, a celebration, then the mood it lands in. */
  async wake(state: MascotState | undefined, signal: AbortSignal) {
    this.setEffects(true);
    this.setState('celebrating');
    await pause(beat(2200), signal);
    this.setState(state ?? 'idle');
  }

  setState(state: MascotState) {
    this.mascot?.setState(state);
  }

  setPalette(palette: Palette | undefined) {
    this.mascot?.setPalette(palette);
  }

  setEffects(on: boolean) {
    this.mascot?.setEffects(on);
  }

  /** The stage as it looks now, small, for the shelf. Null where there is nothing drawn to copy. */
  capture(size = 160): string | null {
    const source = this.host.querySelector('canvas');
    if (!source?.width) return this.host.querySelector('img')?.src ?? null;
    const out = document.createElement('canvas');
    out.width = out.height = size;
    out.getContext('2d')!.drawImage(source, 0, 0, size, size);
    return out.toDataURL('image/webp', 0.86);
  }

  /** Empties the stage. The shader stays cached, so placing the same spec again is instant. */
  clear() {
    this.mascot?.dispose();
    this.mascot = null;
    this.host.replaceChildren();
    this.host.classList.remove('is-ready');
  }

  private show(spec: CharacterSpec, palette: Palette | undefined, state: MascotState, reveal: Reveal | null) {
    if (!this.animated) return;
    if (!this.mascot) {
      const canvas = document.createElement('canvas');
      this.host.append(canvas);
      this.mascot = new Mascot(canvas, spec, { state, palette, effects: false, seed: 0.42, framing: 1.12, maxPixelRatio: 1.5, revealable: true });
      this.mascot.on('ready', () => this.host.classList.add('is-ready'));
    } else {
      if (this.mascot.spec !== spec) this.mascot.setSpec(spec, palette);
      else this.mascot.setPalette(palette);
      this.mascot.setState(state);
    }
    this.mascot.reveal(reveal);
  }

  private standIn(spec: CharacterSpec, still?: string) {
    if (!still) return;
    const img = this.host.querySelector('img') ?? this.host.appendChild(new Image());
    img.alt = spec.name;
    img.src = still;
    this.host.classList.add('is-ready');
  }
}

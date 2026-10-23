/* The public face of the engine: a character, alive on a canvas.

     const volt = new Mascot(canvas, volt);
     volt.setState('thinking');

   Wire `setState` to whatever your agent is doing and the character
   does the rest. */

import { Brain } from '../behavior/brain';
import { STATES, type MascotState } from '../behavior/states';
import { compile, type CompiledCharacter } from '../compiler/compile';
import { Rig } from '../rig/rig';
import type { Renderer } from '../render/renderer';
import { WebGL2Renderer } from '../render/webgl2';
import type { CharacterSpec, Vec3 } from '../spec/types';
import { scheduler, type Animated } from './scheduler';

export interface MascotOptions {
  state?: MascotState;
  /** 0–1. Desyncs blinks, glances and hops between mascots on one page. */
  seed?: number;
  /** Follow the pointer and hop when clicked. */
  interactive?: boolean;
  /** Cap on device pixels per CSS pixel. */
  maxPixelRatio?: number;
  /** The floor shadow's colour, linear RGB. */
  shadow?: Vec3;
  exposure?: number;
}

/* compiling is pure, so every mascot of one character shares the result */
const compiled = new WeakMap<CharacterSpec, CompiledCharacter>();
export function compileCached(spec: CharacterSpec): CompiledCharacter {
  let c = compiled.get(spec);
  if (!c) compiled.set(spec, (c = compile(spec)));
  return c;
}

export class Mascot implements Animated {
  private character: CompiledCharacter;
  private brain: Brain;
  private rig: Rig;
  private readonly renderer: Renderer;
  private readonly options: Required<Omit<MascotOptions, 'state' | 'seed'>>;
  private readonly seed: number;
  private visible = true;
  private readonly reducedMotion: MediaQueryList | null;
  private stillFrames = 0;
  private readonly cleanup: Array<() => void> = [];

  constructor(readonly canvas: HTMLCanvasElement, spec: CharacterSpec, options: MascotOptions = {}) {
    this.seed = options.seed ?? Math.random();
    this.options = {
      interactive: options.interactive ?? true,
      maxPixelRatio: options.maxPixelRatio ?? 2,
      shadow: options.shadow ?? [0.05, 0.06, 0.12],
      exposure: options.exposure ?? 1,
    };
    this.renderer = new WebGL2Renderer(canvas);
    this.character = compileCached(spec);
    this.renderer.load(this.character);
    this.brain = new Brain(spec.motion, this.seed);
    this.rig = new Rig(this.character.bones);
    if (options.state) this.brain.setState(options.state);

    canvas.setAttribute('role', 'img');
    this.label();
    this.reducedMotion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

    if (typeof IntersectionObserver !== 'undefined') {
      const io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting));
      io.observe(canvas);
      this.cleanup.push(() => io.disconnect());
    }
    if (this.options.interactive) this.listen();
    scheduler.add(this);
  }

  get state(): MascotState {
    return this.brain.state;
  }

  get spec(): CharacterSpec {
    return this.character.spec;
  }

  get stats() {
    return this.character.stats;
  }

  setState(state: MascotState) {
    if (!STATES.includes(state)) throw new Error(`Unknown state "${state}". Expected one of ${STATES.join(', ')}.`);
    this.brain.setState(state);
    this.stillFrames = 0;
    this.label();
  }

  /** Swaps the character, keeping the state. */
  setSpec(spec: CharacterSpec) {
    const state = this.brain.state;
    this.character = compileCached(spec);
    this.renderer.load(this.character);
    this.brain = new Brain(spec.motion, this.seed);
    this.brain.setState(state);
    this.rig = new Rig(this.character.bones);
    this.stillFrames = 0;
    this.label();
  }

  poke() {
    this.brain.poke();
    this.stillFrames = 0;
  }

  get active() {
    if (!this.visible) return false;
    /* with reduced motion, settle into the state's pose, then stop drawing */
    return !this.reducedMotion?.matches || this.stillFrames < 2;
  }

  tick(dt: number, time: number, quality: number) {
    const still = this.reducedMotion?.matches ?? false;
    if (still) {
      /* jump straight to where the springs would settle, with no waves */
      for (let i = 0; i < 90; i++) this.brain.update(1 / 60);
      time = 0;
      this.stillFrames++;
    } else {
      this.brain.update(dt);
    }
    const pose = this.brain.pose;
    this.rig.update(pose.root, pose.channels, time, still ? 0 : dt);

    const ratio = Math.min(devicePixelRatio || 1, this.options.maxPixelRatio) * quality;
    const width = Math.max(1, Math.round(this.canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * ratio));
    this.renderer.render({
      pose,
      bones: this.rig.inverse,
      time,
      width,
      height,
      shadow: this.options.shadow,
      exposure: this.options.exposure,
    });
  }

  dispose() {
    scheduler.delete(this);
    this.cleanup.forEach((fn) => fn());
    this.renderer.dispose();
  }

  private label() {
    if (!this.canvas.hasAttribute('data-own-label')) this.canvas.setAttribute('aria-label', `${this.character.spec.name}, ${this.brain.state}`);
  }

  private listen() {
    const move = (e: PointerEvent) => {
      const r = this.canvas.getBoundingClientRect();
      const size = Math.max(r.width, 1);
      const x = (e.clientX - (r.left + r.width / 2)) / (size * 1.1);
      const y = (e.clientY - (r.top + r.height * 0.45)) / (size * 1.1);
      this.brain.pointer = Math.hypot(x, y) < 3 ? { x, y } : null;
    };
    const leave = () => (this.brain.pointer = null);
    const click = () => this.poke();
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    this.canvas.addEventListener('click', click);
    this.cleanup.push(() => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      this.canvas.removeEventListener('click', click);
    });
  }
}

/* The public face of the engine: a character, alive on a canvas.

     const mascot = mount(element, volt);
     mascot.setState('thinking');
     mascot.on('poke', () => …);

   Wire `setState` to whatever your agent is doing and the character
   does the rest. */

import { Brain } from '../behavior/brain';
import { Fx } from '../behavior/fx';
import { STATES, type MascotState } from '../behavior/states';
import { compile, type CompiledCharacter } from '../compiler/compile';
import { rng } from '../math/scalar';
import { Rig } from '../rig/rig';
import type { Renderer } from '../render/renderer';
import { WebGL2Renderer } from '../render/webgl2';
import type { CharacterSpec, Vec3 } from '../spec/types';
import { albedo, type Palette } from './customize';
import { scheduler, type Animated } from './scheduler';

export interface MascotOptions {
  /** Where it starts. Default `idle`. */
  state?: MascotState;
  /** 0–1. Desyncs blinks, glances and hops between mascots on one page. Random by default. */
  seed?: number;
  /** Follow the pointer and hop when clicked. Default true. */
  interactive?: boolean;
  /** Effects around the character (z's, sparkles, sound waves…). Default true. */
  effects?: boolean;
  /** Multiplies the pace of everything. Default 1. */
  speed?: number;
  /** Recolour materials by name, e.g. `{ shell: '#e0457b' }`. */
  palette?: Palette;
  /** Cap on device pixels per CSS pixel. Default 2. */
  maxPixelRatio?: number;
  /** The floor shadow's colour, linear RGB. */
  shadow?: Vec3;
  /** Overall brightness. Default 1. */
  exposure?: number;
  /** Respect `prefers-reduced-motion`: hold the state's pose instead of animating. Default true. */
  respectReducedMotion?: boolean;
}

export interface MascotEvents {
  /** Clicked or poked. */
  poke: void;
  state: MascotState;
}

type Listener<T> = (value: T) => void;

/* compiling is pure, so every mascot of one character shares the result */
const compiled = new WeakMap<CharacterSpec, CompiledCharacter>();
export function compileCached(spec: CharacterSpec): CompiledCharacter {
  let c = compiled.get(spec);
  if (!c) compiled.set(spec, (c = compile(spec)));
  return c;
}

export class Mascot implements Animated {
  private character!: CompiledCharacter;
  private brain!: Brain;
  private rig!: Rig;
  private fx!: Fx;
  private readonly renderer: Renderer;
  private readonly options: Required<Omit<MascotOptions, 'state' | 'seed' | 'palette'>>;
  private readonly seed: number;
  private palette: Palette | undefined;
  private albedo!: Float32Array;
  private visible = true;
  private paused = false;
  private time = 0;
  private readonly reducedMotion: MediaQueryList | null;
  private stillFrames = 0;
  private readonly listeners: { [K in keyof MascotEvents]: Set<Listener<MascotEvents[K]>> } = { poke: new Set(), state: new Set() };
  private readonly cleanup: Array<() => void> = [];
  private source!: CharacterSpec;

  constructor(readonly canvas: HTMLCanvasElement, spec: CharacterSpec, options: MascotOptions = {}) {
    this.seed = options.seed ?? Math.random();
    this.palette = options.palette;
    this.options = {
      interactive: options.interactive ?? true,
      effects: options.effects ?? true,
      speed: options.speed ?? 1,
      maxPixelRatio: options.maxPixelRatio ?? 2,
      shadow: options.shadow ?? [0.05, 0.06, 0.12],
      exposure: options.exposure ?? 1,
      respectReducedMotion: options.respectReducedMotion ?? true,
    };
    this.renderer = new WebGL2Renderer(canvas);
    this.load(spec, options.state ?? 'idle');

    canvas.setAttribute('role', 'img');
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

  /** The spec as given; a palette doesn't change it. */
  get spec(): CharacterSpec {
    return this.source;
  }

  get stats() {
    return this.character.stats;
  }

  setState(state: MascotState) {
    if (!STATES.includes(state)) throw new Error(`Unknown state "${state}". Expected one of ${STATES.join(', ')}.`);
    if (state === this.brain.state) return;
    this.brain.setState(state);
    this.stillFrames = 0;
    this.label();
    this.emit('state', state);
  }

  /** Swaps the character, keeping the state. Material names differ between characters, so the palette resets unless you pass one. */
  setSpec(spec: CharacterSpec, palette?: Palette) {
    this.palette = palette;
    this.load(spec, this.brain.state);
  }

  /** Recolours materials by name; `undefined` goes back to the spec's own colours. Cheap enough for a colour picker. */
  setPalette(palette: Palette | undefined) {
    this.albedo = albedo(this.character, palette);
    this.palette = palette;
    this.stillFrames = 0;
  }

  setSpeed(speed: number) {
    this.options.speed = Math.max(0, speed);
  }

  setEffects(on: boolean) {
    this.options.effects = on;
  }

  /** The happy reaction: a hop with a spin. */
  poke() {
    this.brain.poke();
    this.stillFrames = 0;
    this.emit('poke', undefined);
  }

  pause() {
    this.paused = true;
  }

  play() {
    this.paused = false;
  }

  /** Subscribes to an event; returns the unsubscribe function. */
  on<K extends keyof MascotEvents>(event: K, listener: Listener<MascotEvents[K]>): () => void {
    this.listeners[event].add(listener);
    return () => this.listeners[event].delete(listener);
  }

  get active() {
    if (!this.visible || this.paused) return false;
    /* with reduced motion, settle into the state's pose, then stop drawing */
    return !this.still || this.stillFrames < 2;
  }

  tick(dt: number, _time: number, quality: number) {
    const still = this.still;
    const step = dt * this.options.speed;
    if (still) {
      /* jump straight to where the springs would settle, with no waves */
      for (let i = 0; i < 90; i++) this.brain.update(1 / 60);
      this.stillFrames++;
    } else {
      this.brain.update(step);
      this.time += step;
    }
    const time = still ? 0 : this.time;
    const pose = this.brain.pose;
    this.rig.update(pose.root, pose.channels, pose.weights, time, still ? 0 : step);
    if (!still && this.options.effects) this.fx.update(step, pose, this.rig);
    else this.fx.count = 0;
    pose.events.length = 0;

    const ratio = Math.min(devicePixelRatio || 1, this.options.maxPixelRatio) * quality;
    this.renderer.render({
      pose,
      bones: this.rig.inverse,
      fx: this.fx,
      albedo: this.albedo,
      time,
      width: Math.max(1, Math.round(this.canvas.clientWidth * ratio)),
      height: Math.max(1, Math.round(this.canvas.clientHeight * ratio)),
      shadow: this.options.shadow,
      exposure: this.options.exposure,
    });
  }

  dispose() {
    scheduler.delete(this);
    this.cleanup.forEach((fn) => fn());
    this.listeners.poke.clear();
    this.listeners.state.clear();
    this.renderer.dispose();
  }

  private load(spec: CharacterSpec, state: MascotState) {
    this.source = spec;
    this.character = compileCached(spec);
    this.albedo = albedo(this.character, this.palette);
    this.renderer.load(this.character);
    this.brain = new Brain(spec.motion, this.seed);
    this.brain.setState(state);
    this.rig = new Rig(this.character.bones, this.character.acting);
    this.fx = new Fx(this.character, rng(this.seed + 0.37));
    this.stillFrames = 0;
    this.label();
  }

  private get still() {
    return this.options.respectReducedMotion && (this.reducedMotion?.matches ?? false);
  }

  private emit<K extends keyof MascotEvents>(event: K, value: MascotEvents[K]) {
    for (const l of this.listeners[event]) l(value);
  }

  private label() {
    if (!this.canvas.hasAttribute('data-own-label')) this.canvas.setAttribute('aria-label', `${this.source.name}, ${this.brain.state}`);
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

/**
 * The shortest way in: creates a canvas that fills `container` and puts a
 * mascot on it. `dispose()` removes the canvas again.
 */
export function mount(container: HTMLElement, spec: CharacterSpec, options: MascotOptions = {}): Mascot {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:manipulation';
  container.append(canvas);
  const mascot = new Mascot(canvas, spec, options);
  const dispose = mascot.dispose.bind(mascot);
  mascot.dispose = () => {
    dispose();
    canvas.remove();
  };
  return mascot;
}

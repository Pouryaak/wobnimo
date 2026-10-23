/* Browsers cap how many WebGL contexts a page may hold (about sixteen on a
   desktop, fewer on a phone), and this page has more mascots than that.
   So each mascot lives in a slot: the slot creates its mascot when it
   scrolls near the viewport, and once the page is over budget the pool
   releases whichever slot has been out of sight the longest. A slot keeps
   everything it was told (state, palette, speed), so a mascot that comes
   back picks up where it was. */

import { Mascot, type CharacterSpec, type MascotOptions, type MascotState, type Palette } from '@wobnimo/engine';

export interface SlotOptions extends MascotOptions {
  /** Never released: the main stage. */
  pinned?: boolean;
  /** Called every time a mascot is created for the slot. */
  onMount?: (mascot: Mascot) => void;
}

export class Slot {
  mascot: Mascot | null = null;
  near = false;
  lastNear = 0;
  private readonly placeholder: HTMLElement;

  constructor(
    readonly host: HTMLElement,
    private current: CharacterSpec,
    private readonly options: SlotOptions,
  ) {
    host.classList.add('slot');
    this.placeholder = document.createElement('span');
    this.placeholder.className = 'placeholder';
    this.placeholder.setAttribute('aria-hidden', 'true');
    host.append(this.placeholder);
  }

  get spec() {
    return this.current;
  }

  get pinned() {
    return this.options.pinned ?? false;
  }

  setState(state: MascotState) {
    this.options.state = state;
    this.mascot?.setState(state);
  }

  setSpec(spec: CharacterSpec) {
    this.current = spec;
    this.options.palette = undefined;
    this.mascot?.setSpec(spec);
  }

  setPalette(palette: Palette | undefined) {
    this.options.palette = palette;
    this.mascot?.setPalette(palette);
  }

  setSpeed(speed: number) {
    this.options.speed = speed;
    this.mascot?.setSpeed(speed);
  }

  setEffects(on: boolean) {
    this.options.effects = on;
    this.mascot?.setEffects(on);
  }

  mount() {
    if (this.mascot) return;
    const canvas = document.createElement('canvas');
    this.host.append(canvas);
    this.mascot = new Mascot(canvas, this.current, this.options);
    this.placeholder.hidden = true;
    this.options.onMount?.(this.mascot);
  }

  release() {
    if (!this.mascot) return;
    const canvas = this.mascot.canvas;
    this.mascot.dispose();
    canvas.remove();
    this.mascot = null;
    this.placeholder.hidden = false;
  }
}

export class Pool {
  private readonly slots = new Map<Element, Slot>();
  private readonly observer: IntersectionObserver;

  constructor(private readonly budget: number) {
    this.observer = new IntersectionObserver(
      (entries) => {
        const now = performance.now();
        for (const e of entries) {
          const slot = this.slots.get(e.target);
          if (!slot) continue;
          slot.near = e.isIntersecting;
          slot.lastNear = now;
          if (slot.near) this.ensure(slot);
        }
      },
      { rootMargin: '240px' },
    );
  }

  add(host: HTMLElement, spec: CharacterSpec, options: SlotOptions = {}): Slot {
    const slot = new Slot(host, spec, { ...options });
    this.slots.set(host, slot);
    this.observer.observe(host);
    return slot;
  }

  /** How many mascots are drawing this frame. */
  get running(): number {
    let n = 0;
    for (const s of this.slots.values()) if (s.mascot?.active) n++;
    return n;
  }

  private ensure(slot: Slot) {
    if (slot.mascot) return;
    const live = [...this.slots.values()].filter((s) => s.mascot);
    if (live.length >= this.budget) {
      const victim = live.filter((s) => !s.near && !s.pinned).sort((a, b) => a.lastNear - b.lastNear)[0];
      victim?.release();
    }
    slot.mount();
  }
}

/* One animation loop for every mascot on the page. It sleeps while the
   tab is hidden, skips mascots scrolled out of view, and trades
   resolution for frame rate when the GPU falls behind. */

export interface Animated {
  /** Whether it is worth drawing this frame (on screen, not settled). */
  readonly active: boolean;
  tick(dt: number, time: number, quality: number): void;
}

const MIN_QUALITY = 0.55;

class Scheduler {
  private readonly members = new Set<Animated>();
  private frame = 0;
  private last = 0;
  private time = 0;
  /** Resolution scale, adapted to how long frames take. */
  private quality = 1;
  private slow = 0;
  private fast = 0;

  add(m: Animated) {
    this.members.add(m);
    this.start();
  }

  delete(m: Animated) {
    this.members.delete(m);
    if (!this.members.size) this.stop();
  }

  private start() {
    if (this.frame || typeof requestAnimationFrame === 'undefined') return;
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.loop);
  }

  private stop() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private readonly loop = (now: number) => {
    this.frame = requestAnimationFrame(this.loop);
    /* a long gap means the tab was hidden: carry on from where it was */
    const dt = Math.min((now - this.last) / 1000, 1 / 20);
    this.adapt(now - this.last);
    this.last = now;
    this.time += dt;
    for (const m of this.members) if (m.active) m.tick(dt, this.time, this.quality);
  };

  /* below ~45 fps for a while, render fewer pixels; well above 60, earn them back */
  private adapt(ms: number) {
    if (ms > 22 && ms < 200) this.slow++;
    else this.slow = Math.max(0, this.slow - 1);
    if (ms < 17.5) this.fast++;
    else this.fast = 0;
    if (this.slow > 20) {
      this.quality = Math.max(MIN_QUALITY, this.quality * 0.85);
      this.slow = 0;
    } else if (this.fast > 120 && this.quality < 1) {
      this.quality = Math.min(1, this.quality * 1.08);
      this.fast = 0;
    }
  }
}

export const scheduler = new Scheduler();

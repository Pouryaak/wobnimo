/** A damped harmonic spring: frequency in Hz, damping as a ratio (1 is critical). */
export class Spring {
  v = 0;
  constructor(public x = 0) {}

  step(target: number, dt: number, freq: number, damping: number): number {
    const w = freq * Math.PI * 2;
    this.v += (w * w * (target - this.x) - 2 * damping * w * this.v) * dt;
    this.x += this.v * dt;
    return this.x;
  }
}

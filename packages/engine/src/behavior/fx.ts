/* Effects around a character: z's drifting off a sleeper, sound coming
   out of a mouth, sparkles when it's happy, dust when it lands. Emitters
   are data, tied to the character's named anchors and to the moments the
   brain reports (a syllable, a landing). Particles live in world space and
   are drawn by the same shader as the body, so the body can hide them. */

import type { Pose } from './brain';
import type { CompiledCharacter } from '../compiler/compile';
import { smoothstep } from '../math/scalar';
import type { Rig } from '../rig/rig';
import type { EmitterSpec, FxSpec, FxTrigger, Glyph, Vec3 } from '../spec/types';

export const MAX_PARTICLES = 32;

export const GLYPH_ID: Record<Glyph, number> = {
  z: 0, bubble: 1, sparkle: 2, heart: 3, note: 4, arc: 5, puff: 6, ring: 7, drop: 8, spark: 9, mote: 10, feather: 11, dot: 12,
};

/** The effects every character gets unless its spec replaces them. */
export const DEFAULT_FX: FxSpec = {
  sleeping: [
    { glyph: 'z', anchor: 'top', rate: 0.55, offset: [0.12, 0.04, 0.05], spread: 0.02, velocity: [0.07, 0.13, 0], jitter: 0.015, wobble: 0.05, life: [3, 3.6], size: [0.045, 0.12], rotation: -0.2, spin: 0.12, color: '#7f88ad' },
  ],
  thinking: [
    { glyph: 'dot', anchor: 'top', rate: 1.1, offset: [0.16, 0.02, 0.06], spread: 0.01, velocity: [0.05, 0.11, 0], jitter: 0.01, wobble: 0.02, life: [1.5, 1.8], size: [0.012, 0.04], color: '#a3abc9' },
  ],
  listening: [
    { glyph: 'arc', anchor: 'ear', rate: 1.5, offset: [-0.4, 0, 0.04], velocity: [0.3, 0, 0], life: [1.05, 1.2], size: [0.1, 0.05], rotation: 0, color: '#5cc489' },
  ],
  syllable: [
    { glyph: 'arc', anchor: 'mouth', rate: 2, offset: [0.1, 0, 0.06], mirror: true, velocity: [0.24, 0.02, 0.04], jitter: 0.02, life: [0.55, 0.7], size: [0.03, 0.085], rotation: 0, color: '#6aaee6' },
  ],
  'enter:happy': [
    { glyph: 'sparkle', anchor: 'top', rate: 7, spread: 0.22, velocity: [0, 0.3, 0.05], jitter: 0.4, gravity: 0.5, drag: 1.5, life: [0.7, 1.1], size: [0.06, 0], spin: 2.4, color: '#ffc94d' },
    { glyph: 'heart', anchor: 'top', rate: 2, spread: 0.12, velocity: [0, 0.32, 0.05], jitter: 0.15, wobble: 0.06, life: [1, 1.3], size: [0.045, 0.08], color: '#ff6b8f' },
  ],
  happy: [
    { glyph: 'sparkle', anchor: 'top', rate: 2.5, spread: 0.35, velocity: [0, 0.14, 0], jitter: 0.1, life: [0.6, 0.9], size: [0.045, 0], spin: 1.6, color: '#ffd166' },
  ],
  land: [
    { glyph: 'puff', anchor: 'feet', rate: 7, spread: 0.1, velocity: [0, 0.05, 0], jitter: 0.32, drag: 3.5, life: [0.45, 0.7], size: [0.05, 0.12], color: '#c4cad9' },
  ],
};

interface Particle {
  pos: Vec3;
  vel: Vec3;
  age: number;
  life: number;
  size: [number, number];
  rot: number;
  spec: EmitterSpec;
  color: Vec3;
  seed: number;
}

/* hex to display-space RGB: particles are drawn after tone mapping */
function display(hex: string): Vec3 {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/* the angle that points a glyph along a velocity (drops trail their tip behind) */
function aligned(glyph: Glyph, v: Vec3): number {
  return glyph === 'drop' ? Math.atan2(v[0], -v[1]) : Math.atan2(v[1], v[0]);
}

export class Fx {
  /** Packed for upload: position + size, glyph + alpha + rotation + glow, colour + seed. */
  readonly a = new Float32Array(MAX_PARTICLES * 4);
  readonly b = new Float32Array(MAX_PARTICLES * 4);
  readonly c = new Float32Array(MAX_PARTICLES * 4);
  count = 0;

  private readonly emitters: Partial<Record<FxTrigger, EmitterSpec[]>> = {};
  private readonly carry = new Map<EmitterSpec, number>();
  private particles: Particle[] = [];

  constructor(
    private readonly character: CompiledCharacter,
    private readonly random: () => number,
  ) {
    const own = character.spec.fx ?? {};
    const triggers = new Set([...Object.keys(DEFAULT_FX), ...Object.keys(own)].filter((k) => k !== 'replace') as FxTrigger[]);
    for (const trigger of triggers) {
      const mine = own[trigger] ?? [];
      const list = own.replace?.includes(trigger) ? mine : [...(DEFAULT_FX[trigger] ?? []), ...mine];
      /* a default that needs an anchor this body doesn't have is skipped */
      this.emitters[trigger] = list.filter((e) => character.anchors[e.anchor]);
    }
  }

  update(dt: number, pose: Pose, rig: Rig) {
    /* continuous emitters: the current expression's, faded by its weight, and the ambient ones */
    for (const e of this.emitters[pose.expression] ?? []) this.emitContinuous(e, dt * pose.weights[pose.expression], rig);
    for (const e of this.emitters.ambient ?? []) this.emitContinuous(e, dt, rig);
    for (const event of pose.events) for (const e of this.emitters[event] ?? []) this.burst(e, e.rate, rig);

    const alive: Particle[] = [];
    for (const p of this.particles) {
      p.age += dt;
      if (p.age >= p.life) continue;
      const s = p.spec;
      p.vel[1] -= (s.gravity ?? 0) * dt;
      const drag = Math.max(0, 1 - (s.drag ?? 0) * dt);
      for (let k = 0; k < 3; k++) {
        p.vel[k] *= drag;
        p.pos[k] += p.vel[k] * dt;
      }
      if (s.wobble) p.pos[0] += Math.cos(p.age * 3.1 + p.seed * 6.28) * s.wobble * dt * 3;
      p.rot = s.align ? aligned(s.glyph, p.vel) : p.rot + (s.spin ?? 0) * dt;
      alive.push(p);
    }
    this.particles = alive.slice(-MAX_PARTICLES);
    this.pack();
  }

  private emitContinuous(e: EmitterSpec, dt: number, rig: Rig) {
    const n = (this.carry.get(e) ?? this.random()) + e.rate * dt;
    const whole = Math.floor(n);
    this.carry.set(e, n - whole);
    if (whole > 0) this.burst(e, whole, rig);
  }

  private burst(e: EmitterSpec, count: number, rig: Rig) {
    const anchor = this.character.anchors[e.anchor];
    const r = this.random;
    for (let i = 0; i < count; i++) {
      const flip = e.mirror && i % 2 === 1 ? -1 : 1;
      const off = e.offset ?? [0, 0, 0];
      const spread = e.spread ?? 0;
      const local: Vec3 = [
        anchor.at[0] + off[0] * flip + (r() - 0.5) * 2 * spread,
        anchor.at[1] + off[1] + (r() - 0.5) * 2 * spread,
        anchor.at[2] + off[2] + (r() - 0.5) * 2 * spread,
      ];
      const j = e.jitter ?? 0;
      const vel: Vec3 = [e.velocity[0] * flip + (r() - 0.5) * 2 * j, e.velocity[1] + (r() - 0.5) * j, e.velocity[2] + (r() - 0.5) * 2 * j];
      this.particles.push({
        pos: rig.point(anchor.bone, local),
        vel,
        age: 0,
        life: e.life[0] + (e.life[1] - e.life[0]) * r(),
        size: e.size,
        rot: e.align ? aligned(e.glyph, vel) : flip < 0 ? Math.PI - (e.rotation ?? 0) : (e.rotation ?? 0) + (e.spin ? r() : 0),
        spec: e,
        color: display(e.color),
        seed: r(),
      });
    }
  }

  private pack() {
    this.count = this.particles.length;
    this.particles.forEach((p, i) => {
      const f = p.age / p.life;
      const grow = 1 - (1 - f) * (1 - f);
      const alpha = smoothstep(0, 0.12, f) * (1 - smoothstep(0.62, 1, f));
      const o = i * 4;
      this.a.set([p.pos[0], p.pos[1], p.pos[2], p.size[0] + (p.size[1] - p.size[0]) * grow], o);
      this.b.set([GLYPH_ID[p.spec.glyph], alpha, p.rot, p.spec.glow ? 1 : 0], o);
      this.c.set([p.color[0], p.color[1], p.color[2], p.seed], o);
    });
  }
}

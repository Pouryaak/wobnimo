/* The skeleton. Every frame each bone's rotation is its rest pose plus
   the channels that drive it plus its idle wave plus the acting of the
   current expression (cross-faded by weight); jiggle bones then let
   their tip lag behind on a spring, which gives antennas, ears, wings and
   tentacles their follow-through without a single keyframe. The output
   is one world → bone matrix per bone, which is what the shader reads. */

import type { ResolvedBone } from '../compiler/resolve';
import { fromAxisAngle, fromEuler, fromTranslation, invert, mat4, multiply, transformDir, transformPoint, type Mat4 } from '../math/mat4';
import { clamp } from '../math/scalar';
import { add, cross, dot, length, normalize, scale, sub } from '../math/vec3';
import type { Axis, Channel, Expression, Motion, Vec3 } from '../spec/types';

export type Channels = Record<Channel, number> & {
  /** Scales idle waves: low when asleep, high when excited. */
  energy: number;
};

interface Tip {
  x: Vec3;
  v: Vec3;
}

const AXES: Axis[] = ['rx', 'ry', 'rz'];

/** Per bone: per expression, per axis, a motion. */
export type BoneActing = Array<Array<[Expression, Axis, Motion]>>;

function evaluate(m: Motion, time: number): number {
  if (typeof m === 'number') return m;
  const [base, amp = 0, hz = 0, phase = 0] = m;
  return base + amp * Math.sin(time * hz * Math.PI * 2 + phase);
}

export class Rig {
  readonly world: Mat4[];
  /** World → bone, packed for upload: 16 floats per bone. */
  readonly inverse: Float32Array;
  private readonly tips: Array<Tip | null>;
  /** Spin accumulated by acting, per bone and axis. */
  private readonly spun: Array<Record<Axis, number>>;
  private readonly scratch = { t: mat4(), r: mat4(), j: mat4(), inv: mat4() };

  constructor(
    private readonly bones: ResolvedBone[],
    private readonly acting: BoneActing = bones.map(() => []),
  ) {
    this.world = bones.map(() => mat4());
    this.inverse = new Float32Array(bones.length * 16);
    this.tips = bones.map(() => null);
    this.spun = bones.map(() => ({ rx: 0, ry: 0, rz: 0 }));
  }

  /** A point in a bone's space, in world space, as of the last update. */
  point(bone: number, at: Vec3): Vec3 {
    return transformPoint(this.world[bone], at);
  }

  /**
   * Poses the skeleton. `root` places the whole character, `weights` blends
   * each expression's acting, `dt` steps the jiggle springs and spins.
   */
  update(root: Mat4, ch: Channels, weights: Record<Expression, number>, time: number, dt: number) {
    const { t, r, j, inv } = this.scratch;
    this.world[0].set(root);
    for (let i = 1; i < this.bones.length; i++) {
      const bone = this.bones[i];
      const angle = { rx: bone.rest?.rx ?? 0, ry: bone.rest?.ry ?? 0, rz: bone.rest?.rz ?? 0 };
      for (const axis of AXES) {
        for (const [channel, weight] of bone.drive?.[axis] ?? []) angle[axis] += ch[channel] * weight;
        const w = bone.wave?.[axis];
        if (w) angle[axis] += w[0] * ch.energy * Math.sin(time * w[1] * Math.PI * 2 + w[2]);
      }
      for (const [expression, axis, motion] of this.acting[i]) {
        const weight = weights[expression];
        if (weight < 1e-3 && !(Array.isArray(motion) && motion[4])) continue;
        angle[axis] += weight * evaluate(motion, time);
        if (Array.isArray(motion) && motion[4]) this.spun[i][axis] += weight * motion[4] * dt;
      }
      for (const axis of AXES) angle[axis] += this.spun[i][axis];
      const out = this.world[i];
      multiply(out, this.world[bone.parentIndex], fromTranslation(t, ...bone.pivot));
      multiply(out, out, fromEuler(r, angle.rx, angle.ry, angle.rz));
      if (bone.jiggle) multiply(out, out, this.jiggle(i, out, dt, j, inv));
    }
    for (let i = 0; i < this.bones.length; i++) this.inverse.set(invert(inv, this.world[i]), i * 16);
  }

  /* The bone's tip is a point mass chasing where the tip would be at rest.
     Returns the extra rotation, in the bone's space, that points it there. */
  private jiggle(i: number, posed: Mat4, dt: number, out: Mat4, inv: Mat4): Mat4 {
    const { axis, length: len, freq, damping, maxAngle = 0.9 } = this.bones[i].jiggle!;
    const anchor = transformPoint(posed, [0, 0, 0]);
    const restTip = add(anchor, scale(normalize(transformDir(posed, axis)), len));
    let tip = this.tips[i];
    if (!tip || !(dt > 0)) {
      tip = this.tips[i] = tip ?? { x: restTip, v: [0, 0, 0] };
      if (!(dt > 0)) return fromAxisAngle(out, [0, 1, 0], 0);
    }
    const w = freq * Math.PI * 2;
    for (let k = 0; k < 3; k++) {
      tip.v[k] += (w * w * (restTip[k] - tip.x[k]) - 2 * damping * w * tip.v[k]) * dt;
      tip.x[k] += tip.v[k] * dt;
    }
    /* keep the bone its own length */
    tip.x = add(anchor, scale(normalize(sub(tip.x, anchor)), len));

    invert(inv, posed);
    const want = normalize(transformDir(inv, sub(tip.x, anchor)));
    const rest = normalize(axis);
    const turn = cross(rest, want);
    const s = length(turn);
    if (s < 1e-6) return fromAxisAngle(out, [0, 1, 0], 0);
    const angle = clamp(Math.atan2(s, dot(rest, want)), 0, maxAngle);
    return fromAxisAngle(out, scale(turn, 1 / s), angle);
  }
}

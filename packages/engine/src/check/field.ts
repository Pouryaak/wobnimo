/* A character's distance field on the CPU: the same parts, in the same
   order, combined the same way as the shader's map(), posed by the real
   rig. It answers the questions a render would, with numbers: is this
   point inside the body, which material is nearest, what does a ray from
   the camera hit. */

import { resolve, type Resolved } from '../compiler/resolve';
import { fromEuler, fromTranslation, invert, mat4, transformPoint, type Mat4 } from '../math/mat4';
import { Rig } from '../rig/rig';
import type { CharacterSpec, Expression, PartSpec, Vec3 } from '../spec/types';
import { EXPRESSIONS } from '../behavior/states';
import { partDistance, smax, smin } from './sdf';

/** The camera the renderer uses (webgl2.ts): a long lens, tilted down a little. */
export const TAN_HALF_FOV = 0.2;
export const CAMERA_PITCH = 0.1;

interface CompiledPart {
  spec: PartSpec;
  bone: number;
  at: Vec3;
  /** The part's rotation, row-major, or null for none. */
  rot: number[] | null;
  clip: { normal: Vec3; offset: number } | null;
}

export interface Hit {
  d: number;
  /** Material id: 1-based in spec order; the eyes come after. */
  id: number;
}

/** Skeleton matrices for one pose: bone → world and world → bone. */
export interface Posed {
  world: Mat4[];
  inverse: Mat4[];
}

/** Poses the skeleton the way the renderer would, holding one expression at `time` seconds in. */
export function pose(r: Resolved, expression: Expression = 'idle', time = 0, drive: Partial<Record<'talk' | 'flap', number>> = {}): Posed {
  /* a floating character rests at its hover height, as the behaviour layer holds it */
  const hover = r.spec.motion?.float ?? 0;
  const rig = new Rig(r.bones, r.acting);
  const weights = Object.fromEntries(EXPRESSIONS.map((e) => [e, e === expression ? 1 : 0])) as Record<Expression, number>;
  const channels = { yaw: 0, pitch: 0, roll: 0, flap: 0, talk: 0, energy: 0, ...drive };
  rig.update(fromTranslation(mat4(), 0, hover, 0), channels, weights, time, 0);
  return { world: rig.world.map((m) => m.slice()), inverse: rig.world.map((m) => invert(mat4(), m)) };
}

const rowMajor = (rot: Vec3) => {
  const m = fromEuler(mat4(), rot[0], rot[1], rot[2]);
  return [m[0], m[4], m[8], m[1], m[5], m[9], m[2], m[6], m[10]];
};

const unit = (v: Vec3): Vec3 => {
  const n = Math.hypot(...v) || 1;
  return [v[0] / n, v[1] / n, v[2] / n];
};

export class Field {
  readonly r: Resolved;
  readonly parts: CompiledPart[];
  posed: Posed;

  constructor(readonly spec: CharacterSpec) {
    this.r = resolve(spec);
    this.parts = spec.parts.map((p, i) => ({
      spec: p,
      bone: this.r.boneIndex(p.bone, `parts[${i}]`),
      at: p.at ?? [0, 0, 0],
      rot: p.rot ? rowMajor(p.rot) : null,
      clip: p.clip ? { normal: unit(p.clip.normal), offset: p.clip.offset ?? 0 } : null,
    }));
    this.posed = pose(this.r);
  }

  /** A point from a bone's space into the world, in the current pose. */
  toWorld(bone: number, at: Vec3): Vec3 {
    return transformPoint(this.posed.world[bone], at);
  }

  toBone(bone: number, p: Vec3): Vec3 {
    return transformPoint(this.posed.inverse[bone], p);
  }

  /** A world point into part `i`'s own space. */
  toPart(i: number, p: Vec3): Vec3 {
    const part = this.parts[i];
    const b = this.toBone(part.bone, p);
    const d: Vec3 = [b[0] - part.at[0], b[1] - part.at[1], b[2] - part.at[2]];
    const m = part.rot;
    /* the inverse rotation is the transpose: rows become columns */
    return m ? [m[0] * d[0] + m[3] * d[1] + m[6] * d[2], m[1] * d[0] + m[4] * d[1] + m[7] * d[2], m[2] * d[0] + m[5] * d[1] + m[8] * d[2]] : d;
  }

  /** A point in part `i`'s own space back into the world. */
  fromPart(i: number, l: Vec3): Vec3 {
    const part = this.parts[i];
    const m = part.rot;
    const b: Vec3 = m ? [m[0] * l[0] + m[1] * l[1] + m[2] * l[2], m[3] * l[0] + m[4] * l[1] + m[5] * l[2], m[6] * l[0] + m[7] * l[1] + m[8] * l[2]] : l;
    return this.toWorld(part.bone, [b[0] + part.at[0], b[1] + part.at[1], b[2] + part.at[2]]);
  }

  /** Part `i` on its own, clip included, in its own space. */
  localDistance(i: number, l: Vec3): number {
    const part = this.parts[i];
    const d = partDistance(part.spec, l);
    const c = part.clip;
    return c ? Math.max(d, l[0] * c.normal[0] + l[1] * c.normal[1] + l[2] * c.normal[2] - c.offset) : d;
  }

  /** Part `i` on its own, at a world point. */
  partDistance(i: number, p: Vec3): number {
    return this.localDistance(i, this.toPart(i, p));
  }

  /**
   * The whole character at `p`, exactly as the shader's map() combines it.
   * `skip` leaves one part out; `eyes: false` leaves the eyes out.
   */
  map(p: Vec3, skip = -1, eyes = true): Hit {
    let d = 1e9;
    let id = 0;
    for (let i = 0; i < this.parts.length; i++) {
      if (i === skip) continue;
      const part = this.parts[i].spec;
      if (part.shape === 'hem') {
        const l = this.toPart(i, p);
        d = smax(d, part.y + part.amplitude * Math.sin(Math.atan2(l[2], l[0]) * part.waves) - l[1], part.blend);
        continue;
      }
      const di = this.partDistance(i, p);
      const k = part.blend ?? 0;
      if (part.op === 'sub') {
        d = k > 0 ? smax(d, -di, k) : Math.max(d, -di);
      } else {
        if (di < d) id = this.r.materialId(part.material, '');
        d = k > 0 ? smin(d, di, k) : Math.min(d, di);
      }
    }
    if (eyes && this.spec.eyes) {
      for (let e = 0; e < 2; e++) {
        const de = this.eyeDistance(e, p);
        if (de < d) {
          d = de;
          id = this.spec.eyes.kind === 'ball' ? this.r.eyeIds[e] : this.r.materialId(this.spec.eyes.material, 'eyes');
        }
      }
    }
    return { d, id };
  }

  /** One eye, open and looking ahead, the way it rests in idle. */
  eyeDistance(e: number, p: Vec3): number {
    const eyes = this.spec.eyes!;
    const b = this.toBone(this.r.boneIndex(eyes.bone, 'eyes'), p);
    const at = eyes.at[e];
    const l: Vec3 = [b[0] - at[0], b[1] - at[1], b[2] - at[2]];
    if (eyes.kind === 'ball') return Math.hypot(...l) - eyes.radius;
    const [rx, ry, rz] = eyes.radii;
    const k0 = Math.hypot(l[0] / rx, l[1] / ry, l[2] / rz);
    const k1 = Math.hypot(l[0] / (rx * rx), l[1] / (ry * ry), l[2] / (rz * rz));
    return (k0 * (k0 - 1)) / Math.max(k1, 1e-6);
  }

  /** The surface normal at `p`, from the field's gradient. */
  normal(p: Vec3, skip = -1, eyes = true): Vec3 {
    const e = 0.0006;
    const g: Vec3 = [0, 0, 0];
    for (let k = 0; k < 3; k++) {
      const a: Vec3 = [p[0], p[1], p[2]];
      const b: Vec3 = [p[0], p[1], p[2]];
      a[k] += e;
      b[k] -= e;
      g[k] = this.map(a, skip, eyes).d - this.map(b, skip, eyes).d;
    }
    return unit(g);
  }

  /** Where the camera sits for this character's framing. */
  camera(): Vec3 {
    const distance = this.spec.frame.radius / TAN_HALF_FOV;
    return [0, this.spec.frame.target + distance * Math.sin(CAMERA_PITCH), distance * Math.cos(CAMERA_PITCH)];
  }

  /** Marches from `from` toward `to`; returns the distance travelled at the first hit, or null. */
  march(from: Vec3, to: Vec3, eyes = true, epsilon = 0.0015): { t: number; at: Vec3; hit: Hit } | null {
    const dir: Vec3 = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
    const total = Math.hypot(...dir);
    const u: Vec3 = [dir[0] / total, dir[1] / total, dir[2] / total];
    /* nothing lies further from the root than the bound, so stop once past it */
    const far = Math.min(total, this.spec.bound.radius * 2 + Math.hypot(from[0], from[1] - this.spec.bound.y, from[2]) + 0.5);
    let t = 0;
    for (let i = 0; i < 160 && t < far; i++) {
      const at: Vec3 = [from[0] + u[0] * t, from[1] + u[1] * t, from[2] + u[2] * t];
      const hit = this.map(at, -1, eyes);
      if (hit.d < epsilon) return { t, at, hit };
      t += Math.max(hit.d * 0.9, epsilon * 0.5);
    }
    return null;
  }

  /** Can the camera see the surface point `p`? */
  visible(p: Vec3): boolean {
    const cam = this.camera();
    const n = this.normal(p);
    const v = unit([cam[0] - p[0], cam[1] - p[1], cam[2] - p[2]]);
    if (n[0] * v[0] + n[1] * v[1] + n[2] * v[2] < 0.05) return false;
    const start: Vec3 = [p[0] + n[0] * 0.006, p[1] + n[1] * 0.006, p[2] + n[2] * 0.006];
    return this.march(start, cam) === null;
  }

  /** The material name for an id from map(). */
  materialName(id: number): string {
    const m = this.r.materials.find((x) => x.id === id);
    if (m) return m.name;
    return id === this.r.eyeIds[0] || id === this.r.eyeIds[1] ? 'eye' : 'nothing';
  }
}

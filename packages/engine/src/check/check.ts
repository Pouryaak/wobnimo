/* The spec checker. A render shows a person what went wrong; this tells
   an agent, in words and numbers, before anything is drawn. It measures
   the character the way the shader will draw it (field.ts) and reports
   what a look at the picture would reveal: parts buried inside other
   parts, eyes sunk into the head or floating off it, paint that never
   touches a surface, a body that hovers over the floor or pokes out of
   its own bounds. Every finding names the field and, where it can, the
   exact value that fixes it. */

import { STATES } from '../behavior/states';
import { SpecError } from '../compiler/resolve';
import { rng } from '../math/scalar';
import { transformPoint } from '../math/mat4';
import type { CharacterSpec, Vec3 } from '../spec/types';
import { Field, pose } from './field';
import { partBox } from './sdf';
import { validate } from './validate';

export type Level = 'error' | 'warning' | 'note';

export interface Issue {
  level: Level;
  /** The spec field it is about, as a path: `parts[3]`, `eyes.at[0]`, `bound`. */
  where: string;
  message: string;
  /** What to change, with values when they can be worked out. */
  fix?: string;
}

export interface PartReport {
  index: number;
  /** Share of the part's own surface that ends up on the outside of the body, 0–1. */
  shows: number;
  /** Share of its surface the camera can see from the front, 0–1. */
  seen: number;
}

export interface CheckReport {
  id: string;
  name: string;
  /** No errors. Warnings may still be worth fixing. */
  ok: boolean;
  issues: Issue[];
  parts: PartReport[];
  /** The body's extent at rest, in world units. */
  extents: { min: Vec3; max: Vec3 } | null;
  /** Bound and frame that fit the body as measured, across every state. */
  suggested: { bound: { y: number; radius: number }; frame: { target: number; radius: number } } | null;
  stats: { parts: number; bones: number; materials: number; bytes: number };
  /** A camera frame on the face, for close-up previews. */
  closeup: { target: number; radius: number };
}

/** Surface samples tried per part: enough to find a sliver that shows, quick enough for a CLI. */
const SAMPLES = 260;
/** At most this many exposed samples per part are ray-traced to the camera. */
const SIGHT_SAMPLES = 48;
/** Inside or outside by more than this counts; less is the surface itself. */
const EPS = 0.004;

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const r2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (v: Vec3) => `[${v.map(r3).join(', ')}]`;
const up2 = (n: number) => Math.ceil(n * 100) / 100;

function describePart(spec: CharacterSpec, i: number): string {
  const p = spec.parts[i];
  return `parts[${i}] (${p.shape}, ${p.material} on ${p.bone})`;
}

interface Sample {
  part: number;
  bone: number;
  /** In the part's bone space, so it can be re-posed. */
  local: Vec3;
  world: Vec3;
}

/** Checks a character spec and reports what would look wrong once rendered. Pure: no DOM, no GPU. */
export function checkCharacter(spec: CharacterSpec): CheckReport {
  const issues: Issue[] = validate(spec);
  const base = {
    id: String(spec?.id ?? '?'),
    name: String(spec?.name ?? '?'),
    parts: [] as PartReport[],
    closeup: { target: Number(spec?.frame?.target) || 0.5, radius: (Number(spec?.frame?.radius) || 0.8) * 0.5 },
    extents: null,
    suggested: null,
    stats: {
      parts: Array.isArray(spec?.parts) ? spec.parts.length : 0,
      bones: Array.isArray(spec?.bones) ? spec.bones.length + 1 : 0,
      materials: spec?.materials ? Object.keys(spec.materials).length : 0,
      bytes: JSON.stringify(spec ?? {}).length,
    },
  };
  const done = (more: Partial<CheckReport> = {}): CheckReport => {
    const all = [...issues, ...(more.issues ?? [])];
    const rank = { error: 0, warning: 1, note: 2 };
    all.sort((a, b) => rank[a.level] - rank[b.level]);
    return { ...base, ...more, issues: all, ok: !all.some((i) => i.level === 'error') };
  };

  /* the geometry checks need a spec that at least resolves */
  if (issues.some((i) => i.level === 'error')) return done();
  let field: Field;
  try {
    field = new Field(spec);
  } catch (e) {
    issues.push({ level: 'error', where: 'spec', message: e instanceof SpecError ? e.message.replace(/^[^:]+: /, '') : String(e) });
    return done();
  }

  const found: Issue[] = [];
  const add = (level: Level, where: string, message: string, fix?: string) => found.push({ level, where, message, fix });
  const random = rng(0.37);

  /* ---- every part: does any of it show, and can the camera see it? ---- */

  const exposed: Sample[] = [];
  const reports: PartReport[] = [];
  /* each solid part's surface samples, at rest, for the attachment check */
  const surfaces = new Map<number, Vec3[]>();
  const backOnly: number[] = [];
  const rest = field.posed;
  /* poses that open what idle keeps shut: a talking jaw, flapping wings, big acting */
  const moving = [
    pose(field.r, 'speaking', 0.2, { talk: 1 }),
    pose(field.r, 'celebrating', 0.4, { flap: 1, talk: 1 }),
    pose(field.r, 'surprised', 0.3, { talk: 0.6 }),
    pose(field.r, 'sad', 0.3),
    pose(field.r, 'sleeping', 0.3),
  ];
  spec.parts.forEach((part, i) => {
    const box = partBox(part);
    if (!box || part.op === 'sub') return;
    const local = surfaceSamples(field, i, box, random);
    if (!local.length) {
      add('warning', `parts[${i}]`, `${describePart(spec, i)} has no surface to measure; check its sizes are above zero and its clip does not cut it away entirely.`);
      return;
    }
    const samples = local.map((l) => field.fromPart(i, l));
    surfaces.set(i, samples);
    let shows = 0;
    let buried = 0;
    let pull = 0;
    const containers = new Map<number, number>();
    const mine: Sample[] = [];
    for (const p of samples) {
      const others = field.map(p, i).d;
      const final = field.map(p).d;
      pull = Math.max(pull, others - final);
      if (others < -EPS) {
        buried++;
        const j = container(field, i, p);
        if (j >= 0) containers.set(j, (containers.get(j) ?? 0) + 1);
      } else if (final <= EPS) {
        shows++;
        const bone = field.parts[i].bone;
        mine.push({ part: i, bone, local: field.toBone(bone, p), world: p });
      }
    }
    exposed.push(...mine);
    const sight = mine.filter((_, k) => k % Math.max(1, Math.floor(mine.length / SIGHT_SAMPLES)) === 0).slice(0, SIGHT_SAMPLES);
    const seenCount = sight.filter((s) => field.visible(s.world)).length;
    const report = { index: i, shows: shows / samples.length, seen: sight.length ? (seenCount / sight.length) * (shows / samples.length) : 0 };
    reports.push(report);

    const shaping = (part.blend ?? 0) > 0 && pull > 0.003;
    const hidden = shows === 0 && buried > 0;
    const sliver = !hidden && report.shows < 0.04 && buried > 0 && !shaping;
    if ((hidden || sliver) && !shaping) {
      /* an inside part (a mouth, a tongue) may show only once something opens */
      let best = report.shows;
      for (const posed of moving) {
        field.posed = posed;
        const out = local.filter((l) => {
          const p = field.fromPart(i, l);
          return field.map(p, i).d >= -EPS && field.map(p).d <= EPS;
        }).length;
        best = Math.max(best, out / local.length);
      }
      field.posed = rest;
      if (best >= 0.04) return;
    }

    const main = [...containers.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const inside = main !== undefined ? ` inside ${describePart(spec, main)}` : ' inside the body';
    if (hidden) {
      if (shaping) {
        add('note', `parts[${i}]`, `${describePart(spec, i)} is buried${inside}; it only rounds out the surface through its blend.`);
      } else {
        const out = escape(field, i, samples);
        add(
          'error',
          `parts[${i}]`,
          `${describePart(spec, i)} is completely hidden${inside}, so it never shows.`,
          out ? `Move it outward: at ${fmt(out.at)} would bring it to the surface (that is ${r3(out.distance)} along ${out.axis}). Or make it larger.` : 'Move it outward or make it larger.',
        );
      }
    } else if (sliver) {
      add('warning', `parts[${i}]`, `${describePart(spec, i)} is ${Math.round((1 - report.shows) * 100)}% buried${inside}; only a sliver shows.`, 'If it should read clearly, move it outward or make it larger.');
    } else if (report.shows > 0 && seenCount === 0 && sight.length >= 4) {
      backOnly.push(i);
    }
  });
  if (backOnly.length) {
    add('note', 'parts', `Not visible from the front (on the back, or covered): ${backOnly.map((i) => `parts[${i}] (${spec.parts[i].material})`).join(', ')}. Fine for tails and backs; not for anything the viewer should notice.`);
  }

  /* ---- every part should hang together with the body: a wing or an ear
     that floats beside it looks broken from every angle ---- */
  floating(field, surfaces).forEach(({ parts, gap, from, to }) => {
    const names = parts.map((i) => `parts[${i}]`);
    const bone = field.parts[parts[0]].bone;
    const a = field.toBone(bone, from);
    const b = field.toBone(bone, to);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1;
    const k = (gap + 0.012) / len;
    const shift: Vec3 = [(b[0] - a[0]) * k, (b[1] - a[1]) * k, (b[2] - a[2]) * k];
    const moved = parts.map((i) => {
      const at = field.parts[i].at;
      return `parts[${i}].at ${fmt([at[0] + shift[0], at[1] + shift[1], at[2] + shift[2]])}`;
    });
    add(
      'warning',
      names.length === 1 ? names[0] : names.join(', '),
      `${parts.length === 1 ? describePart(spec, parts[0]) : `${describePart(spec, parts[0])} and ${parts.length - 1} more`} ${parts.length === 1 ? 'floats' : 'float'} free of the body: the nearest gap is ${r3(gap)}, so it looks detached from every angle.`,
      `Move it ${fmt(shift.map(r3) as Vec3)} in ${spec.parts[parts[0]].bone}'s space so it overlaps the body: ${moved.join(', ')}. If the whole bone is detached, move the bone's pivot by the same amount instead.`,
    );
  });

  /* subtractions carve only what was declared before them */
  spec.parts.forEach((part, i) => {
    if (part.op !== 'sub') return;
    const box = partBox(part);
    if (!box) return;
    const thin = Math.min(...[0, 1, 2].map((k) => (box[1][k] - box[0][k]) / 2));
    const samples = [0, Math.min(0.006, thin * 0.3)].flatMap((inset) => surfaceSamples(field, i, box, random, inset).map((l) => field.fromPart(i, l)));
    const carves = samples.some((p) => field.map(p, i).d < 0 && field.map(p).d > field.map(p, i).d + 0.0002);
    if (carves) return;
    const later = spec.parts.findIndex((q, j) => j > i && q.op !== 'sub' && q.shape !== 'hem' && samples.some((p) => field.partDistance(j, p) < 0));
    add(
      'warning',
      `parts[${i}]`,
      `${describePart(spec, i)} is a subtraction that cuts nothing.`,
      later >= 0
        ? `A subtraction only cuts parts listed before it, and the part it overlaps, parts[${later}], comes after. Move the subtraction after parts[${later}].`
        : (() => {
            const bone = field.parts[i].bone;
            const near = project(field, field.toWorld(bone, part.at ?? [0, 0, 0]));
            return near
              ? `It does not reach any part. The nearest surface is at ${fmt(field.toBone(bone, near))} (in ${part.bone}'s space); centre it there, or a little inside, to carve.`
              : 'It does not overlap any part. Move it into the part it should carve.';
          })(),
    );
  });

  /* ---- where the body is ---- */

  let extents: CheckReport['extents'] = null;
  let suggested: CheckReport['suggested'] = null;
  if (exposed.length) {
    const min: Vec3 = [Infinity, Infinity, Infinity];
    const max: Vec3 = [-Infinity, -Infinity, -Infinity];
    for (const s of exposed) for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], s.world[k]);
      max[k] = Math.max(max[k], s.world[k]);
    }
    extents = { min, max };

    /* every state, a few moments into each, so swinging ears and acting count */
    /* the bound rides on the root, which rests at the hover height */
    const hover = spec.motion?.float ?? 0;
    let lo = min[1], hi = max[1];
    const by = spec.bound.y + hover;
    let worst: { d: number; state: string; part: number } = { d: 0, state: 'idle', part: -1 };
    const step = Math.max(1, Math.floor(exposed.length / 900));
    for (const state of STATES) {
      for (const t of [0, 0.35, 0.7, 1.05]) {
        const posed = pose(field.r, state, t);
        for (let k = 0; k < exposed.length; k += step) {
          const s = exposed[k];
          const w = transformPoint(posed.world[s.bone], s.local);
          lo = Math.min(lo, w[1]);
          hi = Math.max(hi, w[1]);
          const d = Math.hypot(w[0], w[1] - by, w[2]);
          if (d > worst.d) worst = { d, state, part: s.part };
        }
      }
    }
    const boundY = r2((lo + hi) / 2 - hover);
    let boundR = 0;
    for (const state of STATES) {
      const posed = pose(field.r, state, 0.5);
      for (let k = 0; k < exposed.length; k += step) {
        const s = exposed[k];
        const w = transformPoint(posed.world[s.bone], s.local);
        boundR = Math.max(boundR, Math.hypot(w[0], w[1] - hover - boundY, w[2]));
      }
    }
    boundR = up2(Math.max(boundR, worst.d - Math.abs(boundY + hover - by)) + 0.05);
    const halfW = Math.max(Math.abs(min[0]), Math.abs(max[0]));
    /* the picture holds the body and its shadow on the floor; a floater also needs room to bob */
    const low = Math.min(min[1], 0);
    const high = max[1] + (hover > 0 ? 0.05 : 0);
    const target = r2((low + high) / 2 + 0.02);
    const frameR = up2(Math.max(halfW, (high - low) / 2) * 1.3 + 0.04);
    suggested = { bound: { y: boundY, radius: boundR }, frame: { target, radius: frameR } };

    if (worst.d > spec.bound.radius + 0.012) {
      add(
        worst.d > spec.bound.radius + 0.03 ? 'error' : 'warning',
        'bound',
        `${describePart(spec, worst.part)} reaches ${r3(worst.d)} from the bound's centre in "${worst.state}", past bound.radius ${spec.bound.radius}, so it gets sliced off there.`,
        `Set bound to { y: ${boundY}, radius: ${boundR} }.`,
      );
    } else if (spec.bound.radius > boundR * 1.6 + 0.05) {
      add('note', 'bound', `bound.radius ${spec.bound.radius} is much larger than the body needs; a tighter bound renders faster.`, `bound: { y: ${boundY}, radius: ${boundR} }`);
    }

    /* the camera sees a square of half-size frame.radius around frame.target */
    const f = spec.frame;
    const top = max[1] - f.target, bottom = f.target - min[1];
    const over = Math.max(halfW, top, bottom) - f.radius;
    if (over > 0.005) {
      const side = halfW - f.radius > 0.005 ? 'the sides' : top > bottom ? 'the top' : 'the bottom';
      add('error', 'frame', `The body is cut off at ${side} of the picture: it reaches ${r3(over)} past frame.radius ${f.radius}.`, `frame: { target: ${target}, radius: ${frameR} }`);
    } else if (Math.max(halfW, (max[1] - min[1]) / 2) < f.radius * 0.5) {
      add('warning', 'frame', `The body fills less than half the picture, so it will look small and far away.`, `frame: { target: ${target}, radius: ${frameR} }`);
    } else if (Math.abs((min[1] + max[1]) / 2 - f.target) > f.radius * 0.28) {
      add('warning', 'frame', `frame.target ${f.target} is far from the body's middle height (${r2((min[1] + max[1]) / 2)}), so it sits off-centre.`, `frame: { target: ${target}, radius: ${frameR} }`);
    }

    /* standing on the floor, unless it is meant to float */
    if (hover > 0 && min[1] < 0.02) {
      add('warning', 'parts', `Even hovering at motion.float ${hover}, the lowest point is at height ${r3(min[1])}, so it scrapes the floor.`, `Move the parts up by ${r3(0.05 - min[1])}, or raise motion.float.`);
    } else if (hover === 0 && min[1] > 0.035) {
      add('warning', 'parts', `The lowest point of the body is ${r3(min[1])} above the floor, so it hovers, but motion.float is 0.`, `Move the parts down by ${r3(min[1])} (or add feet), or set motion.float if it should hover.`);
    } else if (hover === 0 && min[1] < -0.03) {
      add('warning', 'parts', `The body dips ${r3(-min[1])} below the floor (y = 0), so its base disappears into the shadow.`, `Move the parts up by ${r3(-min[1])}, or flatten the base with a clip.`);
    }
  }

  /* ---- eyes ---- */

  const eyes = spec.eyes;
  if (eyes) {
    const bone = field.r.boneIndex(eyes.bone, 'eyes');
    const depth = eyes.kind === 'ball' ? eyes.radius : eyes.radii[2];
    const [a, b] = eyes.at;
    if (a[0] > b[0]) add('warning', 'eyes.at', 'eyes.at[0] is to the right of eyes.at[1]. List the left eye (negative x) first; winks and glances depend on it.');
    if (Math.abs(a[0] + b[0]) > 0.015 || Math.abs(a[1] - b[1]) > 0.015 || Math.abs(a[2] - b[2]) > 0.015) {
      add('warning', 'eyes.at', `The eyes are not mirror images (${fmt(a)} and ${fmt(b)}), so the face looks lopsided.`, `Use [-x, y, z] and [x, y, z] with the same y and z.`);
    }
    eyes.at.forEach((at, e) => {
      const where = `eyes.at[${e}]`;
      if (at[2] <= 0) {
        add('error', where, `This eye is at z ${at[2]}, on the back half of the head. Characters face +z, toward the camera.`, 'Use a positive z, on the front of the face.');
        return;
      }
      /* the skin straight in front of and behind the eye's centre, along the bone's +z */
      const surface = skinAlongZ(field, bone, at);
      if (surface === null) {
        add('error', where, 'There is no head behind this eye: it floats in the air.', 'Move it onto the face: give it the x and y of a point on the head.');
        return;
      }
      const front = at[2] + depth - surface;
      /* ball eyes sit deep, a third of the eyeball showing; beads sit proud */
      const want = eyes.kind === 'ball' ? surface - depth * 0.7 : surface - depth * 0.3;
      const fixed: Vec3 = [at[0], at[1], r3(want)];
      if (front <= 0.002) {
        add('error', where, `This eye is buried ${r3(-front + 0.002)} inside the head, so it cannot be seen.`, `Move it forward to at ${fmt(fixed)} (the face's surface is at z ${r3(surface)} there).`);
      } else if (at[2] - depth > surface + 0.004) {
        add('error', where, `This eye floats ${r3(at[2] - depth - surface)} in front of the face.`, `Move it back to at ${fmt(fixed)} (the face's surface is at z ${r3(surface)} there).`);
      } else if (front < depth * (eyes.kind === 'ball' ? 0.08 : 0.25)) {
        add('warning', where, `This eye barely pokes out of the face (${r3(front)}), so it reads as a dent.`, `Move it forward to at ${fmt(fixed)}.`);
      } else if (eyes.kind === 'bead' && front > depth * 1.9) {
        add('warning', where, `This bead eye stands almost entirely in front of the face, so it looks stuck on.`, `Move it back to at ${fmt(fixed)}.`);
      } else {
        const tip = field.toWorld(bone, [at[0], at[1], at[2] + depth * 0.9]);
        const sees = field.march(field.camera(), tip, true, 0.001);
        if (sees && Math.hypot(sees.at[0] - tip[0], sees.at[1] - tip[1], sees.at[2] - tip[2]) > depth * 1.5) {
          add('warning', where, `Something in front covers this eye from the camera: ${field.materialName(sees.hit.id)}.`, 'Move the eye or the part in front of it.');
        }
      }
    });
  }

  /* ---- paints ---- */

  spec.paints?.forEach((paint, i) => {
    const where = `paints[${i}]`;
    const bone = field.r.boneIndex(paint.bone, where);
    if (paint.kind === 'sphere') {
      const radius = paint.radius ?? 0.1;
      const centre = field.toWorld(bone, paint.at);
      const d = field.map(centre).d;
      const reach = radius * (1 + (paint.soft ?? 0.15));
      const onSkin = project(field, centre);
      const hint = onSkin ? ` Its nearest surface point is at ${fmt(field.toBone(bone, onSkin))}.` : '';
      if (Math.abs(d) > reach) {
        add(
          'error',
          where,
          `This paint never touches a surface: its centre is ${r3(Math.abs(d))} ${d < 0 ? 'inside' : 'outside'} the body, more than its radius ${radius}.`,
          onSkin ? `Move it to at ${fmt(field.toBone(bone, onSkin))}, on the surface.` : 'Move its centre onto the surface.',
        );
      } else if (Math.abs(d) > radius * 0.9) {
        add('warning', where, `Only the very edge of this paint reaches the surface (its centre is ${r3(Math.abs(d))} ${d < 0 ? 'inside' : 'outside'} the body, radius ${radius}), so it shows as a faint speck.${hint}`);
      } else {
        /* the paint shows wherever its ball meets one of its materials */
        const lands = paintLands(field, centre, radius);
        if (lands.size && ![...lands].some((m) => paint.on.includes(m))) {
          const name = [...lands][0];
          add('warning', where, `This paint only meets "${[...lands].join('", "')}", not its on: [${paint.on.join(', ')}], so it does not show.`, `Add "${name}" to on, or move it.`);
        }
      }
    } else {
      /* the centre and two rings inside the ellipse, looked at along the bone's -z;
         the outer ring finds a band of colour around a part that covers the middle */
      const [rx, ry] = paint.radii ?? [0.1, 0.1];
      const ring = (s: number) => [0, 1, 2, 3, 4, 5, 6, 7].map((k): Vec3 => [paint.at[0] + Math.cos(k * 0.785) * rx * s, paint.at[1] + Math.sin(k * 0.785) * ry * s, paint.at[2]]);
      const probes: Vec3[] = [paint.at, ...ring(0.6), ...ring(0.9)];
      const hits = probes.map((q) => alongZ(field, bone, q)).filter((h): h is NonNullable<typeof h> => !!h);
      const painted = hits.filter((h) => h.z > paint.at[2]);
      if (!hits.length) {
        add('error', where, 'There is no surface in front of or behind this ellipse paint.', 'Move its x and y onto the body.');
      } else if (!painted.length) {
        const z = Math.min(...hits.map((h) => h.z));
        add('error', where, `An ellipse paint colours only surface in front of its at.z (${paint.at[2]}), but the surface here is at z ${r3(z)}, behind it, so nothing is painted.`, `Set at.z below ${r3(z)}, e.g. ${r3(z - 0.08)}.`);
      } else if (!painted.some((h) => paint.on.includes(h.material))) {
        add('warning', where, `This ellipse paint lands on "${painted[0].material}", which is not in its on: [${paint.on.join(', ')}].`, `Add "${painted[0].material}" to on, or move it.`);
      }
    }
  });

  /* ---- the mouth ---- */

  const face = spec.face;
  if (face?.kind === 'mouth') {
    const bone = field.r.boneIndex(face.bone, 'face');
    /* the mouth's line, corner to corner, a little above and below */
    const w = face.width;
    const probes: Vec3[] = [-1, -0.5, 0, 0.5, 1].flatMap((u) => [-0.3, 0, 0.3].map((v): Vec3 => [face.at[0] + u * w, face.at[1] + v * w, face.at[2]]));
    const hits = probes.map((q) => alongZ(field, bone, q)).filter((h): h is NonNullable<typeof h> => !!h);
    const drawn = hits.filter((h) => h.z >= face.at[2] - 0.02 && face.on.includes(h.material));
    const centre = alongZ(field, bone, face.at);
    if (!hits.length || !centre) {
      add('error', 'face.at', 'There is no surface behind the mouth: it floats in the air.', 'Move face.at onto the front of the head.');
    } else if (!hits.some((h) => face.on.includes(h.material))) {
      add('error', 'face.on', `The mouth lands on "${centre.material}", which is not in face.on [${face.on.join(', ')}], so no mouth appears.`, `Add "${centre.material}" to face.on.`);
    } else if (!drawn.length) {
      add('error', 'face.at', `The mouth is drawn only on surface less than 0.02 behind face.at, but the face here is ${r3(face.at[2] - centre.z)} further back, so no mouth appears.`, `Set face.at to ${fmt([face.at[0], face.at[1], r3(centre.z)])}.`);
    } else if (drawn.length < hits.length * 0.4) {
      /* a curved face: sink the mouth to the deepest point it spans, so all of it is within reach */
      const deepest = Math.min(...hits.filter((h) => face.on.includes(h.material)).map((h) => h.z));
      add('warning', 'face.at', `Only part of the mouth lands on the face (${drawn.length} of ${hits.length} points), so it shows broken or shortened.`, `Set face.at to ${fmt([face.at[0], face.at[1], r3(deepest + 0.012)])}.`);
    } else if (!field.visible(field.toWorld(bone, [face.at[0], face.at[1], centre.z]))) {
      add('warning', 'face.at', 'The camera cannot see where the mouth is drawn.', 'Move it onto the front of the face.');
    }
    if (eyes) {
      const eyeY = Math.min(...eyes.at.map((at) => field.toWorld(field.r.boneIndex(eyes.bone, 'eyes'), at)[1]));
      const mouthY = field.toWorld(bone, face.at)[1];
      if (mouthY > eyeY) add('warning', 'face.at', 'The mouth is above the eyes.', 'Put the mouth below the eyes, usually 0.06–0.12 lower.');
    }
  }

  /* ---- anchors effects come from ---- */

  const anchors = spec.anchors ?? {};
  const needs: Array<[string, string, Level]> = [
    ['top', 'thinking, working, celebrating, sad and sleeping effects', 'warning'],
    ['mouth', 'speaking effects', 'warning'],
    ['ear', 'listening effects', 'note'],
    ['feet', 'the landing puff after a hop', 'note'],
  ];
  for (const [name, what, level] of needs) {
    if (!anchors[name] && !spec.fx?.replace?.length) add(level, `anchors.${name}`, `There is no "${name}" anchor, so ${what} are skipped.`, `Add anchors.${name}: { bone, at }.`);
  }
  for (const [name, a] of Object.entries(anchors)) {
    /* only the standard anchors have to sit on the surface; your own may live anywhere */
    if (name !== 'top' && name !== 'mouth') continue;
    const bone = field.r.boneIndex(a.bone, `anchors.${name}`);
    const d = field.map(field.toWorld(bone, a.at)).d;
    if (d < -0.06) add('warning', `anchors.${name}`, `The "${name}" anchor is ${r3(-d)} deep inside the body, so effects from it start out hidden.`, name === 'top' ? 'Put it on or just above the top of the head.' : 'Move it onto the surface.');
  }

  /* ---- loose ends ---- */

  const usedMaterials = new Set<string>([
    ...spec.parts.map((p) => p.material),
    ...(spec.eyes?.kind === 'ball' ? [spec.eyes.lid] : spec.eyes ? [spec.eyes.material] : []),
    ...(spec.face?.kind === 'screen' ? [spec.face.material] : []),
    ...Object.values(spec.materials).map((m) => m.shadeOf).filter((x): x is string => !!x),
  ]);
  for (const name of Object.keys(spec.materials)) {
    if (!usedMaterials.has(name)) add('note', `materials.${name}`, `Material "${name}" is not used by any part.`);
  }
  const usedBones = new Set<string>([
    ...spec.parts.map((p) => p.bone),
    ...(spec.paints ?? []).map((p) => p.bone),
    ...(spec.eyes ? [spec.eyes.bone] : []),
    ...(spec.face ? [spec.face.bone] : []),
    ...Object.values(anchors).map((a) => a.bone),
    ...spec.bones.map((b) => b.parent ?? 'root'),
  ]);
  for (const b of spec.bones) if (!usedBones.has(b.name)) add('note', `bones`, `Bone "${b.name}" moves nothing: no part, paint, eye, face, anchor or child bone uses it.`);
  if (spec.parts.length > 48) add('warning', 'parts', `${spec.parts.length} parts is a lot; every part costs shader time on every pixel. Try to stay under 40.`);

  /* the close-up looks at the eyes, wide enough for the mouth and cheeks */
  let closeup = base.closeup;
  if (eyes) {
    const bone = field.r.boneIndex(eyes.bone, 'eyes');
    const [a, b] = eyes.at.map((at) => field.toWorld(bone, at));
    const spread = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    closeup = { target: r3((a[1] + b[1]) / 2 - 0.04), radius: r3(Math.max(0.16, spread * 1.6)) };
  }

  return done({ issues: found, parts: reports, extents, suggested, closeup });
}

/* ---- sampling ---- */

/** Points on part `i`'s own surface (or `inset` inside it), in its own space: random points in its box, pulled onto the surface. */
function surfaceSamples(field: Field, i: number, box: [Vec3, Vec3], random: () => number, inset = 0): Vec3[] {
  const out: Vec3[] = [];
  const [lo, hi] = box;
  const pad = 0.1;
  for (let n = 0; n < SAMPLES; n++) {
    let l: Vec3 = [0, 1, 2].map((k) => {
      const span = hi[k] - lo[k];
      return lo[k] - span * pad + random() * span * (1 + 2 * pad);
    }) as Vec3;
    let d = 0;
    for (let it = 0; it < 8; it++) {
      d = field.localDistance(i, l);
      const g = gradient((q) => field.localDistance(i, q), l);
      const g2 = g[0] * g[0] + g[1] * g[1] + g[2] * g[2];
      if (!(g2 > 1e-12)) break;
      const s = (d + inset) / g2;
      l = [l[0] - g[0] * s, l[1] - g[1] * s, l[2] - g[2] * s];
    }
    if (Math.abs(field.localDistance(i, l) + inset) < 1e-3) out.push(l);
  }
  return out;
}

function gradient(fn: (p: Vec3) => number, p: Vec3): Vec3 {
  const e = 0.0005;
  return [0, 1, 2].map((k) => {
    const a: Vec3 = [p[0], p[1], p[2]];
    const b: Vec3 = [p[0], p[1], p[2]];
    a[k] += e;
    b[k] -= e;
    return (fn(a) - fn(b)) / (2 * e);
  }) as Vec3;
}

/** The solid part (other than `i`) that `p` is deepest inside, or -1. */
function container(field: Field, i: number, p: Vec3): number {
  let best = -1;
  let deepest = 0;
  field.spec.parts.forEach((q, j) => {
    if (j === i || q.op === 'sub' || q.shape === 'hem') return;
    const d = field.partDistance(j, p);
    if (d < deepest) {
      deepest = d;
      best = j;
    }
  });
  return best;
}

/** The materials a sphere paint at `centre` actually touches: surface points within its radius. */
function paintLands(field: Field, centre: Vec3, radius: number): Set<string> {
  const out = new Set<string>();
  const dirs: Vec3[] = [[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [0.7, 0.7, 0], [-0.7, 0.7, 0], [0.7, -0.7, 0], [-0.7, -0.7, 0]];
  for (const d of dirs) {
    const q = project(field, [centre[0] + d[0] * radius * 0.6, centre[1] + d[1] * radius * 0.6, centre[2] + d[2] * radius * 0.6]);
    if (q && Math.hypot(q[0] - centre[0], q[1] - centre[1], q[2] - centre[2]) <= radius) out.add(field.materialName(field.map(q).id));
  }
  return out;
}

/** `p` pulled onto the character's surface along the field's gradient. */
/**
 * Groups of solid parts that touch nothing outside their group, at rest.
 * Parts touch when one's surface comes within a hair (or within its blend)
 * of the other. The group holding the first part is the body.
 */
function floating(field: Field, surfaces: Map<number, Vec3[]>): Array<{ parts: number[]; gap: number; from: Vec3; to: Vec3 }> {
  const ids = [...surfaces.keys()];
  if (ids.length < 2) return [];
  const parent = new Map(ids.map((i) => [i, i]));
  const root = (i: number): number => (parent.get(i) === i ? i : root(parent.get(i)!));
  const reach = (i: number, j: number) => {
    let best = Infinity;
    for (const p of surfaces.get(i)!) best = Math.min(best, field.partDistance(j, p));
    return best;
  };
  for (const i of ids) {
    for (const j of ids) {
      if (j <= i || root(i) === root(j)) continue;
      const touch = Math.max(0.015, field.parts[i].spec.blend ?? 0, field.parts[j].spec.blend ?? 0);
      if (reach(i, j) < touch || reach(j, i) < touch) parent.set(root(j), root(i));
    }
  }
  const body = root(ids[0]);
  const groups = new Map<number, number[]>();
  for (const i of ids) if (root(i) !== body) groups.set(root(i), [...(groups.get(root(i)) ?? []), i]);
  return [...groups.values()].map((parts) => {
    /* the closest approach between the group and everything else */
    let gap = Infinity;
    let from: Vec3 = [0, 0, 0];
    let to: Vec3 = [0, 0, 0];
    for (const i of parts) {
      for (const p of surfaces.get(i)!) {
        let d = Infinity;
        let j = -1;
        for (const k of ids) {
          if (parts.includes(k)) continue;
          const dk = field.partDistance(k, p);
          if (dk < d) (d = dk), (j = k);
        }
        if (d < gap && j >= 0) {
          gap = d;
          from = p;
          /* step toward part j along its gradient to find the point it would meet */
          const e = 0.0006;
          const g: Vec3 = [0, 1, 2].map((a) => {
            const q1: Vec3 = [p[0], p[1], p[2]];
            const q2: Vec3 = [p[0], p[1], p[2]];
            q1[a] += e;
            q2[a] -= e;
            return field.partDistance(j, q1) - field.partDistance(j, q2);
          }) as Vec3;
          const n = Math.hypot(...g) || 1;
          to = [p[0] - (g[0] / n) * d, p[1] - (g[1] / n) * d, p[2] - (g[2] / n) * d];
        }
      }
    }
    return { parts: parts.sort((a, b) => a - b), gap, from, to };
  });
}

function project(field: Field, p: Vec3): Vec3 | null {
  let q: Vec3 = [p[0], p[1], p[2]];
  for (let it = 0; it < 12; it++) {
    const d = field.map(q).d;
    if (Math.abs(d) < 3e-4) return q;
    const n = field.normal(q);
    q = [q[0] - n[0] * d, q[1] - n[1] * d, q[2] - n[2] * d];
  }
  return Math.abs(field.map(q).d) < 2e-3 ? q : null;
}

/**
 * How far part `i` would have to move, along one of its bone's axes, for
 * some of it to reach the surface. The nudge is the smallest that works.
 */
function escape(field: Field, i: number, samples: Vec3[]): { at: Vec3; distance: number; axis: string } | null {
  const part = field.parts[i];
  const at = part.at;
  const axes: Array<[string, Vec3]> = [['+z', [0, 0, 1]], ['+y', [0, 1, 0]], ['-x', [-1, 0, 0]], ['+x', [1, 0, 0]], ['-y', [0, -1, 0]], ['-z', [0, 0, -1]]];
  let best: { at: Vec3; distance: number; axis: string } | null = null;
  const local = samples.map((p) => field.toBone(part.bone, p));
  for (const [name, dir] of axes) {
    for (let t = 0.01; t <= 0.4; t += 0.01) {
      /* move the samples with the part and see whether a fifth of them would clear the rest of the body */
      let clear = 0;
      for (const l of local) {
        const w = field.toWorld(part.bone, [l[0] + dir[0] * t, l[1] + dir[1] * t, l[2] + dir[2] * t]);
        if (field.map(w, i).d > 0) clear++;
      }
      if (clear >= local.length * 0.2) {
        if (!best || t < best.distance) best = { at: [at[0] + dir[0] * (t + 0.005), at[1] + dir[1] * (t + 0.005), at[2] + dir[2] * (t + 0.005)], distance: t + 0.005, axis: name };
        break;
      }
    }
  }
  return best;
}

/** The front surface along the bone's z axis through (at.x, at.y), leaving out the eyes: its z in bone space. */
function skinAlongZ(field: Field, bone: number, at: Vec3): number | null {
  const from = field.toWorld(bone, [at[0], at[1], at[2] + 1.5]);
  const to = field.toWorld(bone, [at[0], at[1], at[2] - 1.5]);
  const hit = field.march(from, to, false, 0.0004);
  return hit ? field.toBone(bone, hit.at)[2] : null;
}

/** The first surface met looking along the bone's -z through (at.x, at.y): its z in bone space and its material. */
function alongZ(field: Field, bone: number, at: Vec3): { z: number; material: string } | null {
  const from = field.toWorld(bone, [at[0], at[1], at[2] + 1.5]);
  const to = field.toWorld(bone, [at[0], at[1], at[2] - 1.5]);
  const hit = field.march(from, to, true, 0.0004);
  return hit ? { z: field.toBone(bone, hit.at)[2], material: field.materialName(hit.hit.id) } : null;
}

/* ---- text ---- */

const MARK: Record<Level, string> = { error: '✖ error  ', warning: '▲ warning', note: '· note   ' };

/** A report as plain text, for a terminal or for an agent to read. */
export function formatCheck(report: CheckReport): string {
  const lines = [`${report.name} (${report.id}): ${report.stats.parts} parts, ${report.stats.bones} bones, ${report.stats.materials} materials, ${(report.stats.bytes / 1024).toFixed(1)} KB of spec`];
  for (const issue of report.issues) {
    lines.push(`${MARK[issue.level]} ${issue.where}: ${issue.message}`);
    if (issue.fix) lines.push(`            fix: ${issue.fix}`);
  }
  const counts = (['error', 'warning', 'note'] as Level[]).map((l) => [l, report.issues.filter((i) => i.level === l).length] as const);
  if (!report.issues.length) lines.push('✓ No problems found.');
  else lines.push(counts.map(([l, n]) => `${n} ${l}${n === 1 ? '' : 's'}`).join(', ') + (report.ok ? '. No errors.' : '.'));
  return lines.join('\n');
}


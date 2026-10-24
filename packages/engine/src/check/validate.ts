/* The shape of a spec, checked field by field. The compiler stops at the
   first broken name; this keeps going and reports every problem at once,
   with the path of the field and what it should look like, which is what
   an agent needs to fix a spec in one pass. */

import { EXPRESSIONS } from '../behavior/states';
import type { CharacterSpec } from '../spec/types';
import type { Issue } from './check';

const HEX = /^#[0-9a-f]{6}$/i;
const ID = /^[a-z][a-z0-9-]*$/;
const SHAPES = ['sphere', 'ellipsoid', 'roundBox', 'capsule', 'roundCone', 'cylinder', 'frame', 'plate', 'hem'];
const AXES = ['rx', 'ry', 'rz'];
const CHANNELS = ['yaw', 'pitch', 'roll', 'flap', 'talk'];
const TEMPERAMENT = ['float', 'hop', 'squash', 'snap', 'look', 'snapLook', 'talkSquash'];
const SURFACES = ['fur', 'scales', 'speckle', 'ripple'];
const GLYPHS = ['z', 'bubble', 'sparkle', 'heart', 'note', 'arc', 'puff', 'ring', 'drop', 'spark', 'mote', 'feather', 'dot', 'exclaim', 'warning', 'confetti', 'cloud', 'star', 'gear'];
const TOP = ['id', 'name', 'tagline', 'accent', 'frame', 'bound', 'motion', 'materials', 'bones', 'parts', 'paints', 'eyes', 'face', 'anchors', 'acting', 'fx', 'glowPool'];
const MATERIAL_KEYS = ['color', 'shadeOf', 'f0', 'spec', 'shininess', 'metal', 'rim', 'gloss', 'sheen', 'sss', 'sssColor', 'emit', 'emitStrength', 'glows', 'surface'];

/** Every structural problem in a spec. Geometry is check.ts's job. */
export function validate(spec: CharacterSpec): Issue[] {
  const issues: Issue[] = [];
  const err = (where: string, message: string, fix?: string) => issues.push({ level: 'error', where, message, fix });
  const warn = (where: string, message: string, fix?: string) => issues.push({ level: 'warning', where, message, fix });

  if (!spec || typeof spec !== 'object') {
    err('spec', 'The spec is not an object.');
    return issues;
  }
  const s = spec as unknown as Record<string, unknown>;
  const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
  const pos = (v: unknown) => num(v) && (v as number) > 0;
  const vec = (v: unknown, n: number) => Array.isArray(v) && v.length === n && v.every(num);
  const needNum = (where: string, v: unknown, positive = false) => {
    if (positive ? !pos(v) : !num(v)) err(where, `Expected ${positive ? 'a number above 0' : 'a number'}, got ${JSON.stringify(v)}.`);
  };
  const needVec = (where: string, v: unknown, n = 3) => {
    if (!vec(v, n)) err(where, `Expected ${n} numbers like [${n === 3 ? 'x, y, z' : 'x, y'}], got ${JSON.stringify(v)}.`);
  };
  const needHex = (where: string, v: unknown) => {
    if (typeof v !== 'string' || !HEX.test(v)) err(where, `Expected a colour like "#ff8a3d", got ${JSON.stringify(v)}.`);
  };

  for (const key of Object.keys(s)) {
    if (!TOP.includes(key)) warn(key, `"${key}" is not a spec field, so it is ignored.`, `Known fields: ${TOP.join(', ')}.`);
  }
  if (typeof s.id !== 'string' || !ID.test(s.id)) err('id', `id must be lowercase letters, digits and dashes, starting with a letter, like "sprout". Got ${JSON.stringify(s.id)}.`);
  if (typeof s.name !== 'string' || !s.name) err('name', 'name is required: the display name, like "Sprout".');
  if (typeof s.tagline !== 'string' || !s.tagline) warn('tagline', 'tagline is missing: one line describing the character.');
  needHex('accent', s.accent);

  const frame = s.frame as CharacterSpec['frame'];
  if (!frame || typeof frame !== 'object') err('frame', 'frame is required: { target: <height the camera looks at>, radius: <half the visible height> }.', 'Start with { target: 0.5, radius: 0.75 } for a mascot about 1 unit tall.');
  else {
    needNum('frame.target', frame.target);
    needNum('frame.radius', frame.radius, true);
  }
  const bound = s.bound as CharacterSpec['bound'];
  if (!bound || typeof bound !== 'object') err('bound', 'bound is required: { y: <centre height>, radius: <reach> }, a sphere that contains the whole body.', 'Start with { y: 0.5, radius: 0.72 }.');
  else {
    needNum('bound.y', bound.y);
    needNum('bound.radius', bound.radius, true);
  }

  if (s.motion !== undefined) {
    if (typeof s.motion !== 'object' || !s.motion) err('motion', 'motion must be an object.');
    else for (const [k, v] of Object.entries(s.motion)) {
      if (!TEMPERAMENT.includes(k)) warn(`motion.${k}`, `"${k}" is not a motion setting.`, `Known: ${TEMPERAMENT.join(', ')}.`);
      else needNum(`motion.${k}`, v);
    }
  }

  /* materials */
  const materials = (s.materials ?? {}) as Record<string, Record<string, unknown>>;
  const materialNames = Object.keys(materials);
  if (typeof s.materials !== 'object' || !materialNames.length) err('materials', 'materials is required: at least one named material, like { skin: { color: "#ffb38a" } }.');
  for (const [name, m] of Object.entries(materials)) {
    const at = `materials.${name}`;
    if (!m || typeof m !== 'object') {
      err(at, 'A material must be an object with at least a color.');
      continue;
    }
    needHex(`${at}.color`, m.color);
    for (const k of Object.keys(m)) if (!MATERIAL_KEYS.includes(k)) warn(`${at}.${k}`, `"${k}" is not a material setting, so it is ignored.`, `Known: ${MATERIAL_KEYS.join(', ')}.`);
    for (const k of ['f0', 'spec', 'shininess', 'metal', 'rim', 'gloss', 'sheen', 'sss', 'emitStrength']) if (m[k] !== undefined) needNum(`${at}.${k}`, m[k]);
    for (const k of ['f0', 'metal', 'gloss']) if (num(m[k]) && ((m[k] as number) < 0 || (m[k] as number) > 1)) warn(`${at}.${k}`, `${k} is meant to be between 0 and 1.`);
    for (const k of ['sssColor', 'emit']) if (m[k] !== undefined) needHex(`${at}.${k}`, m[k]);
    if (m.shadeOf !== undefined && !materialNames.includes(m.shadeOf as string)) err(`${at}.shadeOf`, `shadeOf names "${m.shadeOf}", which is not a material.`);
    const surface = m.surface as Record<string, unknown> | undefined;
    if (surface !== undefined) {
      if (!SURFACES.includes(surface?.kind as string)) err(`${at}.surface.kind`, `surface.kind must be one of ${SURFACES.join(', ')}.`);
      needNum(`${at}.surface.scale`, surface?.scale, true);
    }
  }

  /* bones */
  const boneNames = new Set(['root']);
  if (!Array.isArray(s.bones)) err('bones', 'bones is required: a list, usually starting with { name: "body", pivot: [0, 0, 0] }.');
  else (s.bones as Array<Record<string, unknown>>).forEach((b, i) => {
    const at = `bones[${i}]`;
    if (typeof b?.name !== 'string') return err(`${at}.name`, 'Every bone needs a name.');
    if (boneNames.has(b.name)) err(`${at}.name`, `Bone "${b.name}" is declared twice${b.name === 'root' ? ' ("root" is built in; don\'t declare it)' : ''}.`);
    const parent = (b.parent as string | undefined) ?? 'root';
    if (!boneNames.has(parent)) err(`${at}.parent`, `Bone "${b.name}" names parent "${parent}", which is not declared before it. Declare parents first.`);
    boneNames.add(b.name);
    needVec(`${at}.pivot`, b.pivot);
    for (const field of ['rest', 'drive', 'wave'] as const) {
      const v = b[field] as Record<string, unknown> | undefined;
      if (v === undefined) continue;
      for (const [axis, val] of Object.entries(v)) {
        if (!AXES.includes(axis)) {
          err(`${at}.${field}.${axis}`, `"${axis}" is not an axis; use rx, ry or rz.`);
          continue;
        }
        if (field === 'rest') needNum(`${at}.rest.${axis}`, val);
        if (field === 'wave' && !vec(val, 3)) err(`${at}.wave.${axis}`, 'A wave is [amplitude, hz, phase].');
        if (field === 'drive') {
          if (!Array.isArray(val) || !val.every((d) => Array.isArray(d) && CHANNELS.includes(d[0]) && num(d[1]))) {
            err(`${at}.drive.${axis}`, `A drive is a list of [channel, weight] pairs, like [["yaw", 0.6]]. Channels: ${CHANNELS.join(', ')}.`);
          }
        }
      }
    }
    const j = b.jiggle as Record<string, unknown> | undefined;
    if (j !== undefined) {
      needVec(`${at}.jiggle.axis`, j?.axis);
      needNum(`${at}.jiggle.length`, j?.length, true);
      needNum(`${at}.jiggle.freq`, j?.freq, true);
      needNum(`${at}.jiggle.damping`, j?.damping, true);
    }
  });

  const needBone = (where: string, name: unknown) => {
    if (!boneNames.has(name as string)) err(where, `Names bone "${name}", which does not exist.`, `Bones: ${[...boneNames].join(', ')}.`);
  };
  const needMaterial = (where: string, name: unknown) => {
    if (!materialNames.includes(name as string)) err(where, `Names material "${name}", which does not exist.`, `Materials: ${materialNames.join(', ')}.`);
  };

  /* parts */
  if (!Array.isArray(s.parts) || !s.parts.length) err('parts', 'parts is required: at least one shape.');
  else (s.parts as Array<Record<string, unknown>>).forEach((p, i) => {
    const at = `parts[${i}]`;
    needBone(`${at}.bone`, p?.bone);
    if (p?.shape !== 'hem') needMaterial(`${at}.material`, p?.material);
    if (!SHAPES.includes(p?.shape as string)) return err(`${at}.shape`, `"${p?.shape}" is not a shape. Shapes: ${SHAPES.join(', ')}.`);
    if (p.at !== undefined) needVec(`${at}.at`, p.at);
    if (p.rot !== undefined) needVec(`${at}.rot`, p.rot);
    if (p.op !== undefined && p.op !== 'add' && p.op !== 'sub') err(`${at}.op`, 'op is "add" (the default) or "sub".');
    if (p.op === 'sub' && i === 0) err(`${at}.op`, 'The first part cannot be a subtraction: there is nothing before it to cut.');
    if (p.blend !== undefined && (!num(p.blend) || (p.blend as number) < 0)) err(`${at}.blend`, 'blend is a distance, 0 or more (0.02–0.1 is typical).');
    if (p.clip !== undefined) {
      const c = p.clip as Record<string, unknown>;
      if (!vec(c?.normal, 3) || (c.normal as number[]).every((x) => x === 0)) err(`${at}.clip.normal`, 'clip.normal is a direction like [0, -1, 0] (keeps the top half).');
    }
    const size: Record<string, () => void> = {
      sphere: () => needNum(`${at}.radius`, p.radius, true),
      ellipsoid: () => (vec(p.radii, 3) && (p.radii as number[]).every((x) => x > 0) ? undefined : err(`${at}.radii`, 'radii are three sizes above 0: [x, y, z].')),
      roundBox: () => {
        if (!vec(p.half, 3) || !(p.half as number[]).every((x) => x > 0)) err(`${at}.half`, 'half is three half-sizes above 0: [x, y, z].');
        needNum(`${at}.round`, p.round);
      },
      capsule: () => {
        needVec(`${at}.from`, p.from);
        needVec(`${at}.to`, p.to);
        needNum(`${at}.radius`, p.radius, true);
      },
      roundCone: () => {
        needVec(`${at}.from`, p.from);
        needVec(`${at}.to`, p.to);
        needNum(`${at}.r1`, p.r1, true);
        needNum(`${at}.r2`, p.r2, true);
      },
      cylinder: () => {
        needNum(`${at}.radius`, p.radius, true);
        needNum(`${at}.half`, p.half, true);
        needNum(`${at}.round`, p.round);
      },
      frame: () => {
        needVec(`${at}.half`, p.half, 2);
        ['corner', 'width', 'depth'].forEach((k) => needNum(`${at}.${k}`, p[k], k !== 'corner'));
      },
      plate: () => {
        needVec(`${at}.half`, p.half, 2);
        ['corner', 'depth'].forEach((k) => needNum(`${at}.${k}`, p[k], k !== 'corner'));
      },
      hem: () => ['y', 'amplitude', 'waves', 'speed', 'blend'].forEach((k) => needNum(`${at}.${k}`, p[k])),
    };
    size[p.shape as string]();
  });

  /* paints */
  if (s.paints !== undefined && !Array.isArray(s.paints)) err('paints', 'paints must be a list.');
  else (s.paints as Array<Record<string, unknown>> | undefined)?.forEach((p, i) => {
    const at = `paints[${i}]`;
    needBone(`${at}.bone`, p?.bone);
    if (!Array.isArray(p?.on) || !p.on.length) err(`${at}.on`, 'on is the list of materials the paint may colour, like ["skin"].');
    else p.on.forEach((m: unknown, k: number) => needMaterial(`${at}.on[${k}]`, m));
    needHex(`${at}.color`, p?.color);
    needVec(`${at}.at`, p?.at);
    if (p?.kind === 'sphere') needNum(`${at}.radius`, p.radius, true);
    else if (p?.kind === 'ellipse') needVec(`${at}.radii`, p.radii, 2);
    else err(`${at}.kind`, 'kind is "sphere" (a ball of colour around at) or "ellipse" (projected along +z).');
  });

  /* eyes */
  const eyes = s.eyes as Record<string, unknown> | undefined;
  if (eyes !== undefined) {
    needBone('eyes.bone', eyes?.bone);
    if (!Array.isArray(eyes?.at) || eyes.at.length !== 2) err('eyes.at', 'eyes.at is two points: [[-x, y, z], [x, y, z]].');
    else (eyes.at as unknown[]).forEach((v, k) => needVec(`eyes.at[${k}]`, v));
    if (eyes?.kind === 'ball') {
      needNum('eyes.radius', eyes.radius, true);
      needHex('eyes.iris', eyes.iris);
      needNum('eyes.irisSize', eyes.irisSize, true);
      needNum('eyes.pupilSize', eyes.pupilSize, true);
      needMaterial('eyes.lid', eyes.lid);
    } else if (eyes?.kind === 'bead') {
      if (!vec(eyes.radii, 3) || !(eyes.radii as number[]).every((x) => x > 0)) err('eyes.radii', 'radii are three sizes above 0: [width, height, depth], like [0.03, 0.045, 0.02].');
      needMaterial('eyes.material', eyes.material);
    } else err('eyes.kind', 'eyes.kind is "ball" (white eyeballs with an iris and lids) or "bead" (glossy dark beads).');
  }

  /* face */
  const face = s.face as Record<string, unknown> | undefined;
  if (face !== undefined) {
    needBone('face.bone', face?.bone);
    if (face?.kind === 'mouth') {
      if (!Array.isArray(face.on) || !face.on.length) err('face.on', 'face.on is the list of materials the mouth may be drawn on, like ["skin"].');
      else face.on.forEach((m: unknown, k: number) => needMaterial(`face.on[${k}]`, m));
      needVec('face.at', face.at);
      needNum('face.width', face.width, true);
      needHex('face.color', face.color);
      needHex('face.tongue', face.tongue);
    } else if (face?.kind === 'screen') {
      needMaterial('face.material', face.material);
      needVec('face.center', face.center, 2);
      needVec('face.half', face.half, 2);
      needNum('face.cell', face.cell, true);
      needHex('face.color', face.color);
    } else err('face.kind', 'face.kind is "mouth" (a painted mouth) or "screen" (an LED face).');
  }

  /* anchors */
  const anchors = (s.anchors ?? {}) as Record<string, Record<string, unknown>>;
  for (const [name, a] of Object.entries(anchors)) {
    needBone(`anchors.${name}.bone`, a?.bone);
    needVec(`anchors.${name}.at`, a?.at);
  }

  /* acting */
  for (const [expression, perBone] of Object.entries((s.acting ?? {}) as Record<string, Record<string, Record<string, unknown>>>)) {
    if (!(EXPRESSIONS as readonly string[]).includes(expression)) {
      err(`acting.${expression}`, `"${expression}" is not a state.`, `States: ${EXPRESSIONS.join(', ')}.`);
      continue;
    }
    for (const [bone, axes] of Object.entries(perBone ?? {})) {
      needBone(`acting.${expression}.${bone}`, bone);
      for (const [axis, motion] of Object.entries(axes ?? {})) {
        const where = `acting.${expression}.${bone}.${axis}`;
        if (!AXES.includes(axis)) err(where, `"${axis}" is not an axis; use rx, ry or rz.`);
        else if (!num(motion) && !(Array.isArray(motion) && motion.length >= 1 && motion.length <= 5 && motion.every(num))) {
          err(where, 'A motion is a number (a held angle) or [base, amplitude, hz, phase, spin].');
        } else if (Math.abs(Array.isArray(motion) ? motion[0] : motion) + Math.abs(Array.isArray(motion) ? (motion[1] ?? 0) : 0) > 3.3) {
          warn(where, 'This turns more than 3.3 radians (about 190°), which tends to look broken. Spins belong in the fifth number, spin.');
        }
      }
    }
  }

  /* effects */
  const fx = (s.fx ?? {}) as Record<string, unknown>;
  for (const [trigger, list] of Object.entries(fx)) {
    if (trigger === 'replace') continue;
    const base = trigger.startsWith('enter:') ? trigger.slice(6) : trigger;
    if (!['ambient', 'land', 'syllable'].includes(trigger) && !(EXPRESSIONS as readonly string[]).includes(base)) {
      err(`fx.${trigger}`, `"${trigger}" is not a trigger.`, `Use a state name, "enter:<state>", "ambient", "land" or "syllable".`);
      continue;
    }
    if (!Array.isArray(list)) {
      err(`fx.${trigger}`, 'Each trigger takes a list of emitters.');
      continue;
    }
    list.forEach((e: Record<string, unknown>, i: number) => {
      const at = `fx.${trigger}[${i}]`;
      if (!GLYPHS.includes(e?.glyph as string)) err(`${at}.glyph`, `"${e?.glyph}" is not a glyph.`, `Glyphs: ${GLYPHS.join(', ')}.`);
      if (!anchors[e?.anchor as string]) err(`${at}.anchor`, `Names anchor "${e?.anchor}", which does not exist.`, `Anchors: ${Object.keys(anchors).join(', ') || 'none yet'}.`);
      needNum(`${at}.rate`, e?.rate, true);
      needVec(`${at}.velocity`, e?.velocity);
      needVec(`${at}.life`, e?.life, 2);
      needVec(`${at}.size`, e?.size, 2);
      needHex(`${at}.color`, e?.color);
    });
  }

  return issues;
}

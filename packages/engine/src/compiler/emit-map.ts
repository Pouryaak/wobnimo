/* Emits map(p): the character's signed distance field, with the material
   of the nearest surface. Parts are combined in the order the spec lists
   them, so a subtraction carves everything declared before it. */

import type { PartSpec, Vec3 } from '../spec/types';
import { f, inverseRotation, v2, v3 } from './format';
import type { Resolved } from './resolve';

export function emitMap(r: Resolved): string {
  const out: string[] = ['vec2 map(vec3 p) {', '  vec2 r = vec2(1e9, 0.0);', '  vec3 l;'];
  const declared = new Set<number>();
  const boneSpace = (index: number) => {
    if (!declared.has(index)) {
      declared.add(index);
      out.push(`  vec3 b${index} = (uBones[${index}] * vec4(p, 1.0)).xyz;`);
    }
    return `b${index}`;
  };

  r.spec.parts.forEach((part, i) => {
    const b = boneSpace(r.boneIndex(part.bone, `parts[${i}]`));
    const at = part.at ?? [0, 0, 0];
    const local = part.rot ? `${inverseRotation(part.rot)} * (${b} - ${v3(at)})` : `${b} - ${v3(at)}`;
    out.push(`  l = ${local};`);
    const id = f(r.materialId(part.material, `parts[${i}]`));
    if (part.shape === 'hem') {
      out.push(
        `  r.x = smax(r.x, ${f(part.y)} + ${f(part.amplitude)} * sin(atan(l.z, l.x) * ${f(part.waves)} + uTime * ${f(part.speed)}) - l.y, ${f(part.blend)});`,
      );
      return;
    }
    const d = part.clip ? `max(${distance(part)}, dot(l, ${v3(unit(part.clip.normal))}) - ${f(part.clip.offset ?? 0)})` : distance(part);
    const k = f(part.blend ?? 0);
    out.push(part.op === 'sub' ? `  opSub(r, ${d}, ${k});` : `  opAdd(r, ${d}, ${id}, ${k});`);
  });

  out.push(...emitEyes(r, boneSpace));
  out.push('  r.x *= uScaleFix;', '  return r;', '}');
  return out.join('\n');
}

function unit(v: Vec3): Vec3 {
  const n = Math.hypot(...v) || 1;
  return [v[0] / n, v[1] / n, v[2] / n];
}

function distance(p: PartSpec): string {
  switch (p.shape) {
    case 'sphere':
      return `sdSphere(l, ${f(p.radius)})`;
    case 'ellipsoid':
      return `sdEllipsoid(l, ${v3(p.radii)})`;
    case 'roundBox':
      return `sdRoundBox(l, ${v3(p.half)}, ${f(p.round)})`;
    case 'capsule':
      return `sdCapsule(l, ${v3(p.from)}, ${v3(p.to)}, ${f(p.radius)})`;
    case 'roundCone':
      return `sdRoundCone(l, ${v3(p.from)}, ${v3(p.to)}, ${f(p.r1)}, ${f(p.r2)})`;
    case 'cylinder':
      return `sdCylinder(l, ${f(p.radius)}, ${f(p.half)}, ${f(p.round)})`;
    case 'frame':
      return `sdFrame(l, ${v2(p.half)}, ${f(p.corner)}, ${f(p.width)}, ${f(p.depth)})`;
    case 'plate':
      return `sdPlate(l, ${v2(p.half)}, ${f(p.corner)}, ${f(p.depth)})`;
    case 'hem':
      throw new Error('unreachable');
  }
}

/* Eyes are parts the compiler writes itself, because they move with the
   face channels: ball eyes grow lids that close over them, bead eyes
   flatten and slide with the gaze. */
function emitEyes(r: Resolved, boneSpace: (i: number) => string): string[] {
  const eyes = r.spec.eyes;
  if (!eyes) return [];
  const b = boneSpace(r.boneIndex(eyes.bone, 'eyes'));
  const out: string[] = [];
  if (eyes.kind === 'ball') {
    const lid = f(r.materialId(eyes.lid, 'eyes.lid'));
    const R = eyes.radius;
    eyes.at.forEach((at, i) => {
      const side = i === 0 ? '-1.0' : '1.0';
      out.push(
        `  l = ${b} - ${v3(at)};`,
        `  opAdd(r, length(l) - ${f(R)}, ${f(r.eyeIds[i])}, 0.0);`,
        `  {`,
        `    float tilt = uFaceB.w * ${side};`,
        `    vec3 q = vec3(mat2(cos(tilt), sin(tilt), -sin(tilt), cos(tilt)) * l.xy, l.z);`,
        `    float shell = length(q) - ${f(R * 1.1)};`,
        /* asymmetry closes one lid and opens the other; wide eyes pull both lids back */
        `    float lid = clamp(uFaceA.y + uFaceD.w * ${side} * 0.38 - uFaceD.z * 0.1, 0.0, 1.0);`,
        `    float top = mix(${f(R * 1.18)}, ${f(-R * 0.14)}, max(uFaceA.x, lid));`,
        `    float bottom = mix(${f(-R * 1.18)}, ${f(-R * 0.02)}, uFaceA.z * 0.85);`,
        `    opAdd(r, min(max(shell, top - q.y), max(shell, q.y - bottom)), ${lid}, 0.0);`,
        `  }`,
      );
    });
  } else {
    const id = f(r.materialId(eyes.material, 'eyes.material'));
    const [rx, ry, rz] = eyes.radii;
    /* wide eyes grow; asymmetry squeezes one bead and opens the other */
    out.push(`  float grow = 1.0 + 0.2 * uFaceD.z;`);
    eyes.at.forEach((at, i) => {
      const side = i === 0 ? '-1.0' : '1.0';
      out.push(
        `  float open${i} = max(0.12, (1.0 - max(uFaceA.x, clamp(uFaceA.y + uFaceD.w * ${side} * 0.45, 0.0, 1.0))) * (1.0 - 0.6 * uFaceA.z));`,
        `  l = ${b} - ${v3(at)} - vec3(uFaceB.y * ${f(rx * 0.45)}, uFaceB.z * ${f(ry * 0.3)}, 0.0);`,
        `  opAdd(r, sdEllipsoid(l, vec3(${f(rx)} * grow, ${f(ry)} * grow * open${i}, ${f(rz)})), ${id}, 0.0);`,
      );
    });
  }
  return out;
}

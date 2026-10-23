/* Emits getMaterial(id, p, n): the surface at a hit, with paints, eyes
   and faces laid over the base material in that order. */

import { linear } from '../spec/color';
import type { MaterialSpec, Vec3 } from '../spec/types';
import { f, v2, v3 } from './format';
import type { Resolved } from './resolve';

const lin = (hex: string) => v3(linear(hex));

function base(m: MaterialSpec, slot: number): string {
  const glow = m.glows ? `uGlow * ${f(m.emitStrength ?? 1)}` : m.emit ? `${lin(m.emit)} * ${f(m.emitStrength ?? 1)}` : 'vec3(0.0)';
  return `Material(uAlbedo[${slot}], ${f(m.f0 ?? 0.04)}, ${f(m.spec ?? 0.5)}, ${f(m.shininess ?? 40)}, ${f(m.metal ?? 0)}, ${f(m.rim ?? 0.5)}, ${f(m.sheen ?? 0)}, ${f(m.sss ?? 0)}, ${m.sssColor ? lin(m.sssColor) : 'vec3(0.0)'}, ${glow}, ${f(m.gloss ?? 0.3)})`;
}

const anyOf = (ids: number[]) => ids.map((id) => `k == ${id}`).join(' || ');

export function emitMaterials(r: Resolved): string {
  const out: string[] = ['Material getMaterial(float id, vec3 p, vec3 n) {', '  int k = int(id + 0.5);', '  Material m = material(vec3(0.5));'];

  r.materials.forEach(({ id, spec }, i) => out.push(`  ${i ? 'else ' : ''}if (k == ${id}) m = ${base(spec, i)};`));

  r.spec.paints?.forEach((paint, i) => {
    const b = r.boneIndex(paint.bone, `paints[${i}]`);
    const ids = paint.on.map((name) => r.materialId(name, `paints[${i}]`));
    const soft = f(paint.soft ?? 0.15);
    const edge =
      paint.kind === 'sphere'
        ? `(length(q) - ${f(paint.radius ?? 0.1)}) / ${f(paint.radius ?? 0.1)}`
        : `q.z > 0.0 ? length(q.xy / ${v2(paint.radii ?? [0.1, 0.1])}) - 1.0 : 1.0`;
    out.push(
      `  if (${anyOf(ids)}) {`,
      `    vec3 q = (uBones[${b}] * vec4(p, 1.0)).xyz - ${v3(paint.at)};`,
      `    float e = ${edge};`,
      `    m.albedo = mix(m.albedo, ${lin(paint.color)}, (1.0 - smoothstep(-${soft}, ${soft}, e)) * ${f(paint.opacity ?? 1)});`,
      `  }`,
    );
  });

  out.push(...emitEyeMaterials(r), ...emitFace(r), '  return m;', '}');
  return out.join('\n');
}

function emitEyeMaterials(r: Resolved): string[] {
  const eyes = r.spec.eyes;
  if (eyes?.kind !== 'ball') return [];
  const b = r.boneIndex(eyes.bone, 'eyes');
  const out: string[] = [];
  eyes.at.forEach((at: Vec3, i) => {
    out.push(
      `  if (k == ${r.eyeIds[i]}) {`,
      `    vec3 q = normalize((uBones[${b}] * vec4(p, 1.0)).xyz - ${v3(at)});`,
      `    vec3 g = normalize(vec3(uFaceB.y * 0.5, uFaceB.z * 0.38, 1.0));`,
      `    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), g));`,
      `    vec3 up = cross(g, right);`,
      `    vec2 s = vec2(dot(q, right), dot(q, up));`,
      `    float front = step(0.0, dot(q, g));`,
      `    float aa = gPixel / ${f(eyes.radius)} + 0.02;`,
      `    float rr = length(s);`,
      `    float iris = front - front * smoothstep(${f(eyes.irisSize)} - aa, ${f(eyes.irisSize)} + aa, rr);`,
      `    float pupil = front - front * smoothstep(${f(eyes.pupilSize)} - aa, ${f(eyes.pupilSize)} + aa, length(s / vec2(${f(eyes.pupilAspect ?? 1)}, 1.0)));`,
      /* the iris lightens toward its centre and darkens at the limbal ring */
      `    vec3 irisCol = ${lin(eyes.iris)} * (0.55 + 0.9 * smoothstep(${f(eyes.irisSize)}, 0.0, rr)) * (0.7 + 0.3 * hash12(floor(vec2(atan(s.y, s.x) * 9.0, rr * 30.0))));`,
      `    vec3 albedo = mix(vec3(0.82, 0.8, 0.78), irisCol, iris);`,
      `    albedo = mix(albedo, vec3(0.004), pupil);`,
      `    m = Material(albedo, 0.06, 2.4, 600.0, 0.0, 0.15, 0.0, 0.0, vec3(0.0), vec3(0.0), 1.0);`,
      `  }`,
    );
  });
  return out;
}

function emitFace(r: Resolved): string[] {
  const face = r.spec.face;
  if (!face) return [];
  if (face.kind === 'screen') {
    const b = r.boneIndex(face.bone, 'face');
    const id = r.materialId(face.material, 'face.material');
    return [
      `  if (k == ${id}) {`,
      `    vec2 q = (uBones[${b}] * vec4(p, 1.0)).xy - ${v2(face.center)};`,
      `    m.emit += screenLight(q, ${lin(face.color)}, ${f(face.cell)}, ${v2(face.half)}, ${f(face.corner)});`,
      `  }`,
    ];
  }
  const b = r.boneIndex(face.bone, 'face');
  const ids = face.on.map((name) => r.materialId(name, 'face.on'));
  const w = face.width;
  return [
    `  if (${anyOf(ids)}) {`,
    `    vec3 q = (uBones[${b}] * vec4(p, 1.0)).xyz - ${v3(face.at)};`,
    `    if (q.z > -0.02) {`,
    /* vowels: a round mouth is narrower and taller, a wide one flatter */
    `      float smile = uFaceA.w;`,
    `      float round = uFaceD.y;`,
    `      float w = ${f(w)} * (1.0 - 0.38 * round * step(0.003, uFaceB.x));`,
    `      float h = uFaceB.x * ${f(w * 0.95)} * (1.0 + 0.35 * round);`,
    `      float curve = smile * 0.55 * q.x * q.x / w;`,
    `      float line = length(vec2(max(abs(q.x) - w, 0.0), q.y - curve)) - ${f(w * 0.12)};`,
    `      float hh = max(h, 1e-3);`,
    `      float open = (length(vec2(q.x / (w * 0.8), (q.y - curve * 0.4 + hh * 0.55) / hh)) - 1.0) * min(w * 0.8, hh);`,
    `      float dm = h > 0.003 ? min(line, open) : line;`,
    `      float aa = gPixel * 0.8;`,
    `      float a = 1.0 - smoothstep(-aa, aa, dm);`,
    `      float tongue = (1.0 - smoothstep(-aa, aa, length(vec2(q.x / (w * 0.5), (q.y - curve * 0.4 + hh * 1.15) / (hh * 0.7))) - 1.0)) * (1.0 - smoothstep(-aa, aa, open)) * step(0.003, h);`,
    `      m.albedo = mix(m.albedo, mix(${lin(face.color)}, ${lin(face.tongue)}, tongue), a);`,
    `      m.spec *= 1.0 - 0.6 * a; m.sss *= 1.0 - a; m.sheen *= 1.0 - a; m.emit *= 1.0 - a;`,
    `    }`,
    `  }`,
  ];
}

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

/* Surface detail per material: it bends the normal and shades the albedo
   after the material is chosen, and fades out where a feature would be
   smaller than a pixel, so distant fur doesn't shimmer. */
export function emitSurfaces(r: Resolved): string {
  const out = ['void surface(float id, vec3 p, inout vec3 n, inout Material m) {', '  int k = int(id + 0.5);'];
  for (const { id, spec, name } of r.materials) {
    const s = spec.surface;
    if (!s) continue;
    const b = r.boneIndex(s.bone ?? 'root', `materials.${name}.surface`);
    const k = f(s.strength ?? 0.5);
    out.push(
      `  if (k == ${id}) {`,
      `    vec3 q = (uBones[${b}] * vec4(p, 1.0)).xyz * ${f(s.scale)};`,
      `    float detail = ${k} * (1.0 - smoothstep(0.25, 0.9, gPixel * ${f(s.scale)}));`,
      ...surfaceBody(s.kind, s.color),
      `  }`,
    );
  }
  out.push('}');
  return out.join('\n');
}

function surfaceBody(kind: 'fur' | 'scales' | 'speckle' | 'ripple', color: string | undefined): string[] {
  /* a random direction from three noises, laid flat on the surface */
  const tangentNoise = (at: string) => [
    `    vec3 g = vec3(noise3(${at}), noise3(${at} + 17.3), noise3(${at} + 41.7)) - 0.5;`,
    `    g -= n * dot(g, n);`,
  ];
  switch (kind) {
    case 'fur':
      return [
        ...tangentNoise('q'),
        `    n = normalize(n + g * 0.5 * detail);`,
        /* barely-there clumps: the coat should read as a surface, not a pattern */
        `    float clump = noise3(q * 0.23);`,
        `    m.albedo *= mix(1.0, 0.9 + 0.2 * clump, detail);`,
      ];
    case 'scales': {
      const seamColor = color ? lin(color) : 'm.albedo * 0.55';
      return [
        `    float c = noise3(q);`,
        `    float e = 0.12;`,
        `    vec3 grad = vec3(noise3(q + vec3(e, 0, 0)), noise3(q + vec3(0, e, 0)), noise3(q + vec3(0, 0, e))) - c;`,
        `    grad -= n * dot(grad, n);`,
        `    n = normalize(n - grad * 2.2 * detail);`,
        /* the seams between scales sit where the noise crosses its middle */
        `    float seam = 1.0 - smoothstep(0.03, 0.13, abs(c - 0.5));`,
        `    m.albedo = mix(m.albedo, ${seamColor}, seam * 0.7 * detail);`,
        `    m.albedo *= 0.9 + 0.2 * noise3(q * 0.31) * detail;`,
      ];
    }
    case 'speckle':
      return [
        `    float spot = smoothstep(0.66, 0.7, noise3(q)) * (0.6 + 0.4 * noise3(q * 0.37));`,
        `    m.albedo = mix(m.albedo, ${color ? lin(color) : 'm.albedo * 0.6'}, spot * detail);`,
      ];
    case 'ripple':
      return [...tangentNoise('q'), `    n = normalize(n + g * 0.35 * detail);`];
  }
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
      /* a fright pins the pupils */
      `    float ps = ${f(eyes.pupilSize)} * (1.0 - 0.4 * uFaceD.z);`,
      `    float pupil = front - front * smoothstep(ps - aa, ps + aa, length(s / vec2(${f(eyes.pupilAspect ?? 1)}, 1.0)));`,
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
    `      vec3 mo = mouth(q.xy, ${f(w)}, uFaceB.x * ${f(w * 1.1)}, uFaceD.y, uFaceA.w, uFaceD.w, ${f(w * 0.12)}, gPixel * 0.8);`,
    `      float a = mo.x;`,
    /* the inside darkens with depth; the tongue sits on top */
    `      vec3 inner = ${lin(face.color)} * (1.25 - 0.5 * mo.z);`,
    `      m.albedo = mix(m.albedo, mix(inner, ${lin(face.tongue)}, mo.y), a);`,
    `      m.spec *= 1.0 - 0.6 * a; m.sss *= 1.0 - a; m.sheen *= 1.0 - a; m.emit *= 1.0 - a;`,
    `    }`,
    `  }`,
  ];
}

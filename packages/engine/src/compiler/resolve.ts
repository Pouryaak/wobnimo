/* Checks a spec and resolves its names to indices, so everything after
   this works on numbers. Errors say which character and which field, so
   an agent writing specs can fix its own mistakes. */

import type { BoneActing } from '../rig/rig';
import type { Axis, BoneSpec, CharacterSpec, Expression, MaterialSpec, Motion, Vec3 } from '../spec/types';

export interface ResolvedBone extends BoneSpec {
  index: number;
  parentIndex: number;
}

export interface Resolved {
  spec: CharacterSpec;
  /** Index 0 is the root, which the behaviour layer moves. */
  bones: ResolvedBone[];
  boneIndex(name: string, where: string): number;
  /** Material ids start at 1; the eyes get ids of their own after the spec's. */
  materials: Array<{ name: string; id: number; spec: MaterialSpec }>;
  materialId(name: string, where: string): number;
  eyeIds: [number, number];
  /** The spec's acting, regrouped by bone index for the rig. */
  acting: BoneActing;
  anchors: Record<string, { bone: number; at: Vec3 }>;
}

export class SpecError extends Error {
  constructor(character: string, message: string) {
    super(`${character}: ${message}`);
    this.name = 'SpecError';
  }
}

export function resolve(spec: CharacterSpec): Resolved {
  const fail = (msg: string): never => {
    throw new SpecError(spec.id, msg);
  };

  const bones: ResolvedBone[] = [{ name: 'root', pivot: [0, 0, 0], index: 0, parentIndex: -1 }];
  const byName = new Map<string, number>([['root', 0]]);
  spec.bones.forEach((b, i) => {
    if (byName.has(b.name)) fail(`bone "${b.name}" is declared twice`);
    const parent = b.parent ?? 'root';
    const parentIndex = byName.get(parent);
    if (parentIndex === undefined) fail(`bone "${b.name}" names parent "${parent}", which is not declared before it`);
    byName.set(b.name, i + 1);
    bones.push({ ...b, index: i + 1, parentIndex: parentIndex! });
  });

  const materials = Object.entries(spec.materials).map(([name, m], i) => ({ name, id: i + 1, spec: m }));
  const matByName = new Map(materials.map((m) => [m.name, m.id]));
  const eyeIds: [number, number] = [materials.length + 1, materials.length + 2];

  const boneIndex = (name: string, where: string) => byName.get(name) ?? fail(`${where} names bone "${name}", which does not exist`);
  const materialId = (name: string, where: string) =>
    matByName.get(name) ?? fail(`${where} names material "${name}", which does not exist`);

  spec.parts.forEach((p, i) => {
    boneIndex(p.bone, `parts[${i}]`);
    materialId(p.material, `parts[${i}]`);
  });
  spec.paints?.forEach((p, i) => {
    boneIndex(p.bone, `paints[${i}]`);
    p.on.forEach((m) => materialId(m, `paints[${i}]`));
  });

  const acting: BoneActing = bones.map(() => []);
  for (const [expression, perBone] of Object.entries(spec.acting ?? {}) as Array<[Expression, Record<string, Partial<Record<Axis, Motion>>>]>) {
    for (const [name, axes] of Object.entries(perBone)) {
      const i = boneIndex(name, `acting.${expression}`);
      for (const [axis, motion] of Object.entries(axes) as Array<[Axis, Motion]>) acting[i].push([expression, axis, motion]);
    }
  }

  const anchors: Resolved['anchors'] = {};
  for (const [name, a] of Object.entries(spec.anchors ?? {})) anchors[name] = { bone: boneIndex(a.bone, `anchors.${name}`), at: a.at };
  for (const [trigger, emitters] of Object.entries(spec.fx ?? {})) {
    if (trigger === 'replace') continue;
    (emitters as Array<{ anchor: string }>).forEach((e, i) => {
      if (!anchors[e.anchor]) fail(`fx.${trigger}[${i}] names anchor "${e.anchor}", which does not exist`);
    });
  }

  return { spec, bones, boneIndex, materials, materialId, eyeIds, acting, anchors };
}

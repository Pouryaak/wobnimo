/* Checks a spec and resolves its names to indices, so everything after
   this works on numbers. Errors say which character and which field, so
   an agent writing specs can fix its own mistakes. */

import type { BoneSpec, CharacterSpec, MaterialSpec } from '../spec/types';

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

  return { spec, bones, boneIndex, materials, materialId, eyeIds };
}

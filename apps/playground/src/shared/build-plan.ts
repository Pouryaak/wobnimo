/* How a character is shown being built: the parts its spec lists, grouped
   into a few shaping steps by the bones they hang on (both ears at once,
   then the arms…), and a plain clay palette for before the colour goes on.
   The site's replay and the studio both stage a build from this. */

import type { CharacterSpec, Palette, PartSpec } from '@wobnimo/engine';

const CLAY = '#b8b0a2';
const MAX_STEPS = 6;
/* a family with more parts than this is shaped in two passes */
const SPLIT = 7;

export interface BuildStep {
  /** How many of the spec's parts are shaped by the end of this step. */
  parts: number;
  label: string;
  shapes: string;
}

export interface BuildPlan {
  steps: BuildStep[];
  clay: Palette;
}

/* a bone's family name: earL and earR are both "ear", tentacle3 is "tentacle" */
const family = (bone: string) => bone.replace(/([a-z])(L|R|\d+)$/, '$1').replace(/([A-Z])/g, ' $1').toLowerCase();

export function planBuild(spec: CharacterSpec): BuildPlan {
  /* runs of parts on one family of bones, in the order the spec lists them */
  const runs: Array<{ label: string; end: number; size: number }> = [];
  spec.parts.forEach((p, i) => {
    const label = family(p.bone);
    const last = runs[runs.length - 1];
    if (last?.label === label) (last.end = i + 1), last.size++;
    else runs.push({ label, end: i + 1, size: 1 });
  });
  /* big runs take two passes, the second one the detail */
  const passes = runs.flatMap((r) =>
    r.size > SPLIT ? [{ label: r.label, end: r.end - Math.floor(r.size / 2), size: Math.ceil(r.size / 2) }, { label: `${r.label} detail`, end: r.end, size: Math.floor(r.size / 2) }] : [r],
  );
  /* too many passes: fold the smallest into the one before it */
  while (passes.length > MAX_STEPS) {
    let k = 1;
    for (let i = 2; i < passes.length; i++) if (passes[i].size < passes[k].size) k = i;
    passes[k - 1] = { label: passes[k - 1].label, end: passes[k].end, size: passes[k - 1].size + passes[k].size };
    passes.splice(k, 1);
  }
  let start = 0;
  const steps = passes.map((pass): BuildStep => {
    const step = { parts: pass.end, label: pass.label, shapes: count(spec.parts.slice(start, pass.end)) };
    start = pass.end;
    return step;
  });
  return { steps, clay: Object.fromEntries(Object.keys(spec.materials).map((m) => [m, CLAY])) };
}

function count(parts: PartSpec[]): string {
  const n = new Map<string, number>();
  for (const p of parts) {
    const key = p.op === 'sub' ? `${p.shape} cut` : p.shape;
    n.set(key, (n.get(key) ?? 0) + 1);
  }
  return [...n].map(([k, v]) => (v > 1 ? `${k} ×${v}` : k)).join(' · ');
}

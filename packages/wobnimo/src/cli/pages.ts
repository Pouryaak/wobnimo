/* The two pages the CLI serves: a contact sheet that renders itself to a
   PNG and posts it back, and a live preview that reloads as the file
   changes. Both load the engine from the package's own CDN build. */

const STYLE = `
  :root { color-scheme: light; --ink: #16181d; --mute: #6d6a62; --paper: #f4f1e9; --line: #e2ddd1; }
  body { margin: 0; font: 14px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--ink); background: var(--paper); }
`;

/** Cells of the contact sheet, in reading order. */
export const SHEET_CELLS = [
  { label: 'front', state: 'idle', turn: 0 },
  { label: '¾ turn', state: 'idle', turn: 0.75 },
  { label: 'side', state: 'idle', turn: Math.PI / 2 },
  { label: 'back', state: 'idle', turn: Math.PI },
  { label: 'face close-up', state: 'idle', turn: 0, closeup: true },
  { label: 'thinking', state: 'thinking' },
  { label: 'listening', state: 'listening' },
  { label: 'speaking', state: 'speaking' },
  { label: 'working', state: 'working' },
  { label: 'error', state: 'error' },
  { label: 'surprised', state: 'surprised' },
  /* between hops: 1.5 s in, the shared celebration is mid-somersault */
  { label: 'celebrating', state: 'celebrating', settle: 2.1 },
  { label: 'sad', state: 'sad' },
  { label: 'sleeping', state: 'sleeping' },
  { label: 'as a 56px avatar', state: 'idle', small: 56 },
];

/** Renders the sheet onto a canvas and posts it to /result as a PNG. */
export function sheetPage(cell: number): string {
  return `<!doctype html><meta charset="utf-8"><title>wobnimo preview</title><style>${STYLE}</style>
<body><canvas id="sheet"></canvas>
<script type="module">
const fail = (msg) => fetch('/error', { method: 'POST', body: String(msg) });
addEventListener('error', (e) => fail(e.message));
addEventListener('unhandledrejection', (e) => fail(e.reason?.message ?? e.reason));
try {
  const { snapshot, compile } = await import('/wobnimo.js');
  const spec = await (await fetch('/spec.json')).json();
  const summary = await (await fetch('/summary.json')).json();
  compile(spec);
  const cells = ${JSON.stringify(SHEET_CELLS)};
  const size = ${cell}, cols = 5, label = 26, pad = 10, head = 54;
  const canvas = document.getElementById('sheet');
  canvas.width = cols * (size + pad) + pad;
  canvas.height = head + Math.ceil(cells.length / cols) * (size + label + pad) + pad;
  const g = canvas.getContext('2d');
  g.fillStyle = '#f4f1e9';
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = '#16181d';
  g.font = '600 20px system-ui, sans-serif';
  g.fillText(spec.name + ' (' + spec.id + ')', pad, 30);
  g.font = '13px system-ui, sans-serif';
  g.fillStyle = summary.errors ? '#c2410c' : summary.warnings ? '#a16207' : '#3f6212';
  g.fillText(summary.line, pad, 47);
  for (const [i, c] of cells.entries()) {
    const x = pad + (i % cols) * (size + pad);
    const y = head + Math.floor(i / cols) * (size + label + pad);
    g.fillStyle = '#ffffff';
    g.beginPath(); g.roundRect(x, y, size, size, 10); g.fill();
    /* the close-up re-aims the camera at the eyes */
    const subject = c.closeup ? { ...spec, frame: summary.closeup } : spec;
    const shot = await snapshot(subject, { state: c.state, size: c.small ?? size, pixelRatio: 1, seed: 0.3, turn: c.turn ?? 0, settle: c.settle ?? 1.5 });
    const s = c.small ?? size;
    g.drawImage(shot, x + (size - s) / 2, y + (size - s) / 2, s, s);
    g.fillStyle = '#6d6a62';
    g.font = '13px system-ui, sans-serif';
    g.fillText(c.label, x + 4, y + size + 18);
  }
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  await fetch('/result', { method: 'POST', body: blob });
} catch (e) {
  fail(e?.message ?? e);
}
</script>`;
}

/** A live mascot with every state, the check report, and a reload whenever the file changes. */
export function livePage(): string {
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>wobnimo live preview</title>
<style>${STYLE}
  main { display: grid; grid-template-columns: minmax(280px, 520px) minmax(0, 1fr); gap: 24px; padding: 24px; max-width: 1200px; margin: 0 auto; }
  @media (max-width: 760px) { main { grid-template-columns: 1fr; } }
  #stage { aspect-ratio: 1; background: radial-gradient(circle at 50% 40%, #fff, #ebe6da); border-radius: 18px; }
  h1 { margin: 0 0 4px; font-size: 22px; } p { margin: 0 0 12px; color: var(--mute); }
  .states { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0 18px; }
  button { font: inherit; border: 1px solid var(--line); background: #fff; border-radius: 999px; padding: 6px 12px; cursor: pointer; }
  button[aria-pressed="true"] { background: var(--ink); color: #fff; border-color: var(--ink); }
  pre { white-space: pre-wrap; background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 14px; font: 12.5px/1.5 ui-monospace, Menlo, Consolas, monospace; overflow-x: auto; }
  .err { color: #c2410c; }
</style>
<main>
  <div id="stage"></div>
  <section>
    <h1 id="name">Loading…</h1><p id="tagline"></p>
    <div class="states" id="states"></div>
    <pre id="report"></pre>
  </section>
</main>
<script type="module">
import { mount, STATES } from '/wobnimo.js';
let mascot = null, state = 'idle', version = -1;
const states = document.getElementById('states');
for (const s of STATES) {
  const b = document.createElement('button');
  b.textContent = s;
  b.onclick = () => { state = s; mascot?.setState(s); paint(); };
  states.append(b);
}
const paint = () => states.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === state)));
async function load() {
  const r = await (await fetch('/state.json')).json();
  if (r.version === version) return;
  version = r.version;
  document.getElementById('report').textContent = r.report;
  if (!r.spec) { document.getElementById('report').className = 'err'; return; }
  document.getElementById('report').className = '';
  document.getElementById('name').textContent = r.spec.name;
  document.getElementById('tagline').textContent = r.spec.tagline;
  try {
    if (mascot) mascot.setSpec(r.spec);
    else mascot = mount(document.getElementById('stage'), r.spec, { state });
  } catch (e) {
    document.getElementById('report').textContent = String(e.message) + '\\n\\n' + r.report;
    document.getElementById('report').className = 'err';
  }
  paint();
}
await load();
setInterval(load, 600);
</script>`;
}

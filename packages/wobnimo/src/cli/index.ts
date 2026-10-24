/* `npx wobnimo`: the tools an agent (or a person) uses to design a mascot.

     new <id>         start from the starter template
     check <file>     what a render would show is wrong, in words and numbers
     preview <file>   a contact sheet PNG to look at, or --live to watch edits
     skill            add the mascot-design skill to this project

   Everything here runs on what is already on the machine: Node for the
   checks, any installed Chromium-family browser for the pictures. */

import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, watch, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCharacter, formatCheck, type CheckReport } from '@wobnimo/engine/check';
import { findBrowser, launchHeadless, openInBrowser } from './browser';
import { loadSpec, LoadError, needsTypeStripFlag } from './load';
import { livePage, sheetPage } from './pages';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = join(ROOT, 'skill');
const ENGINE = join(ROOT, 'dist', 'wobnimo.js');

const HELP = `wobnimo: design your own mascot

Usage
  npx wobnimo new <id>                  Start a mascot from the starter template (writes mascots/<id>.ts)
  npx wobnimo check <file>              Find what would look wrong once rendered, with exact fixes
  npx wobnimo preview <file>            Render every state and angle to one PNG, and check it
  npx wobnimo preview <file> --live     Open a live preview that reloads as you edit
  npx wobnimo skill                     Add the mascot-design skill for Claude Code, Codex, Cursor and others

Options
  --export <name>   Which export to use when a file has several characters
  --out <file>      Where preview writes its PNG (default .wobnimo/<id>.png)
  --size <px>       Size of each picture on the sheet (default 240)
  --json            check: print the report as JSON
  --browser <path>  preview: the Chrome, Edge or Chromium to use (or set WOBNIMO_BROWSER)
  --dir <path>      new: folder for the file (default mascots); skill: where to install

Docs: https://pouryaak.github.io/wobnimo/llms.txt`;

interface Args {
  command: string;
  target?: string;
  flags: Record<string, string | true>;
}

function parse(argv: string[]): Args {
  const flags: Record<string, string | true> = {};
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      const next = argv[i + 1];
      if (v !== undefined) flags[k] = v;
      else if (next !== undefined && !next.startsWith('--') && !['live', 'json', 'force'].includes(k)) flags[k] = argv[++i];
      else flags[k] = true;
    } else if (a === '-h') flags.help = true;
    else rest.push(a);
  }
  return { command: rest[0] ?? 'help', target: rest[1], flags };
}

const str = (v: string | true | undefined) => (typeof v === 'string' ? v : undefined);

function fail(message: string, code = 1): never {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

async function main() {
  const args = parse(process.argv.slice(2));
  if (args.flags.version || args.command === 'version') return console.log(JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version);
  if (args.flags.help || args.command === 'help') return console.log(HELP);

  /* TypeScript specs on Node 22.6–22.17: run again with type stripping switched on */
  if (args.target && needsTypeStripFlag(args.target)) {
    const r = spawnSync(process.execPath, ['--experimental-strip-types', '--no-warnings', ...process.argv.slice(1)], { stdio: 'inherit' });
    process.exit(r.status ?? 1);
  }

  switch (args.command) {
    case 'new':
      return create(args);
    case 'check':
      return check(args);
    case 'preview':
      return args.flags.live ? live(args) : preview(args);
    case 'skill':
      return skill(args);
    default:
      fail(`Unknown command "${args.command}".\n\n${HELP}`);
  }
}

/* ---- new ---- */

function create(args: Args) {
  const id = args.target;
  if (!id || !/^[a-z][a-z0-9-]*$/.test(id)) fail('Give the mascot an id: lowercase letters, digits and dashes, like `npx wobnimo new sprout`.');
  const dir = resolve(str(args.flags.dir) ?? 'mascots');
  const file = join(dir, `${id}.ts`);
  if (existsSync(file) && !args.flags.force) fail(`${relative(process.cwd(), file)} already exists. Use --force to overwrite it.`);
  const name = id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  const template = readFileSync(join(SKILL, 'templates', 'starter.ts'), 'utf8')
    .replaceAll('__ID__', id)
    .replaceAll('__NAME__', name)
    .replaceAll('__CONST__', id.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase()));
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, template);
  console.log(`Wrote ${relative(process.cwd(), file)}: a simple round character that passes every check.
Reshape it into yours, then run:
  npx wobnimo check ${relative(process.cwd(), file)}
  npx wobnimo preview ${relative(process.cwd(), file)}`);
}

/* ---- check ---- */

async function check(args: Args) {
  if (!args.target) fail('Which file? `npx wobnimo check mascots/sprout.ts`');
  const { spec } = await load(args);
  const report = checkCharacter(spec);
  if (args.flags.json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(formatCheck(report));
    console.log(nextStep(report, args.target));
  }
  process.exit(report.ok ? 0 : 1);
}

function nextStep(report: CheckReport, file: string): string {
  if (!report.ok) return `\nFix the errors (each says what to change), then run the check again.`;
  return `\nNext: npx wobnimo preview ${file}, then look at the picture.`;
}

async function load(args: Args) {
  try {
    return await loadSpec(args.target!, str(args.flags.export));
  } catch (e) {
    fail(e instanceof LoadError ? e.message : String(e));
  }
}

function summaryLine(report: CheckReport): string {
  const n = (l: string) => report.issues.filter((i) => i.level === l).length;
  if (!report.issues.length) return 'check: no problems found';
  return `check: ${n('error')} errors, ${n('warning')} warnings, ${n('note')} notes (run wobnimo check for details)`;
}

/* ---- preview ---- */

type Route = (req: IncomingMessage, res: ServerResponse, body: Buffer) => void;

function serve(routes: Record<string, Route>): Promise<{ url: string; close: () => void }> {
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const path = new URL(req.url ?? '/', 'http://x').pathname;
      const route = routes[path];
      if (!route) {
        res.writeHead(404);
        return res.end();
      }
      route(req, res, Buffer.concat(chunks));
    });
  });
  return new Promise((done) =>
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number };
      done({ url: `http://127.0.0.1:${port}/`, close: () => server.close() });
    }),
  );
}

const send = (type: string, body: string | Buffer) => (_: IncomingMessage, res: ServerResponse) => {
  res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
};

function engineBundle(): Buffer {
  if (!existsSync(ENGINE)) fail(`The engine bundle is missing (${ENGINE}). Reinstall wobnimo.`);
  return readFileSync(ENGINE);
}

async function preview(args: Args) {
  if (!args.target) fail('Which file? `npx wobnimo preview mascots/sprout.ts`');
  const { spec } = await load(args);
  const report = checkCharacter(spec);
  const size = Math.max(96, Math.min(512, Number(str(args.flags.size) ?? 240) || 240));
  const out = resolve(str(args.flags.out) ?? join('.wobnimo', `${spec.id}.png`));

  /* a spec that does not even resolve cannot be drawn: report that instead */
  if (report.issues.some((i) => i.where === 'spec' || (i.level === 'error' && !report.extents))) {
    console.log(formatCheck(report));
    fail('\nThe spec has structural errors, so there is nothing to draw yet. Fix them first.');
  }

  type Outcome = { png?: Buffer; error?: string };
  let settle: (r: Outcome) => void = () => {};
  const result = new Promise<Outcome>((r) => (settle = r));
  const server = await serve({
    '/': send('text/html', sheetPage(size)),
    '/wobnimo.js': send('text/javascript', engineBundle()),
    '/spec.json': send('application/json', JSON.stringify(spec)),
    '/summary.json': send(
      'application/json',
      JSON.stringify({ line: summaryLine(report), errors: !report.ok, warnings: report.issues.some((i) => i.level === 'warning'), closeup: report.closeup }),
    ),
    '/result': (_, res, body) => {
      res.end();
      settle({ png: body });
    },
    '/error': (_, res, body) => {
      res.end();
      settle({ error: body.toString() });
    },
  });

  const browser = findBrowser(str(args.flags.browser) ?? undefined);
  let headless: ReturnType<typeof launchHeadless> | null = null;
  if (browser) {
    headless = launchHeadless(browser, server.url);
  } else {
    console.log(`No Chrome, Edge or Chromium found to render with (set WOBNIMO_BROWSER to one).\nOpening your browser instead; the picture is saved once it has drawn. Or open ${server.url} yourself.`);
    openInBrowser(server.url);
  }
  const timeout = new Promise<Outcome>((r) => setTimeout(() => r({ error: 'Timed out after 120 seconds waiting for the browser to draw.' }), 120_000).unref());
  const r = await Promise.race([result, timeout]);
  headless?.close();
  server.close();

  if (r.error || !r.png) fail(`Preview failed: ${r.error}`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, r.png);
  const rel = relative(process.cwd(), out);
  console.log(`Wrote ${rel}: front, ¾, side, back, a face close-up, nine states and a 56px avatar.
Open it and look: is every part where you meant it, does each state read, does it look like "${spec.tagline}"?\n`);
  console.log(formatCheck(report));
  ignoreOutput();
  process.exit(0);
}

/* keep generated previews out of git */
function ignoreOutput() {
  const dir = resolve('.wobnimo');
  if (existsSync(dir) && !existsSync(join(dir, '.gitignore'))) writeFileSync(join(dir, '.gitignore'), '*\n');
}

async function live(args: Args) {
  if (!args.target) fail('Which file? `npx wobnimo preview mascots/sprout.ts --live`');
  let version = 0;
  let state = { version, spec: null as unknown, report: 'Loading…' };
  const refresh = async () => {
    version++;
    try {
      const { spec } = await loadSpec(args.target!, str(args.flags.export));
      const report = checkCharacter(spec);
      state = { version, spec: report.ok || report.extents ? spec : null, report: formatCheck(report) };
    } catch (e) {
      state = { version, spec: null, report: e instanceof Error ? e.message : String(e) };
    }
  };
  await refresh();
  const server = await serve({
    '/': send('text/html', livePage()),
    '/wobnimo.js': send('text/javascript', engineBundle()),
    '/state.json': (req, res) => send('application/json', JSON.stringify(state))(req, res),
  });
  /* watch the file; editors often replace it, so watch its folder */
  const file = resolve(args.target);
  let timer: NodeJS.Timeout | undefined;
  let last = statSync(file).mtimeMs;
  watch(dirname(file), (_, name) => {
    if (name && basename(file) !== String(name)) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        const now = statSync(file).mtimeMs;
        if (now === last) return;
        last = now;
      } catch {
        return;
      }
      void refresh();
    }, 120);
  });
  console.log(`Live preview of ${args.target}: ${server.url}\nIt reloads when the file changes. Ctrl+C to stop.`);
  openInBrowser(server.url);
}

/* ---- skill ---- */

function skill(args: Args) {
  if (!existsSync(join(SKILL, 'SKILL.md'))) fail(`The skill is missing from this install (${SKILL}).`);
  const explicit = str(args.flags.dir);
  /* Claude Code reads .claude/skills; Codex, Cursor, OpenCode and Cline read .agents/skills */
  const targets = explicit ? [resolve(explicit)] : [resolve('.claude', 'skills', 'wobnimo-mascot'), resolve('.agents', 'skills', 'wobnimo-mascot')];
  for (const t of targets) {
    mkdirSync(t, { recursive: true });
    cpSync(SKILL, t, { recursive: true, force: true });
    console.log(`Added the skill to ${relative(process.cwd(), t) || t}`);
  }
  console.log(`
Now ask your agent for a mascot in one sentence, for example:
  "Use the wobnimo-mascot skill to make a mascot for this app: a sleepy cloud wearing headphones."
Agents without skills can read ${relative(process.cwd(), join(targets[0], 'SKILL.md'))} and follow it.`);
}

main().catch((e) => fail(e instanceof Error ? (e.stack ?? e.message) : String(e)));

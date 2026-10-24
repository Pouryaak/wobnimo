/* Finding a Chromium-family browser already on the machine and running it
   headless, so `wobnimo preview` needs no download and no dependency.
   WebGL runs on SwiftShader, Chrome's software renderer: slower than a
   GPU, but the same picture on every machine, CI included. */

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';

const env = process.env;

function candidates(): string[] {
  const own = [env.WOBNIMO_BROWSER, env.CHROME_PATH, env.PUPPETEER_EXECUTABLE_PATH].filter((p): p is string => !!p);
  const playwright = playwrightChromium();
  if (process.platform === 'darwin') {
    const apps = ['Google Chrome', 'Google Chrome Canary', 'Chromium', 'Microsoft Edge', 'Brave Browser', 'Arc', 'Vivaldi'];
    const roots = ['/Applications', join(homedir(), 'Applications')];
    const bins: Record<string, string> = { Arc: 'Arc', 'Brave Browser': 'Brave Browser', Vivaldi: 'Vivaldi' };
    return [...own, ...roots.flatMap((r) => apps.map((a) => join(r, `${a}.app`, 'Contents', 'MacOS', bins[a] ?? a))), ...playwright];
  }
  if (process.platform === 'win32') {
    const roots = [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter((p): p is string => !!p);
    const rel = ['Google\\Chrome\\Application\\chrome.exe', 'Microsoft\\Edge\\Application\\msedge.exe', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe', 'Chromium\\Application\\chrome.exe'];
    return [...own, ...roots.flatMap((r) => rel.map((p) => join(r, p))), ...playwright];
  }
  const names = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'microsoft-edge-stable', 'brave-browser'];
  const dirs = (env.PATH ?? '').split(delimiter).filter(Boolean);
  return [...own, ...names.flatMap((n) => dirs.map((d) => join(d, n))), '/snap/bin/chromium', ...playwright];
}

/* browsers Playwright has already downloaded, newest first */
function playwrightChromium(): string[] {
  const roots = [
    env.PLAYWRIGHT_BROWSERS_PATH,
    process.platform === 'darwin' ? join(homedir(), 'Library', 'Caches', 'ms-playwright') : '',
    process.platform === 'win32' ? join(env.LOCALAPPDATA ?? '', 'ms-playwright') : join(homedir(), '.cache', 'ms-playwright'),
  ].filter((r): r is string => !!r && existsSync(r));
  const out: string[] = [];
  for (const root of roots) {
    const builds = readdirSync(root).filter((d) => /^chromium(-\d+)?$/.test(d)).sort().reverse();
    for (const b of builds) {
      out.push(
        join(root, b, 'chrome-linux', 'chrome'),
        join(root, b, 'chrome-linux64', 'chrome'),
        join(root, b, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
        join(root, b, 'chrome-mac-arm64', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
        join(root, b, 'chrome-win', 'chrome.exe'),
        join(root, b, 'chrome-win64', 'chrome.exe'),
      );
    }
    /* a flat layout: <root>/chromium or <root>/chromium/chrome */
    out.push(join(root, 'chromium'), join(root, 'chromium', 'chrome'));
  }
  return out;
}

/** The first browser that exists, or null. */
export function findBrowser(explicit?: string): string | null {
  const isFile = (p: string) => {
    try {
      return statSync(p).isFile();
    } catch {
      return false;
    }
  };
  if (explicit) return isFile(explicit) ? explicit : null;
  return candidates().find(isFile) ?? null;
}

export interface Headless {
  close(): void;
}

/** Opens `url` in a headless browser. `software` renders WebGL on the CPU. */
export function launchHeadless(executable: string, url: string, software = true): Headless {
  const profile = mkdtempSync(join(tmpdir(), 'wobnimo-'));
  const args = [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--mute-audio',
    '--hide-scrollbars',
    `--user-data-dir=${profile}`,
    '--window-size=1400,1100',
    ...(software ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--ignore-gpu-blocklist']),
    /* Chrome refuses to sandbox as root, which is how containers and CI run */
    ...(process.platform === 'linux' && process.getuid?.() === 0 ? ['--no-sandbox'] : []),
    url,
  ];
  const child: ChildProcess = spawn(executable, args, { stdio: 'ignore', detached: process.platform !== 'win32' });
  child.on('error', () => {});
  return {
    close() {
      try {
        if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
        else if (child.pid) process.kill(-child.pid, 'SIGKILL');
      } catch {
        child.kill('SIGKILL');
      }
      /* the profile may still be locked for a moment on Windows; it is in tmp either way */
      setTimeout(() => rmSync(profile, { recursive: true, force: true, maxRetries: 3 }), 300).unref();
    },
  };
}

/** Opens `url` in the person's own browser. */
export function openInBrowser(url: string): void {
  const [cmd, args] =
    process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', url]] : ['xdg-open', [url]];
  const child = spawn(cmd, args as string[], { stdio: 'ignore', detached: true });
  child.on('error', () => {});
  child.unref();
}

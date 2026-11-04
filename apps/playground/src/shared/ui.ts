/* Small page helpers every Wobnimo page uses: the toast, copying to the
   clipboard, and running work when the browser has a moment. */

let toastTimer: number | undefined;

/** Shows a short message in the page's `#toast`. */
export function toast(msg: string) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove('show'), 2600);
}

/** Copies `text` and says so with `msg`. */
export async function copyText(text: string, msg: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* the clipboard can be off limits in frames: fall back to a hidden textarea */
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } finally {
      ta.remove();
    }
  }
  toast(msg);
}

/** Runs `fn` when the browser has a moment, or soon anyway. */
export const idle = (fn: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));

/** Fills in the nav's GitHub star count, when the API answers. */
export function showStars() {
  idle(async () => {
    try {
      const res = await fetch('https://api.github.com/repos/Pouryaak/wobnimo');
      if (!res.ok) return;
      const n: number = (await res.json()).stargazers_count;
      const count = document.getElementById('star-count')!;
      count.textContent = n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
      count.parentElement!.hidden = false;
    } catch {
      /* offline or rate limited: the button still works without a number */
    }
  });
}

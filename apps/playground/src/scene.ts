/* The opening shot: three of the cast play a short scene about a day in
   the life of an agent, beat by beat, with subtitles and a camera's
   timecode. It runs only while it is on screen, and waits for a click
   when the visitor prefers reduced motion. */

import type { MascotState } from '@wobnimo/engine';
import type { Slot } from './pool';

interface Beat {
  /** Who does what, by character id. */
  cast: Record<string, MascotState>;
  line: string;
  seconds: number;
}

const BEATS: Beat[] = [
  { cast: { miso: 'idle', microduck: 'idle', nimbus: 'idle' }, line: '', seconds: 3 },
  { cast: { miso: 'listening', microduck: 'speaking', nimbus: 'listening' }, line: 'Microduck: “Shipping the new build, team.”', seconds: 4.2 },
  { cast: { miso: 'thinking', microduck: 'working', nimbus: 'thinking' }, line: '[ running the tests ]', seconds: 3.6 },
  { cast: { miso: 'surprised', microduck: 'error', nimbus: 'error' }, line: '[ one test fails ]', seconds: 3.4 },
  { cast: { miso: 'sad', microduck: 'sad', nimbus: 'sad' }, line: 'Nimbus: “Oh no.”', seconds: 3.6 },
  { cast: { miso: 'working', microduck: 'working', nimbus: 'thinking' }, line: '[ fixing it together ]', seconds: 3.6 },
  { cast: { miso: 'celebrating', microduck: 'celebrating', nimbus: 'celebrating' }, line: '[ all green ]', seconds: 4.4 },
  { cast: { miso: 'sleeping', microduck: 'sleeping', nimbus: 'sleeping' }, line: '[ end of day ]', seconds: 4 },
];

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

/** Film timecode at 24 frames a second: hours, minutes, seconds, frames. */
function timecode(seconds: number) {
  return `${pad(seconds / 3600)}:${pad((seconds / 60) % 60)}:${pad(seconds % 60)}:${pad((seconds * 24) % 24)}`;
}

export function playScene(root: HTMLElement, actors: Map<string, Slot>, fps: () => number) {
  const label = root.querySelector<HTMLElement>('#scene-label')!;
  const subtitle = root.querySelector<HTMLElement>('#subtitle')!;
  const clock = root.querySelector<HTMLElement>('#timecode')!;
  const rate = root.querySelector<HTMLElement>('#fps')!;
  const toggle = root.querySelector<HTMLButtonElement>('#scene-toggle')!;

  let beat = -1;
  let left = 0;
  let filmed = 0;
  let onScreen = true;
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const advance = () => {
    beat = (beat + 1) % BEATS.length;
    const b = BEATS[beat];
    left = b.seconds;
    for (const [id, state] of Object.entries(b.cast)) actors.get(id)?.setState(state);
    subtitle.textContent = b.line;
    label.textContent = `Scene ${beat + 1} / ${BEATS.length} · ${b.cast.microduck}`;
  };

  const render = () => {
    toggle.textContent = paused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-pressed', String(paused));
  };

  /* resuming moves straight on to the next beat */
  toggle.addEventListener('click', () => {
    paused = !paused;
    if (!paused) left = 0;
    render();
  });
  new IntersectionObserver(([e]) => (onScreen = e.isIntersecting)).observe(root);

  let last = performance.now();
  const loop = (now: number) => {
    requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!onScreen || document.hidden) return;
    if (!paused) {
      filmed += dt;
      left -= dt;
      if (left <= 0) advance();
    }
    clock.textContent = timecode(filmed);
    rate.textContent = `${Math.round(fps())} fps`;
  };

  advance();
  render();
  requestAnimationFrame(loop);
}

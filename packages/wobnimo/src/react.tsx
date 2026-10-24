/* The React wrapper. One component, SSR-safe: it renders a plain div and
   mounts the mascot in an effect, so it works in Next.js app-router files
   (mark them "use client"). React is an optional peer dependency.

     import { Mascot } from 'wobnimo/react';
     <Mascot character="mochi" state="thinking" />
     <Mascot character="mochi" status={status} />   // Vercel AI SDK useChat */

import { useEffect, useRef } from 'react';
import {
  Mascot as WobnimoMascot,
  driveFromStatus,
  type CharacterSpec,
  type ChatStatus,
  type MascotOptions,
  type MascotState,
  type Palette,
} from '@wobnimo/engine';
import { characters } from '@wobnimo/characters';

const byId = new Map(characters.map((c) => [c.id, c]));

export interface MascotProps extends Omit<MascotOptions, 'state' | 'palette'> {
  /** A built-in character id (`"mochi"`) or any CharacterSpec of your own. */
  character: string | CharacterSpec;
  /** The mascot's state. Ignored while `status` is set. */
  state?: MascotState;
  /** A chat status (e.g. the Vercel AI SDK's `useChat` status); drives the state for you. */
  status?: ChatStatus;
  /** Recolour materials by name, e.g. `{ shell: '#e0457b' }`. */
  palette?: Palette;
  /** Fired when the mascot is clicked or poked. */
  onPoke?: () => void;
  /** Fired the first time a frame is on screen; use it to fade the mascot in. */
  onReady?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const resolve = (character: string | CharacterSpec): CharacterSpec | undefined =>
  typeof character === 'string' ? byId.get(character) : character;

export function Mascot({ character, state, status, palette, onPoke, onReady, className, style, ...options }: MascotProps) {
  const host = useRef<HTMLDivElement>(null);
  const mascot = useRef<WobnimoMascot | null>(null);
  const spec = resolve(character);

  /* latest callbacks, without rebuilding the mascot when they change */
  const poke = useRef(onPoke);
  const ready = useRef(onReady);
  poke.current = onPoke;
  ready.current = onReady;

  useEffect(() => {
    if (!host.current || !spec) return;
    const m = new WobnimoMascot(host.current.appendChild(document.createElement('canvas')), spec, {
      ...options,
      state: status ? 'idle' : state,
      palette,
    });
    m.canvas.style.cssText = 'display:block;width:100%;height:100%';
    const offPoke = m.on('poke', () => poke.current?.());
    const offReady = m.on('ready', () => ready.current?.());
    mascot.current = m;
    return () => {
      offPoke();
      offReady();
      m.dispose();
      m.canvas.remove();
      mascot.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec]);

  useEffect(() => {
    if (mascot.current && status) driveFromStatus(mascot.current, status);
  }, [status]);

  useEffect(() => {
    if (mascot.current && state && !status) mascot.current.setState(state);
  }, [state, status]);

  useEffect(() => {
    mascot.current?.setPalette(palette);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(palette)]);

  return <div ref={host} className={className} style={{ width: 160, height: 160, ...style }} />;
}

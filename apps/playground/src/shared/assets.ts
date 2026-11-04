/* Where the page finds its static files, and the URLs of the character
   stills. A page one folder down (the studio) is built with a root of
   "../", so the same code serves both. */

import type { CharacterSpec } from '@wobnimo/engine';

declare const __ASSET_ROOT__: string;
declare const __POSTER_KEYS__: Record<string, string>;

/** A static file's URL from the page that is running. */
export const asset = (path: string) => `${__ASSET_ROOT__}${path}`;

/** Whether a character has a pre-rendered still (every cast member does; a new one doesn't). */
export const hasStill = (spec: CharacterSpec) => spec.id in __POSTER_KEYS__;

/* the key changes whenever a still is re-rendered, so an old one is never served from a cache */
export const stillUrl = (spec: CharacterSpec, kind: 'poster' | 'face' = 'poster') =>
  asset(`posters/${spec.id}${kind === 'face' ? '-face' : ''}.webp?v=${__POSTER_KEYS__[spec.id]}`);

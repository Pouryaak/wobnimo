/* The cast and states, as plain data, for the build: llms.txt, the stills
   manifest check and the numbers the page prints. */
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { STATES } from '@wobnimo/engine';
import { characters as cast } from '@wobnimo/characters';
import { posterInput } from './_poster-spec';

export const states = STATES;
export const characters = cast.map((c) => ({ id: c.id, name: c.name, tagline: c.tagline }));

/** A key per character that changes whenever its still would look different. */
export const posterKeys: Record<string, string> = Object.fromEntries(
  cast.map((c, i) => [c.id, createHash('sha256').update(posterInput(c, i)).digest('hex').slice(0, 12)]),
);

/** A character's spec, gzipped, on average: the "~2 KB a character" on the page. */
export const specGzipAverage = cast.reduce((sum, c) => sum + gzipSync(JSON.stringify(c)).length, 0) / cast.length;

/* The cast and states, as plain data, for generating llms.txt at build time. */
import { STATES } from '@wobnimo/engine';
import { characters as cast } from '@wobnimo/characters';

export const states = STATES;
export const characters = cast.map((c) => ({ id: c.id, name: c.name, tagline: c.tagline }));

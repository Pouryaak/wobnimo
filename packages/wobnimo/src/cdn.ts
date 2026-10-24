/* The single-file build for <script type="module"> from a CDN. Loading it
   registers <wobnimo-mascot> with the whole cast, and it also exports the full
   API. The registration is an explicit call, not a side-effect import: the
   bundler is free to drop `import './element'` as unused. */
import { defineWobnimoElement } from '@wobnimo/characters';

defineWobnimoElement();

export * from '@wobnimo/engine';
export { characters, defineWobnimoElement } from '@wobnimo/characters';

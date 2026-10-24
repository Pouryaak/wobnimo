import { defineMascotElement, type CharacterSpec } from '@wobnimo/engine';
import { bao } from './bao';
import { berry } from './berry';
import { boo } from './boo';
import { bumble } from './bumble';
import { cacti } from './cacti';
import { cap } from './cap';
import { drift } from './drift';
import { ember } from './ember';
import { hop } from './hop';
import { inky } from './inky';
import { latte } from './latte';
import { microduck } from './microduck';
import { miso } from './miso';
import { mochi } from './mochi';
import { pebble } from './pebble';
import { pip } from './pip';
import { rex } from './rex';
import { swirl } from './swirl';
import { tad } from './tad';
import { volt } from './volt';

export { bao, berry, boo, bumble, cacti, cap, drift, ember, hop, inky, latte, microduck, miso, mochi, pebble, pip, rex, swirl, tad, volt };

/** The original ten, hand-built body plans, each chosen to stress the engine somewhere new. */
export const originals: CharacterSpec[] = [volt, pip, mochi, boo, inky, miso, tad, pebble, rex, microduck];

/** Ten more, each written as a spec from nothing but one sentence: the "describe it" cast. */
export const described: CharacterSpec[] = [drift, cacti, latte, bumble, swirl, ember, cap, berry, bao, hop];

/** The whole cast. */
export const characters: CharacterSpec[] = [...originals, ...described];

/** Registers <wobnimo-mascot> with the whole cast: `<wobnimo-mascot character="pip">`. */
export function defineWobnimoElement(tag = 'wobnimo-mascot') {
  defineMascotElement(characters, tag);
}

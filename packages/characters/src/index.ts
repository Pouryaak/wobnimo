import { defineMascotElement, type CharacterSpec } from '@wobnimo/engine';
import { boo } from './boo';
import { inky } from './inky';
import { microduck } from './microduck';
import { miso } from './miso';
import { mochi } from './mochi';
import { nimbus } from './nimbus';
import { pebble } from './pebble';
import { pip } from './pip';
import { rex } from './rex';
import { tad } from './tad';
import { volt } from './volt';

export { boo, inky, microduck, miso, mochi, nimbus, pebble, pip, rex, tad, volt };

/** Eleven body plans, chosen so each one stresses the engine somewhere new. */
export const characters: CharacterSpec[] = [volt, pip, mochi, boo, inky, miso, tad, pebble, rex, nimbus, microduck];

/** Registers <wobnimo-mascot> with the whole cast: `<wobnimo-mascot character="pip">`. */
export function defineWobnimoElement(tag = 'wobnimo-mascot') {
  defineMascotElement(characters, tag);
}

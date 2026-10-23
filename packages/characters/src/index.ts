import type { CharacterSpec } from '@animo/engine';
import { boo } from './boo';
import { inky } from './inky';
import { mochi } from './mochi';
import { pip } from './pip';
import { volt } from './volt';

export { boo, inky, mochi, pip, volt };

/** Five body plans, chosen so each one stresses the engine somewhere new. */
export const characters: CharacterSpec[] = [volt, pip, mochi, boo, inky];

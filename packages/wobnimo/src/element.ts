/* Side effect: registers <wobnimo-mascot> with the whole cast, so
   `import 'wobnimo/element'` is all you need before using the tag. */
import type { CharacterSpec, Mascot, MascotState } from '@wobnimo/engine';
import { defineWobnimoElement } from '@wobnimo/characters';

defineWobnimoElement();

/** The <wobnimo-mascot> element, as TypeScript sees it. */
export interface WobnimoMascotElement extends HTMLElement {
  /** The running mascot once it has mounted, for the full API. */
  readonly mascot: Mascot | null;
  /** Same as the `state` attribute. */
  state: MascotState;
  /** A character of your own, in place of the `character` attribute. */
  spec: CharacterSpec | null;
}

declare global {
  interface HTMLElementTagNameMap {
    'wobnimo-mascot': WobnimoMascotElement;
  }
}

export { defineWobnimoElement };

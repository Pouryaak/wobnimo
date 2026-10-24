/* Side effect: registers <wobnimo-mascot> with the whole cast, so
   `import 'wobnimo/element'` is all you need before using the tag. */
import { defineWobnimoElement } from '@wobnimo/characters';

defineWobnimoElement();

export { defineWobnimoElement };

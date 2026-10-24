/* The single file a <script type="module"> loads from a CDN: it registers
   <wobnimo-mascot> with every character and exposes the API as `wobnimo`. */
import './element';

export * from '@wobnimo/engine';
export { characters, defineWobnimoElement } from '@wobnimo/characters';

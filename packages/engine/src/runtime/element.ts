/* <wobnimo-mascot>: the engine as a custom element, so it drops into plain
   HTML, React, Vue, Svelte or anything else that renders tags.

     defineMascotElement(characters);
     <wobnimo-mascot character="volt" state="thinking" style="width:160px;height:160px"></wobnimo-mascot>

   Attributes: character, state, seed, speed, palette ("shell:#e0457b; trim:#fff"),
   interactive="false", effects="false", framing (room around it, default 1).
   Events: `poke` and `statechange` (detail: the new state).
   Properties: `state`, `spec` (any CharacterSpec, for characters not in the registry), `mascot`. */

import { STATES, type MascotState } from '../behavior/states';
import type { CharacterSpec } from '../spec/types';
import type { Palette } from './customize';
import { Mascot } from './mascot';

const ATTRIBUTES = ['character', 'state', 'seed', 'speed', 'palette', 'interactive', 'effects', 'framing'] as const;

function parsePalette(text: string | null): Palette | undefined {
  if (!text) return undefined;
  const entries = text.split(';').map((pair) => pair.split(':').map((s) => s.trim())).filter(([k, v]) => k && v);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

export function defineMascotElement(characters: CharacterSpec[], tag = 'wobnimo-mascot') {
  if (typeof customElements === 'undefined' || customElements.get(tag)) return;
  const registry = new Map(characters.map((c) => [c.id, c]));

  class WobnimoMascotElement extends HTMLElement {
    static observedAttributes = ATTRIBUTES;
    private instance: Mascot | null = null;
    private custom: CharacterSpec | null = null;
    private readonly canvas: HTMLCanvasElement;

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>:host{display:inline-block;width:160px;height:160px;position:relative}canvas{display:block;width:100%;height:100%;touch-action:manipulation}</style>`;
      this.canvas = document.createElement('canvas');
      root.append(this.canvas);
    }

    /** The live mascot, once connected. */
    get mascot(): Mascot | null {
      return this.instance;
    }

    get state(): MascotState {
      return (this.getAttribute('state') as MascotState) ?? 'idle';
    }

    set state(s: MascotState) {
      this.setAttribute('state', s);
    }

    /** Any spec, for characters that aren't registered. Takes precedence over `character`. */
    get spec(): CharacterSpec | null {
      return this.custom ?? registry.get(this.getAttribute('character') ?? '') ?? null;
    }

    set spec(spec: CharacterSpec | null) {
      this.custom = spec;
      this.rebuild();
    }

    connectedCallback() {
      this.rebuild();
    }

    disconnectedCallback() {
      this.instance?.dispose();
      this.instance = null;
    }

    attributeChangedCallback(name: (typeof ATTRIBUTES)[number], before: string | null, after: string | null) {
      if (before === after || !this.isConnected) return;
      const m = this.instance;
      if (name === 'state' && m && STATES.includes(after as MascotState)) m.setState(after as MascotState);
      else if (name === 'speed' && m) m.setSpeed(Number(after ?? 1));
      else if (name === 'effects' && m) m.setEffects(after !== 'false');
      else if (name === 'palette' && m) m.setPalette(parsePalette(after));
      else if (name === 'character' && m && this.spec) m.setSpec(this.spec, parsePalette(this.getAttribute('palette')));
      else this.rebuild();
    }

    private rebuild() {
      if (!this.isConnected) return;
      this.instance?.dispose();
      this.instance = null;
      const spec = this.spec;
      if (!spec) {
        console.warn(`<${tag}>: unknown character "${this.getAttribute('character')}". Registered: ${[...registry.keys()].join(', ')}.`);
        return;
      }
      const seed = this.getAttribute('seed');
      const m = new Mascot(this.canvas, spec, {
        state: STATES.includes(this.state) ? this.state : 'idle',
        seed: seed === null ? undefined : Number(seed),
        speed: Number(this.getAttribute('speed') ?? 1),
        palette: parsePalette(this.getAttribute('palette')),
        interactive: this.getAttribute('interactive') !== 'false',
        effects: this.getAttribute('effects') !== 'false',
        framing: Number(this.getAttribute('framing') ?? 1),
      });
      m.on('poke', () => this.dispatchEvent(new CustomEvent('poke', { bubbles: true, composed: true })));
      m.on('state', (s) => this.dispatchEvent(new CustomEvent('statechange', { detail: s, bubbles: true, composed: true })));
      this.instance = m;
    }
  }

  customElements.define(tag, WobnimoMascotElement);
}

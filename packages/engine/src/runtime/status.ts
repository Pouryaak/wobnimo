/* Wiring a mascot to an AI chat is the most common job, so the engine
   speaks the states that chat UIs already emit. The Vercel AI SDK's
   `useChat` returns a `status` of 'submitted' | 'streaming' | 'ready' |
   'error'; pass it straight to the element or to `driveFromStatus`, and the
   mascot thinks while the request is out, speaks while the reply streams,
   celebrates for a beat when it lands, and shows the error when one does. */

import type { MascotState } from '../behavior/states';
import type { Mascot } from './mascot';

/** The chat statuses the AI SDK emits, and anything close enough to map. */
export type ChatStatus = 'submitted' | 'streaming' | 'ready' | 'error' | 'idle';

/** The state a mascot should hold for a given chat status. `ready` is handled on its own, with a short celebration. */
const STEADY: Record<Exclude<ChatStatus, 'ready'>, MascotState> = {
  submitted: 'thinking',
  streaming: 'speaking',
  error: 'error',
  idle: 'idle',
};

/**
 * Drives a mascot from a chat `status`. Call it whenever the status changes
 * (in React, inside an effect on `status`). When a turn finishes (`ready`)
 * the mascot celebrates for `celebrateMs`, then settles to idle.
 */
export function driveFromStatus(mascot: Mascot, status: ChatStatus, celebrateMs = 1400): void {
  if (status === 'ready') {
    /* only celebrate a turn that actually ran, not the idle 'ready' on load */
    if (mascot.state === 'speaking' || mascot.state === 'thinking') {
      mascot.setState('celebrating');
      setTimeout(() => mascot.state === 'celebrating' && mascot.setState('idle'), celebrateMs);
    } else {
      mascot.setState('idle');
    }
    return;
  }
  mascot.setState(STEADY[status] ?? 'idle');
}

/* The shared emotional vocabulary. Every character understands every
   state; what a state looks like on a given body comes from its rig and
   face, not from per-character code. */

import type { Vec3 } from '../spec/types';

export const STATES = ['idle', 'thinking', 'listening', 'speaking', 'sleeping'] as const;
export type MascotState = (typeof STATES)[number];

/** What a face shows, including the short reaction to a poke. */
export type Expression = MascotState | 'happy';

export const EXPRESSION_ID: Record<Expression, number> = {
  idle: 0,
  thinking: 1,
  listening: 2,
  speaking: 3,
  sleeping: 4,
  happy: 5,
};

export interface FaceTargets {
  lid: number;
  squint: number;
  smile: number;
  tilt: number;
  /** How busy the idle waves are. */
  energy: number;
  /** Arms and wings raised. */
  flap: number;
  /** The state's light, in linear RGB. */
  glow: Vec3;
}

export const FACE: Record<Expression, FaceTargets> = {
  idle: { lid: 0.06, squint: 0, smile: 0.35, tilt: 0, energy: 1, flap: 0.08, glow: [0.45, 0.7, 1.0] },
  thinking: { lid: 0.4, squint: 0, smile: -0.15, tilt: 0.22, energy: 0.6, flap: 0.0, glow: [1.0, 0.55, 0.12] },
  listening: { lid: 0, squint: 0, smile: 0.2, tilt: -0.08, energy: 0.8, flap: 0.12, glow: [0.25, 1.0, 0.5] },
  speaking: { lid: 0.04, squint: 0.1, smile: 0.45, tilt: 0, energy: 1.2, flap: 0.28, glow: [0.35, 0.82, 1.0] },
  sleeping: { lid: 1, squint: 0, smile: 0, tilt: 0, energy: 0.35, flap: 0, glow: [0.08, 0.09, 0.18] },
  happy: { lid: 0, squint: 1, smile: 1, tilt: 0, energy: 1.6, flap: 0.85, glow: [1.0, 0.42, 0.72] },
};

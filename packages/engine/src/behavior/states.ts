/* The shared emotional vocabulary. Every character understands every
   state; what a state looks like on a given body comes from its rig,
   its acting and its face, not from per-character code. */

import type { Expression, Vec3 } from '../spec/types';

export type { Expression };

export const STATES = ['idle', 'thinking', 'listening', 'speaking', 'sleeping', 'working', 'error', 'surprised', 'celebrating', 'sad'] as const;
export type MascotState = (typeof STATES)[number];

/** Every expression a face can show: the states plus the reaction to a poke. */
export const EXPRESSIONS: readonly Expression[] = [...STATES, 'happy'];

/** Each expression's number, as the shader sees it. */
export const EXPRESSION_ID = Object.fromEntries(EXPRESSIONS.map((e, i) => [e, i])) as Record<Expression, number>;

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
  /** The studio's brightness: the lights dim while a character sleeps. */
  exposure: number;
  /** Eyes opened wide with small pupils, as in surprise. */
  wide: number;
  /** One eye narrower than the other and a crooked mouth, as when something is off. */
  asym: number;
}

export const FACE: Record<Expression, FaceTargets> = {
  idle: { lid: 0.06, squint: 0, smile: 0.35, tilt: 0, energy: 1, flap: 0.05, glow: [0.45, 0.7, 1.0], exposure: 1, wide: 0, asym: 0 },
  thinking: { lid: 0.4, squint: 0, smile: -0.15, tilt: 0.22, energy: 0.6, flap: 0, glow: [1.0, 0.55, 0.12], exposure: 1, wide: 0, asym: 0 },
  listening: { lid: 0, squint: 0, smile: 0.2, tilt: -0.08, energy: 0.8, flap: 0.05, glow: [0.25, 1.0, 0.5], exposure: 1, wide: 0.15, asym: 0 },
  speaking: { lid: 0.04, squint: 0.1, smile: 0.45, tilt: 0, energy: 1.2, flap: 0.1, glow: [0.35, 0.82, 1.0], exposure: 1, wide: 0, asym: 0 },
  sleeping: { lid: 1, squint: 0, smile: 0, tilt: 0, energy: 0.35, flap: 0, glow: [0.08, 0.09, 0.18], exposure: 0.84, wide: 0, asym: 0 },
  /* heads down and busy, eyes narrowed on the task */
  working: { lid: 0.3, squint: 0.2, smile: 0.05, tilt: 0, energy: 1.3, flap: 0.18, glow: [0.6, 0.45, 1.0], exposure: 1, wide: 0, asym: 0 },
  /* something broke: a wince, one eye screwed shut, a crooked mouth */
  error: { lid: 0.12, squint: 0.15, smile: -0.45, tilt: 0.1, energy: 0.9, flap: 0.25, glow: [1.0, 0.16, 0.12], exposure: 0.97, wide: 0.2, asym: 1 },
  /* eyes wide, pupils pinned, a small round mouth */
  surprised: { lid: 0, squint: 0, smile: 0, tilt: 0, energy: 1, flap: 0.55, glow: [0.95, 0.95, 1.0], exposure: 1.04, wide: 1, asym: 0 },
  celebrating: { lid: 0, squint: 1, smile: 1, tilt: 0, energy: 1.8, flap: 0.9, glow: [1.0, 0.72, 0.2], exposure: 1.08, wide: 0, asym: 0 },
  /* heavy lids sloping down at the outside, a frown */
  sad: { lid: 0.42, squint: 0, smile: -0.85, tilt: -0.32, energy: 0.35, flap: -0.12, glow: [0.22, 0.32, 0.7], exposure: 0.9, wide: 0, asym: 0 },
  happy: { lid: 0, squint: 1, smile: 1, tilt: 0, energy: 1.6, flap: 0.3, glow: [1.0, 0.42, 0.72], exposure: 1.05, wide: 0, asym: 0 },
};

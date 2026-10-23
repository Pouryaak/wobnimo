/* Decides how a character moves. Each state sets targets for a handful
   of channels (where the head points, how the face looks, how high it
   floats) and springs chase them, so any state change, interrupted or
   not, eases across. Hops are scripted on top: a crouch, a parabola with
   an optional spin, a landing squash. Nothing here knows what the
   character looks like; the rig maps channels onto its body, and the
   expression weights let the spec's acting blend between states. */

import { fromEuler, fromScale, fromTranslation, mat4, multiply, type Mat4 } from '../math/mat4';
import { clamp, easeInOut, mix, rng, smoothstep } from '../math/scalar';
import { Spring } from '../math/spring';
import type { Channels } from '../rig/rig';
import type { Temperament, Vec3 } from '../spec/types';
import { Speech } from './speech';
import { EXPRESSION_ID, EXPRESSIONS, FACE, type Expression, type MascotState } from './states';

export const DEFAULT_TEMPERAMENT: Temperament = { float: 0, hop: 0.16, squash: 1, snap: 1, look: 1, snapLook: 0, talkSquash: 0 };

const CROUCH = 0.11;
const REACTION = 1.8;

/** Moments in the animation that effects can react to. */
export type BeatEvent = 'land' | 'syllable' | 'enter:happy';

interface Jump {
  age: number;
  height: number;
  spin: number;
  lean: number;
  air: number;
  landed: boolean;
}

/** Everything one frame needs from the behaviour layer. */
export interface Pose {
  root: Mat4;
  /** The root's smallest scale, for the shader's distance correction. */
  minScale: number;
  lift: number;
  channels: Channels;
  /** How much each expression's acting applies right now; they sum to 1. */
  weights: Record<Expression, number>;
  expression: Expression;
  /** blink, lid, squint, smile */
  faceA: [number, number, number, number];
  /** talk, gaze x, gaze y, tilt */
  faceB: [number, number, number, number];
  /** expression, previous expression, cross-fade, glitch */
  faceC: [number, number, number, number];
  /** seconds in the state, mouth roundness, -, - */
  faceD: [number, number, number, number];
  glow: Vec3;
  exposure: number;
  /** Beats since the last frame, for effects. */
  events: BeatEvent[];
}

export class Brain {
  readonly temperament: Temperament;
  state: MascotState = 'idle';
  /** The pointer relative to the character, in its own sizes (±1 ≈ one size away), or null. */
  pointer: { x: number; y: number } | null = null;

  private shown: Expression = 'idle';
  private previous: Expression = 'idle';
  private switched = 10;
  private time = 0;
  private since = 0;
  private readonly random: () => number;

  private readonly yaw = new Spring();
  private readonly pitch = new Spring();
  private readonly roll = new Spring();
  private readonly squash = new Spring();
  private readonly hover: Spring;
  private readonly face = {
    lid: new Spring(), squint: new Spring(), smile: new Spring(0.3), tilt: new Spring(), talk: new Spring(),
    round: new Spring(), gazeX: new Spring(), gazeY: new Spring(), flap: new Spring(), energy: new Spring(1),
    exposure: new Spring(1),
  };
  private readonly weights: Record<Expression, Spring>;
  private glow: Vec3 = [...FACE.idle.glow];
  private jump: Jump | null = null;
  private look = { yaw: 0, pitch: 0, x: 0, y: 0 };
  private saccade = { x: 0, y: 0, next: 0 };
  private nextLook = 0.6;
  private nextBlink: number;
  private blinkAge = -1;
  private nextHop: number;
  private nextSide = 4;
  private side = 1;
  private nextNod = 2.5;
  private reactUntil = -1;
  private readonly speech: Speech;
  private lastTalk = 0;
  private syllableArmed = true;
  private readonly matrices = { a: mat4(), b: mat4() };

  readonly pose: Pose;

  constructor(temperament: Partial<Temperament> = {}, seed = 0.5) {
    this.temperament = { ...DEFAULT_TEMPERAMENT, ...temperament };
    this.random = rng(seed);
    this.speech = new Speech(this.random);
    this.nextBlink = 1 + this.random() * 3;
    this.nextHop = 6 + this.random() * 6;
    this.hover = new Spring(this.temperament.float);
    this.weights = Object.fromEntries(EXPRESSIONS.map((e) => [e, new Spring(e === 'idle' ? 1 : 0)])) as Record<Expression, Spring>;
    this.pose = {
      root: mat4(), minScale: 1, lift: 0,
      channels: { yaw: 0, pitch: 0, roll: 0, flap: 0, talk: 0, energy: 1 },
      weights: Object.fromEntries(EXPRESSIONS.map((e) => [e, e === 'idle' ? 1 : 0])) as Record<Expression, number>,
      expression: 'idle',
      faceA: [0, 0, 0, 0], faceB: [0, 0, 0, 0], faceC: [0, 0, 1, 0], faceD: [0, 0, 0, 0],
      glow: this.glow, exposure: 1, events: [],
    };
  }

  setState(s: MascotState) {
    if (s === this.state) return;
    this.state = s;
    this.since = 0;
    if (s === 'speaking') this.speech.reset();
    this.nextLook = 0;
  }

  /** A click: a hop with a full turn and a happy face. */
  poke() {
    this.hop(this.temperament.hop * 1.5, this.random() < 0.5 ? 1 : -1);
    this.reactUntil = this.time + REACTION;
  }

  update(dt: number) {
    if (!(dt > 0)) return;
    /* small steps keep the springs stable through a slow frame */
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    for (let i = 0; i < steps; i++) this.step(dt / steps);
  }

  private hop(height: number, spin: number) {
    if (this.jump) return;
    const floats = this.temperament.float > 0;
    this.jump = {
      age: floats ? CROUCH : 0, height, spin, lean: (this.random() - 0.5) * 0.3,
      air: 0.42 + height * 0.45 + (floats ? 0.25 : 0), landed: false,
    };
  }

  private step(dt: number) {
    this.time += dt;
    this.since += dt;
    this.switched += dt;
    const t = this.time;
    const rand = this.random;
    const tm = this.temperament;
    const events = this.pose.events;

    const shown: Expression = t < this.reactUntil ? 'happy' : this.state;
    if (shown !== this.shown) {
      this.previous = this.shown;
      this.shown = shown;
      this.switched = 0;
      if (shown === 'happy') events.push('enter:happy');
    }
    const target = FACE[shown];

    /* glances: a person eases between them, a bird snaps and holds */
    if (t > this.nextLook) {
      this.look.yaw = (rand() - 0.5) * 0.75;
      this.look.pitch = (rand() - 0.5) * 0.24;
      this.look.x = clamp(this.look.yaw * 2.2, -1, 1);
      this.look.y = rand() < 0.3 ? 0.6 : rand() < 0.2 ? -0.6 : 0;
      this.nextLook = t + mix(1.4 + rand() * 2.6, 0.45 + rand() * 1.1, tm.snapLook);
    }
    /* the eyes never quite sit still */
    if (t > this.saccade.next) {
      this.saccade.x = (rand() - 0.5) * 0.22;
      this.saccade.y = (rand() - 0.5) * 0.14;
      this.saccade.next = t + 0.25 + rand() * 0.7;
    }

    let yaw = 0, pitch = 0, roll = 0;
    let bob = Math.sin(t * 1.9) * 0.008;
    let gazeX = 0, gazeY = 0, talk = 0, round = 0, flap = target.flap;
    let freq = 1.3, damping = 0.62;
    let hover = tm.float;
    const p = this.pointer;
    const follows = p && shown !== 'thinking' && shown !== 'sleeping';

    switch (shown) {
      case 'idle':
        yaw = this.look.yaw;
        pitch = this.look.pitch;
        roll = -this.look.yaw * 0.16;
        gazeX = this.look.x;
        gazeY = this.look.y;
        if (t > this.nextHop) {
          this.hop(tm.hop * (0.9 + rand() * 0.4), rand() < 0.35 ? (rand() < 0.5 ? 1 : -1) : 0);
          this.nextHop = t + 7 + rand() * 7;
        }
        break;
      case 'thinking': {
        if (t > this.nextSide) {
          this.side = -this.side;
          this.nextSide = t + 3 + rand() * 2;
        }
        const s = this.side;
        yaw = 0.24 * s + Math.sin(t * 0.9) * 0.05;
        pitch = 0.17 + Math.sin(t * 1.3) * 0.03;
        roll = -0.13 * s;
        gazeX = 0.7 * s;
        gazeY = 0.8;
        freq = 0.9;
        break;
      }
      case 'listening':
        yaw = -0.14;
        pitch = 0.02;
        roll = 0.17;
        gazeX = -0.2;
        if (t > this.nextNod) {
          this.pitch.v -= 0.9;
          this.nextNod = t + 2 + rand() * 2.5;
        }
        break;
      case 'speaking': {
        yaw = Math.sin(t * 0.7) * 0.12;
        roll = Math.sin(t * 0.9) * 0.05;
        this.speech.update(dt);
        talk = this.speech.open;
        round = this.speech.round;
        /* the head rides the stresses */
        pitch = 0.04 + talk * 0.07;
        bob += talk * 0.014;
        flap += Math.sin(t * 2.6) * 0.1;
        freq = 1.8;
        break;
      }
      case 'sleeping':
        pitch = -0.3;
        roll = 0.13;
        yaw = 0.06;
        bob = Math.sin(t * 1.15) * 0.016;
        talk = 0.12 + 0.1 * Math.sin(t * 1.15);
        round = 0.7;
        hover *= 0.65;
        freq = 0.55;
        damping = 0.9;
        if (t > this.nextNod) {
          this.pitch.v -= 0.5;
          this.nextNod = t + 5 + rand() * 4;
        }
        break;
      case 'happy':
        yaw = Math.sin(t * 2.2) * 0.18;
        roll = Math.sin(t * 4.4) * 0.12;
        pitch = 0.12;
        talk = 0.5 + 0.15 * Math.sin(t * 8);
        round = 0.2;
        if (t > this.nextHop) {
          this.hop(tm.hop * 1.05, 0);
          this.nextHop = t + 1.05 + rand() * 0.4;
        }
        break;
    }

    if (follows && p) {
      yaw = clamp(p.x, -1, 1) * 0.55;
      pitch = clamp(-p.y, -1, 1) * 0.32 + (shown === 'speaking' ? talk * 0.07 : 0);
      roll = -yaw * 0.12 + (shown === 'listening' ? 0.12 : 0);
      gazeX = clamp(p.x * 2, -1, 1);
      gazeY = clamp(-p.y * 1.5, -1, 1);
    }
    if (shown !== 'sleeping') {
      gazeX += this.saccade.x;
      gazeY += this.saccade.y;
    }
    if (tm.float > 0) bob += Math.sin(t * 1.5) * 0.035;

    const lookFreq = mix(freq, freq * 3.2, tm.snapLook) * tm.snap;
    const lookDamping = mix(damping, 0.95, tm.snapLook);
    this.yaw.step(yaw * tm.look, dt, lookFreq, lookDamping);
    this.pitch.step(pitch * tm.look, dt, lookFreq, lookDamping);
    this.roll.step(roll, dt, freq * tm.snap, damping);
    this.hover.step(hover, dt, 0.6, 0.8);

    const fs = this.face;
    fs.lid.step(target.lid, dt, 2.2, 0.9);
    fs.squint.step(target.squint, dt, 3, 0.8);
    fs.smile.step(target.smile, dt, 2.4, 0.75);
    fs.tilt.step(target.tilt * this.side, dt, 1.6, 0.8);
    fs.talk.step(talk, dt, 14, 0.8);
    fs.round.step(round, dt, 6, 0.8);
    fs.gazeX.step(gazeX, dt, 7, 0.85);
    fs.gazeY.step(gazeY, dt, 7, 0.85);
    fs.flap.step(flap, dt, 2.4 * tm.snap, 0.5);
    fs.energy.step(target.energy, dt, 0.8, 1);
    fs.exposure.step(target.exposure, dt, 0.4, 1);
    for (const e of EXPRESSIONS) this.weights[e].step(e === shown ? 1 : 0, dt, 1.6 * tm.snap, 0.95);

    const g = 1 - Math.exp(-dt * 4);
    const pulse = shown === 'thinking' ? 0.55 + 0.45 * Math.sin(t * 4.2) : shown === 'speaking' ? 0.6 + 0.6 * fs.talk.x : 1;
    for (let k = 0; k < 3; k++) this.glow[k] = mix(this.glow[k], target.glow[k] * pulse, g);

    /* a syllable is the mouth opening past a threshold, once per opening */
    if (this.syllableArmed && fs.talk.x > 0.55 && this.lastTalk <= 0.55 && shown === 'speaking') {
      events.push('syllable');
      this.syllableArmed = false;
    }
    if (fs.talk.x < 0.35) this.syllableArmed = true;
    this.lastTalk = fs.talk.x;

    /* the hop */
    let lift = 0, spin = 0, lean = 0, squash = 0;
    const j = this.jump;
    if (j) {
      j.age += dt;
      if (j.age < CROUCH) {
        squash = 0.14;
      } else {
        const ap = (j.age - CROUCH) / j.air;
        if (ap < 1) {
          if (ap < 0.06 && this.squash.x > 0.05) this.squash.v = -2.6;
          lift = 4 * j.height * ap * (1 - ap);
          spin = j.spin * Math.PI * 2 * easeInOut(clamp(ap * 1.08, 0, 1));
          lean = j.lean * Math.sin(ap * Math.PI);
          squash = ap < 0.5 ? -0.05 : 0;
        } else if (!j.landed) {
          j.landed = true;
          if (tm.float === 0) {
            this.squash.v += 3.2;
            events.push('land');
          }
        } else if (j.age - CROUCH - j.air > 0.35) {
          this.jump = null;
        }
      }
    }
    if (tm.float > 0) squash *= 0.3;
    this.squash.step(squash, dt, 3.2, 0.32);

    /* blinks, sometimes doubled */
    if (t > this.nextBlink) {
      this.blinkAge = 0;
      this.nextBlink = t + 2.2 + rand() * 3.5;
      if (rand() < 0.2) this.nextBlink = t + 0.35;
    }
    let blink = 0;
    if (this.blinkAge >= 0) {
      this.blinkAge += dt;
      blink = Math.sin(clamp(this.blinkAge / 0.17, 0, 1) * Math.PI);
      if (this.blinkAge > 0.17) this.blinkAge = -1;
    }

    const sleeping = shown === 'sleeping';
    const breathe = Math.sin(t * (sleeping ? 1.15 : 2.1)) * (sleeping ? 0.024 : 0.01);
    const sq = this.squash.x * tm.squash + fs.talk.x * 0.05 * tm.talkSquash;
    const sx = 1 + sq * 0.55 - breathe * 0.5;
    const sy = 1 - sq + breathe;
    const totalLift = lift + bob + this.hover.x;

    const { a, b } = this.matrices;
    const root = this.pose.root;
    fromTranslation(root, 0, totalLift, 0);
    multiply(root, root, fromEuler(a, 0, spin, lean));
    multiply(root, root, fromScale(b, sx, sy, sx));

    const pose = this.pose;
    pose.minScale = Math.min(sx, sy);
    pose.lift = totalLift;
    pose.expression = shown;
    const ch = pose.channels;
    ch.yaw = this.yaw.x;
    ch.pitch = this.pitch.x;
    ch.roll = this.roll.x;
    ch.flap = fs.flap.x;
    ch.talk = fs.talk.x;
    ch.energy = fs.energy.x;
    let total = 0;
    for (const e of EXPRESSIONS) total += Math.max(0, this.weights[e].x);
    for (const e of EXPRESSIONS) pose.weights[e] = Math.max(0, this.weights[e].x) / (total || 1);
    pose.faceA = [sleeping ? 0 : blink, fs.lid.x, fs.squint.x, fs.smile.x];
    pose.faceB = [fs.talk.x, fs.gazeX.x, fs.gazeY.x, fs.tilt.x];
    pose.faceC = [EXPRESSION_ID[this.shown], EXPRESSION_ID[this.previous], clamp(this.switched / 0.35, 0, 1), this.switched < 0.3 ? 1 - this.switched / 0.3 : 0];
    pose.faceD = [this.since, fs.round.x, 0, 0];
    pose.exposure = fs.exposure.x;
  }
}

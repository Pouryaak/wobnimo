/* Speech without audio: syllables grouped into words and words into
   phrases, the way a voice actually moves a mouth. Each syllable opens to
   its own height with its own vowel and closes again on the consonant, so
   the lips meet between syllables instead of hovering half open, and the
   mouth rests shut between phrases. */

import { clamp } from '../math/scalar';

interface Vowel {
  /** 0 a wide mouth, 1 a round one. */
  round: number;
  /** How far this vowel opens, relative to the syllable's stress. */
  open: number;
  /** How often it comes up. */
  weight: number;
}

const VOWELS: Vowel[] = [
  { round: 0, open: 1, weight: 0.34 }, // "ah"
  { round: 0.08, open: 0.55, weight: 0.26 }, // "ee", wide and shallow
  { round: 0.7, open: 0.85, weight: 0.24 }, // "oh"
  { round: 1, open: 0.5, weight: 0.16 }, // "oo"
];

export class Speech {
  /** How open the mouth is, 0–1. */
  open = 0;
  /** The current vowel's roundness, 0–1. */
  round = 0;

  private age = 0;
  private length = 0;
  private stress = 0;
  private silence = 0;
  private syllablesLeft = 0;
  private wordsLeft = 0;

  constructor(private readonly random: () => number) {
    this.silence = 0.15 + random() * 0.3;
  }

  /** Starts over from silence, so speech always begins with the mouth closed. */
  reset() {
    this.age = this.length = this.open = 0;
    this.syllablesLeft = this.wordsLeft = 0;
    this.silence = 0.12;
  }

  update(dt: number) {
    if (this.silence > 0) {
      this.silence -= dt;
      this.open = 0;
      return;
    }
    this.age += dt;
    if (this.age >= this.length) this.next();
    /* a quick open, a held vowel, a quick close */
    const k = clamp(this.age / this.length, 0, 1);
    this.open = this.stress * Math.pow(Math.sin(Math.PI * k), 0.55);
  }

  private next() {
    const r = this.random;
    this.age = 0;
    const wordStart = this.syllablesLeft === 0;
    if (wordStart) {
      if (this.wordsLeft === 0) {
        /* a breath between phrases */
        this.wordsLeft = 3 + Math.floor(r() * 5);
        this.silence = this.length > 0 ? 0.45 + r() * 0.7 : 0;
      } else {
        this.silence = 0.04 + r() * 0.09;
      }
      this.wordsLeft--;
      this.syllablesLeft = 1 + Math.floor(Math.pow(r(), 1.6) * 3);
    }
    this.syllablesLeft--;
    /* most words lean on their first syllable */
    const stressed = wordStart && r() < 0.6;
    const vowel = pick(VOWELS, r());
    this.length = 0.12 + r() * 0.13;
    this.stress = vowel.open * (stressed ? 0.85 + r() * 0.15 : 0.5 + r() * 0.35);
    this.round = vowel.round;
  }
}

function pick(vowels: Vowel[], x: number): Vowel {
  for (const v of vowels) {
    if (x < v.weight) return v;
    x -= v.weight;
  }
  return vowels[0];
}

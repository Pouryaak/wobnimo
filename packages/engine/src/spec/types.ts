/* The character spec: everything that makes one mascot different from
   another, as plain JSON-serialisable data. Nothing in here is code — a
   spec can be written by hand, generated, or authored by an agent, and
   the compiler turns it into a shader and a rig.

   Units: one unit ≈ the height of a small mascot. The floor is y = 0,
   +y is up, +z faces the camera. Angles are radians. */

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
/** A colour as `#rrggbb`, in sRGB. */
export type Hex = string;

/** The channels the behaviour layer drives every frame. Bones map them onto rotations. */
export type Channel = 'yaw' | 'pitch' | 'roll' | 'flap' | 'talk';

export type Axis = 'rx' | 'ry' | 'rz';

export interface CharacterSpec {
  id: string;
  name: string;
  /** One line on what makes this body plan different, for humans and agents. */
  tagline: string;
  /** The UI accent that goes with the character. */
  accent: Hex;
  /** How the camera frames the character: the height it looks at and the radius it must fit. */
  frame: { target: number; radius: number };
  /** The volume every ray is clipped to, as a sphere above the root: centre height and radius. */
  bound: { y: number; radius: number };
  motion?: Partial<Temperament>;
  materials: Record<string, MaterialSpec>;
  bones: BoneSpec[];
  parts: PartSpec[];
  paints?: PaintSpec[];
  eyes?: EyesSpec;
  face?: FaceSpec;
  /** Named points on the body that effects come from: `top`, `mouth`, `ear`, `feet`, or your own. */
  anchors?: Record<string, AnchorSpec>;
  /** How each state moves each bone, on top of the rig. This is where a character acts. */
  acting?: Partial<Record<Expression, Record<string, Partial<Record<Axis, Motion>>>>>;
  /** Effects around the character, added to (or, with `replace`, instead of) the shared defaults. */
  fx?: FxSpec;
  /** The state's light spills onto the floor in a soft pool. */
  glowPool?: number;
}

/** Every state a character can be in, plus the short happy reaction to a poke. */
export type Expression =
  | 'idle'
  | 'thinking'
  | 'listening'
  | 'speaking'
  | 'sleeping'
  | 'working'
  | 'error'
  | 'surprised'
  | 'celebrating'
  | 'sad'
  | 'happy';

/**
 * A rotation over time: `base + amp · sin(2π · hz · t + phase)`, plus `spin`
 * radians per second accumulated for as long as the state lasts.
 * A bare number is a held angle.
 */
export type Motion = number | [base: number, amp?: number, hz?: number, phase?: number, spin?: number];

export interface AnchorSpec {
  bone: string;
  at: Vec3;
}

/** The shapes an effect particle can take. */
export type Glyph =
  | 'z' | 'bubble' | 'sparkle' | 'heart' | 'note' | 'arc' | 'puff' | 'ring' | 'drop' | 'spark' | 'mote' | 'feather' | 'dot'
  | 'exclaim' | 'warning' | 'confetti' | 'cloud' | 'star' | 'gear';

/** When an emitter fires: continuously in a state, always, or on a beat of the animation. */
export type FxTrigger = Expression | 'ambient' | 'land' | 'syllable' | `enter:${Expression}`;

export interface EmitterSpec {
  glyph: Glyph;
  anchor: string;
  /** Particles per second while active, or how many at once for an event. */
  rate: number;
  /** Where particles start, relative to the anchor, and how far apart. */
  offset?: Vec3;
  spread?: number;
  /** Starting velocity, units per second, with random variation. */
  velocity: Vec3;
  jitter?: number;
  /** Mirror half the particles across x (sound from both sides of a mouth). */
  mirror?: boolean;
  gravity?: number;
  drag?: number;
  /** Side-to-side drift, like a bubble or a falling feather. */
  wobble?: number;
  life: [number, number];
  /** Size at birth and at death. */
  size: [number, number];
  /** Starting angle and spin, radians and radians per second. */
  rotation?: number;
  spin?: number;
  /** Point along the direction of travel: sparks streak, drops trail their tips. */
  align?: boolean;
  color: Hex;
  /** Adds light instead of covering what is behind it. */
  glow?: boolean;
}

export type FxSpec = Partial<Record<FxTrigger, EmitterSpec[]>> & { replace?: FxTrigger[] };

/** How a character moves, independent of what it looks like. */
export interface Temperament {
  /** Resting height above the floor; above zero the character floats. */
  float: number;
  /** How high a hop goes. */
  hop: number;
  /** Multiplies squash and stretch. */
  squash: number;
  /** Multiplies every spring's frequency: higher is snappier. */
  snap: number;
  /** How far the head turns toward things. */
  look: number;
  /** How the head moves between glances: 0 eases like a person, 1 snaps and holds like a bird. */
  snapLook: number;
  /** How much the body squashes on each syllable. */
  talkSquash: number;
}

export interface MaterialSpec {
  color: Hex;
  /** Clear-coat reflectance face on; it rises to 1 at grazing angles. */
  f0?: number;
  /** Strength and tightness of the key light's highlight. */
  spec?: number;
  shininess?: number;
  /** How much of the reflection takes the albedo's colour (0 plastic, 1 metal). */
  metal?: number;
  /** The cool back light rimming the silhouette. */
  rim?: number;
  /** How sharp reflections are, 0 (satin) to 1 (wet glass). */
  gloss?: number;
  /** Velvet sheen at grazing angles, for feathers and fuzz. */
  sheen?: number;
  /** Light scattered under the surface, for jelly, wax and ghosts. */
  sss?: number;
  sssColor?: Hex;
  /** Light the material gives off on its own. */
  emit?: Hex;
  emitStrength?: number;
  /** Takes its light from the state's glow colour: antenna bulbs, chest lamps. */
  glows?: boolean;
  /** Fine detail on top of the shape: fur, scales, freckles, a wet ripple. */
  surface?: SurfaceSpec;
}

/**
 * Procedural surface detail, fixed to a bone so it moves with the body.
 * `fur`: fine fibres and soft clumps. `scales`: a pebbled hide with darker
 * seams. `speckle`: scattered spots. `ripple`: a gentle unevenness that
 * makes a glossy coat read as wet.
 */
export interface SurfaceSpec {
  kind: 'fur' | 'scales' | 'speckle' | 'ripple';
  /** Features per unit; a mascot is about one unit tall. */
  scale: number;
  /** 0–1. */
  strength?: number;
  /** Seams for scales, spots for speckle. */
  color?: Hex;
  /** The bone the pattern is fixed to. Default the root. */
  bone?: string;
}

export interface BoneSpec {
  name: string;
  /** Defaults to the root, which the behaviour layer moves (hops, floats, squash). */
  parent?: string;
  /** Where the bone pivots, in its parent's space. */
  pivot: Vec3;
  /** Rotation at rest, applied before everything else. */
  rest?: Partial<Record<Axis, number>>;
  /** Channels added to the rotation: `{ ry: [['yaw', 0.8]] }`. */
  drive?: Partial<Record<Axis, Array<[Channel, number]>>>;
  /** Idle oscillation, scaled by the state's energy: amplitude, Hz, phase. */
  wave?: Partial<Record<Axis, [number, number, number]>>;
  /** Secondary motion: the bone's tip is a mass on a spring that lags behind its parent. */
  jiggle?: JiggleSpec;
}

export interface JiggleSpec {
  /** The direction the bone points at rest, in its own space. */
  axis: Vec3;
  length: number;
  /** Spring frequency in Hz and damping ratio. */
  freq: number;
  damping: number;
  /** The furthest the bone may swing from rest. */
  maxAngle?: number;
}

export type Op =
  | { op?: 'add'; blend?: number }
  | { op: 'sub'; blend?: number };

interface PartBase {
  bone: string;
  material: string;
  /** Offset and rotation inside the bone's space. */
  at?: Vec3;
  rot?: Vec3;
  /**
   * Keeps only the side of a plane that `normal` points away from, in the
   * part's own space: `{ normal: [0, -1, 0] }` keeps the top half. Halves a
   * beak, flattens a base.
   */
  clip?: { normal: Vec3; offset?: number };
}

export type PartSpec = PartBase &
  Op &
  (
    | { shape: 'sphere'; radius: number }
    | { shape: 'ellipsoid'; radii: Vec3 }
    | { shape: 'roundBox'; half: Vec3; round: number }
    | { shape: 'capsule'; from: Vec3; to: Vec3; radius: number }
    | { shape: 'roundCone'; from: Vec3; to: Vec3; r1: number; r2: number }
    | { shape: 'cylinder'; radius: number; half: number; round: number }
    | { shape: 'frame'; half: Vec2; corner: number; width: number; depth: number }
    /** A rounded rectangle extruded along z: screens, panels, plates. */
    | { shape: 'plate'; half: Vec2; corner: number; depth: number }
    /** Cuts everything so far off below a wavy line: a ghost's hem. */
    | { shape: 'hem'; y: number; amplitude: number; waves: number; speed: number; blend: number }
  );

/** Colour painted onto a surface in a bone's space: bellies, blush, spots. */
export interface PaintSpec {
  bone: string;
  on: string[];
  color: Hex;
  /** Softness of the edge, as a share of the size. */
  soft?: number;
  opacity?: number;
  /** `sphere`: everything within `radius` of `at`. `ellipse`: projected along +z. */
  kind: 'sphere' | 'ellipse';
  at: Vec3;
  radius?: number;
  radii?: Vec2;
}

export type EyesSpec =
  | {
      kind: 'ball';
      bone: string;
      at: [Vec3, Vec3];
      radius: number;
      iris: Hex;
      /** Angular size of the iris and pupil, as the sine of their half-angle. */
      irisSize: number;
      pupilSize: number;
      /** Pupil width over height; above 1 for a goat or an octopus. */
      pupilAspect?: number;
      /** What the lids are made of, usually the skin. */
      lid: string;
    }
  | {
      kind: 'bead';
      bone: string;
      at: [Vec3, Vec3];
      radii: Vec3;
      material: string;
    };

export type FaceSpec =
  | {
      /** An LED matrix on a flat screen, facing +z. */
      kind: 'screen';
      bone: string;
      material: string;
      center: Vec2;
      half: Vec2;
      corner: number;
      /** The pitch of the LED grid. */
      cell: number;
      color: Hex;
    }
  | {
      /** A painted mouth that smiles and talks. */
      kind: 'mouth';
      bone: string;
      on: string[];
      at: Vec3;
      width: number;
      color: Hex;
      tongue: Hex;
    };

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
}

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

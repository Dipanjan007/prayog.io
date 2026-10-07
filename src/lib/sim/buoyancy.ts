/**
 * Floating, sinking and repulsion physics for the Class 8 "Exploring Forces" float-or-sink lab.
 * Pure functions in SI units (kg, m, N), so they can be unit tested.
 */

/** Acceleration due to gravity near the Earth's surface, m/s². */
export const G = 9.8;
/** Permeability of free space, T·m/A. */
export const MU0 = 4 * Math.PI * 1e-7;
/** Coulomb constant, N·m²/C². */
export const K_E = 8.99e9;

/* ---------- Liquids and objects ---------- */

export type LiquidId = "water" | "salt" | "oil";

/** Densities in kg/m³: tap water, water with a lot of salt stirred in, and cooking oil. */
export const LIQUIDS: Record<LiquidId, { label: string; density: number; color: string }> = {
  water: { label: "Water", density: 1000, color: "#38bdf8" },
  salt: { label: "Salt water", density: 1150, color: "#5eead4" },
  oil: { label: "Cooking oil", density: 920, color: "#facc15" },
};

export type ObjectId = "stone" | "iron" | "wood" | "ice" | "bottle" | "apple" | "egg" | "bowl" | "steelball";

export interface FloatObject {
  id: ObjectId;
  label: string;
  emoji: string;
  /** kg */
  mass: number;
  /**
   * The most liquid it can push aside, m³. For a solid this is its own volume. For the steel bowl
   * it is the volume up to the rim, air included, as long as no water spills in.
   */
  volume: number;
  /** "sphere": a ball of this volume. "box": straight sides, so the volume under grows evenly with depth. */
  shape: "sphere" | "box";
  /** Box height in m (spheres use their diameter). */
  height?: number;
  /** Box width in m, for drawing. */
  width?: number;
  color: string;
}

const fromDensity = (mass: number, density: number) => mass / density;

/**
 * Typical values. Stone 2500 kg/m³, iron 7870, steel 7850, mango wood about 600, ice 917,
 * a fresh egg about 1080, an apple about 850 (it has air pockets).
 * The steel bowl and the steel ball have the same mass.
 */
export const OBJECTS: FloatObject[] = [
  { id: "stone", label: "Stone", emoji: "🪨", mass: 0.5, volume: fromDensity(0.5, 2500), shape: "sphere", color: "#94a3b8" },
  { id: "iron", label: "Iron ball", emoji: "⚫", mass: 0.5, volume: fromDensity(0.5, 7870), shape: "sphere", color: "#475569" },
  { id: "wood", label: "Wooden block", emoji: "🪵", mass: 0.3, volume: fromDensity(0.3, 600), shape: "box", height: 0.05, width: 0.1, color: "#b45309" },
  { id: "ice", label: "Ice", emoji: "🧊", mass: 0.2, volume: fromDensity(0.2, 917), shape: "box", height: 0.06, width: 0.06, color: "#bae6fd" },
  { id: "bottle", label: "Plastic bottle", emoji: "🧴", mass: 0.05, volume: 5e-4, shape: "box", height: 0.16, width: 0.063, color: "#7dd3fc" },
  { id: "apple", label: "Apple", emoji: "🍎", mass: 0.18, volume: fromDensity(0.18, 850), shape: "sphere", color: "#ef4444" },
  { id: "egg", label: "Egg", emoji: "🥚", mass: 0.06, volume: fromDensity(0.06, 1080), shape: "sphere", color: "#fde7c7" },
  { id: "bowl", label: "Steel bowl", emoji: "🥣", mass: 0.4, volume: 6e-4, shape: "box", height: 0.06, width: 0.14, color: "#cbd5e1" },
  { id: "steelball", label: "Steel ball", emoji: "🔘", mass: 0.4, volume: fromDensity(0.4, 7850), shape: "sphere", color: "#e2e8f0" },
];

export function getObject(id: ObjectId) {
  return OBJECTS.find((o) => o.id === id)!;
}

/** Weight in newtons: W = m × g. */
export function weight(mass: number, g = G) {
  return mass * g;
}

/** Mass per unit volume, kg/m³ (for the bowl, the average over its whole shape). */
export function density(o: FloatObject) {
  return o.mass / o.volume;
}

export function sphereRadius(volume: number) {
  return Math.cbrt((3 * volume) / (4 * Math.PI));
}

/** Height of the object, m. */
export function objectHeight(o: FloatObject) {
  return o.shape === "sphere" ? 2 * sphereRadius(o.volume) : o.height!;
}

/** Volume under the surface when the bottom of the object is `depth` metres below it. */
export function submergedVolume(o: FloatObject, depth: number) {
  const H = objectHeight(o);
  const d = Math.max(0, Math.min(depth, H));
  if (o.shape === "box") return o.volume * (d / H);
  const r = H / 2;
  // A spherical cap of height d.
  return (Math.PI * d * d * (3 * r - d)) / 3;
}

/** Upthrust (buoyant force) = weight of the liquid pushed aside = ρ V g. */
export function upthrust(liquidDensity: number, vSub: number, g = G) {
  return liquidDensity * vSub * g;
}

/** It floats when its (average) density is less than the liquid's. */
export function floats(o: FloatObject, liquidDensity: number) {
  return density(o) < liquidDensity;
}

/**
 * How deep a floating object settles: the depth where upthrust equals weight.
 * Returns null if it sinks (even fully under, the upthrust is less than its weight).
 */
export function floatDepth(o: FloatObject, liquidDensity: number) {
  if (!floats(o, liquidDensity)) return null;
  let lo = 0;
  let hi = objectHeight(o);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (liquidDensity * submergedVolume(o, mid) < o.mass) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export interface TankState {
  /** Depth of the object's bottom below the surface, m. */
  depth: number;
  vSub: number;
  upthrust: number;
  weight: number;
  /** What the spring balance reads, N (zero once the object is floating or let go). */
  reading: number;
  fullyUnder: boolean;
  /** Held up by the liquid alone: the string is slack. */
  floating: boolean;
  /** Let go and resting on the bottom of the tank. */
  onBottom: boolean;
}

/**
 * The object hangs from a spring balance whose hook is lowered so that, if the string were tight,
 * the object's bottom would be `hookDepth` below the surface. A string can pull but not push, so a
 * floating object stops at its float depth and the string goes slack. `released`: the string is
 * cut, so the object floats or falls to the bottom of a tank `tankDepth` deep.
 */
export function tankState(o: FloatObject, liquidDensity: number, hookDepth: number, released: boolean, tankDepth = 0.22): TankState {
  const H = objectHeight(o);
  const fd = floatDepth(o, liquidDensity);
  let depth: number;
  let onBottom = false;
  if (released) {
    if (fd !== null) depth = fd;
    else {
      depth = tankDepth;
      onBottom = true;
    }
  } else depth = fd !== null ? Math.min(hookDepth, fd) : hookDepth;
  const vSub = submergedVolume(o, depth);
  const B = upthrust(liquidDensity, vSub);
  const W = weight(o.mass);
  const floating = fd !== null && depth >= fd - 1e-9;
  const reading = released || floating ? 0 : Math.max(0, W - B);
  return { depth, vSub, upthrust: B, weight: W, reading, fullyUnder: depth >= H - 1e-9, floating, onBottom };
}

/**
 * The tank starts full to the spout, so every bit of liquid pushed aside runs into the beaker.
 * Lifting the object out again lowers the level in the tank but cannot take water back out of the beaker,
 * so the beaker holds the most volume ever pushed aside since it was emptied.
 */
export function overflowAfter(previousOverflow: number, vSub: number) {
  return Math.max(previousOverflow, vSub);
}

/* ---------- Ring magnets on a pencil ---------- */

/**
 * A ferrite ring magnet about 2.5 cm across and 5 mm thick. Magnetised through its thickness,
 * so one flat face is N and the other is S. The moment is a typical value for this size.
 */
export const RING = { mass: 0.01, thickness: 0.005, moment: 0.3 };

/**
 * Force between two magnets on the same axis, centres d apart, treated as point dipoles:
 * F = 3 μ0 m² / (2π d⁴). It falls off very fast with distance.
 */
export function ringForce(d: number, moment = RING.moment) {
  return (3 * MU0 * moment * moment) / (2 * Math.PI * d ** 4);
}

/**
 * Two rings repel when like poles face each other, which happens when they point opposite ways.
 * `up` is true when the ring's N face is on top.
 */
export function ringsRepel(upA: boolean, upB: boolean) {
  return upA !== upB;
}

/** Centre-to-centre distance at which a repelling ring floats above another: ringForce(d) = its weight. */
export function floatSpacing(weightAbove = weight(RING.mass), moment = RING.moment) {
  return Math.pow((3 * MU0 * moment * moment) / (2 * Math.PI * weightAbove), 1 / 4);
}

/**
 * Settle a stack of rings on a vertical pencil. The bottom ring rests on the base. Returns the
 * height of each ring's centre above the base, m. Solved by small steps downhill in energy,
 * keeping rings from passing through each other.
 */
export function ringStack(ups: boolean[], ring = RING) {
  const n = ups.length;
  const t = ring.thickness;
  const W = weight(ring.mass);
  const z = ups.map((_, i) => t / 2 + i * t);
  let maxStep = 0.002;
  for (let iter = 0; iter < 6000; iter++) {
    for (let i = 1; i < n; i++) {
      let F = -W;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const d = Math.max(Math.abs(z[i] - z[j]), t);
        const f = ringForce(d, ring.moment) * (ringsRepel(ups[i], ups[j]) ? 1 : -1);
        F += z[i] > z[j] ? f : -f;
      }
      const step = Math.max(-maxStep, Math.min(maxStep, F * 0.0005));
      z[i] += step;
    }
    for (let i = 1; i < n; i++) z[i] = Math.max(z[i], z[i - 1] + t);
    maxStep = Math.max(1e-7, maxStep * 0.998);
  }
  return z;
}

/** Gaps of air between neighbouring rings, m. */
export function ringGaps(z: number[], ring = RING) {
  return z.slice(1).map((zi, i) => Math.max(0, zi - z[i] - ring.thickness));
}

/* ---------- Two rubbed balloons ---------- */

/** Two air-filled balloons on threads from the same hook. Mass is the rubber only. */
export const BALLOON = { mass: 0.003, radius: 0.1, thread: 0.5 };

/** Charge picked up per rub on dry hair, C. A rough estimate: 10 rubs give about half a microcoulomb. */
export const CHARGE_PER_RUB = 5e-8;

/** Coulomb's law: F = k q₁ q₂ / r². */
export function coulomb(q1: number, q2: number, r: number) {
  return (K_E * q1 * q2) / (r * r);
}

/**
 * Angle of each thread from the vertical, radians, for two balloons with equal charge q.
 * Each balloon is in balance: tan θ = F / (m g), where the centres are r = 2 L sin θ apart
 * (L = thread + radius). The balloons cannot overlap, so θ never goes below the touching angle.
 */
export function balloonAngle(q: number, b = BALLOON) {
  const L = b.thread + b.radius;
  const touching = Math.asin(b.radius / L);
  const W = weight(b.mass);
  const f = (th: number) => Math.tan(th) * W - coulomb(q, q, 2 * L * Math.sin(th));
  if (q === 0 || f(touching) >= 0) return touching;
  let lo = touching;
  let hi = Math.PI / 2 - 1e-6;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Distance between the balloon centres, m. */
export function balloonSeparation(theta: number, b = BALLOON) {
  return 2 * (b.thread + b.radius) * Math.sin(theta);
}

/* ---------- Cargo boats ---------- */

export interface Boat {
  id: string;
  name: string;
  place: string;
  /** Density of the water it sails on, kg/m³. */
  water: number;
  waterLabel: string;
  /** Volume of the hull up to the deck edge, m³: the most water it can push aside. */
  hull: number;
  /** Empty boat, kg. */
  mass: number;
  /** Cargo slider step and display unit. */
  step: number;
  unit: "kg" | "t";
  cargo: string;
  length: number;
}

export const BOATS: Boat[] = [
  {
    id: "ganga",
    name: "Country boat",
    place: "on the Ganga at Varanasi",
    water: 1000,
    waterLabel: "river water, 1000 kg/m³",
    hull: 1.8,
    mass: 400,
    step: 50,
    unit: "kg",
    cargo: "50 kg sacks of wheat",
    length: 7,
  },
  {
    id: "kerala",
    name: "Kettuvallam houseboat",
    place: "in the Kerala backwaters",
    water: 1000,
    waterLabel: "lake water, 1000 kg/m³",
    hull: 40,
    mass: 18000,
    step: 1000,
    unit: "t",
    cargo: "1 tonne loads of rice",
    length: 20,
  },
  {
    id: "ship",
    name: "Cargo ship",
    place: "at sea off Kochi",
    water: 1025,
    waterLabel: "sea water, 1025 kg/m³",
    hull: 12000,
    mass: 3_000_000,
    step: 100_000,
    unit: "t",
    cargo: "100 tonne stacks of containers",
    length: 110,
  },
];

/** The most cargo before the deck edge goes under: ρ V − boat mass. */
export function maxLoad(b: Boat) {
  return b.water * b.hull - b.mass;
}

/** Fraction of the hull below the waterline (above 1 means water pours over the edge and it sinks). */
export function boatDraft(b: Boat, load: number) {
  return (b.mass + load) / (b.water * b.hull);
}

export function boatSinks(b: Boat, load: number) {
  return load > maxLoad(b) + 1e-6;
}

/** A star: floating, loaded to at least 90% of the most it can carry. */
export const GOOD_LOAD = 0.9;
export function loadIsGood(b: Boat, load: number) {
  return !boatSinks(b, load) && load >= GOOD_LOAD * maxLoad(b) - 1e-6;
}

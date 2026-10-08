/**
 * Acoustics for the Class 9 "Sound Waves: Characteristics and Applications" second lab:
 * sound needs a medium (bell jar), reverberation in halls (Sabine), ultrasound flaw
 * detection, and the hearing ranges of people and animals.
 * Pure functions, so they can be unit tested.
 */
import { echoDelay } from "./sound";

// ---------- Air and the bell jar ----------

/** Normal air pressure at sea level (Pa). */
export const P_ATM = 101325;
/** Universal gas constant (J/(mol K)). */
export const R_GAS = 8.314;
/** Molar mass of dry air (kg/mol). */
export const M_AIR = 0.02897;
/** Ratio of specific heats for air. */
export const GAMMA_AIR = 1.4;
/** Room temperature, 20 °C, in kelvin. */
export const T_ROOM = 293.15;

/** Density of air from the ideal gas law: ρ = pM / (RT). About 1.2 kg/m³ in a room. */
export function airDensity(pressurePa: number, T = T_ROOM) {
  return (pressurePa * M_AIR) / (R_GAS * T);
}

/** Speed of sound in an ideal gas: v = √(γRT/M). It depends on temperature, not on pressure. */
export function speedOfSoundGas(T = T_ROOM, gamma = GAMMA_AIR, M = M_AIR) {
  return Math.sqrt((gamma * R_GAS * T) / M);
}

/** Acoustic impedance Z = ρv (Pa s/m). Thin air has a low impedance, so it carries little sound energy. */
export function impedance(density: number, v: number) {
  return density * v;
}

/** Fraction of sound energy passing straight from a medium of impedance z1 into one of impedance z2. */
export function energyTransmission(z1: number, z2: number) {
  return (4 * z1 * z2) / (z1 + z2) ** 2;
}

/** The bell jar: volume of the jar and of one stroke of the hand pump (litres). */
export const JAR_L = 5;
export const PUMP_L = 1;

/**
 * Air left after n strokes of the pump, as a fraction of normal pressure.
 * Each stroke lets the jar's air spread into the pump cylinder and then throws that part out
 * (Boyle's law at constant temperature), so p falls by V / (V + v) each time.
 */
export function pressureAfterStrokes(n: number, jarL = JAR_L, pumpL = PUMP_L) {
  return Math.pow(jarL / (jarL + pumpL), Math.max(0, n));
}

/** How loud the ringing bell sounds outside the jar when it is full of air (dB). */
export const BELL_DB = 70;
/** A faint sound still leaks out through the bell's wires and the base plate (dB). */
export const LEAK_DB = 5;
/** Below this the bell counts as silent: near the faintest sound a person can hear (0 dB). */
export const SILENT_DB = 12;

/**
 * Loudness heard outside the jar (dB) when the air is at a fraction p of normal pressure.
 * The bell hands its vibration to the air, and the air hands it to the glass. Each hand-over
 * passes energy in proportion to the air's impedance ρv, and ρ is proportional to p (v is not),
 * so the sound through the air falls as p²: 20 dB less for every tenfold drop in pressure.
 * The small leak through the supports is added on top.
 */
export function bellLevelDb(p: number) {
  const viaAir = p > 0 ? Math.pow(10, BELL_DB / 10) * p * p : 0;
  return 10 * Math.log10(viaAir + Math.pow(10, LEAK_DB / 10));
}

export function bellIsSilent(p: number) {
  return bellLevelDb(p) < SILENT_DB;
}

// ---------- Reverberation (Sabine) ----------

/**
 * Sabine's constant (s/m): 24 ln 10 / v for sound at 343 m/s, about 0.161.
 * The time for a sound to fall by 60 dB (to a millionth of its energy) is T = 0.161 V / A.
 */
export const SABINE_K = 0.161;

/** Reverberation time (s) of a room of volume V (m³) with total absorption A (m², "sabins"). */
export function rt60(V: number, A: number) {
  return (SABINE_K * V) / A;
}

/** Absorption needed to reach a reverberation time T in a room of volume V. */
export function absorptionFor(V: number, T: number) {
  return (SABINE_K * V) / T;
}

/** How far the sound has died away t seconds after a clap (dB, negative). */
export function decayDb(t: number, T: number) {
  return (-60 * t) / T;
}

/** Pressure amplitude after t seconds as a fraction of the start: 60 dB down is a thousandth. */
export function decayAmplitude(t: number, T: number) {
  return Math.pow(10, decayDb(t, T) / 20);
}

/** Absorption coefficients at about 500 Hz (fraction of sound energy soaked up on each bounce). */
export const ALPHA = {
  granite: 0.01,
  concrete: 0.02,
  plaster: 0.03,
  carpet: 0.3,
  curtain: 0.5,
  panel: 0.8,
} as const;

/** One curtain hanging covers 10 m² of wall; one acoustic panel covers 2 m². */
export const CURTAIN_M2 = 10;
export const PANEL_M2 = 2;

/** Absorption per seat (m²): empty or with a person in it, hard wooden or cushioned. */
export const SEAT = {
  hard: { empty: 0.02, full: 0.42 },
  cushioned: { empty: 0.3, full: 0.45 },
} as const;
/** A person without a seat (sitting on the floor or standing) absorbs about this much (m²). */
export const PERSON_M2 = 0.42;

export interface HallSpec {
  name: string;
  /** Length, width and height (m). */
  L: number;
  W: number;
  H: number;
  floor: number;
  walls: number;
  ceiling: number;
  seats: number;
}

export interface HallSetup {
  carpet: boolean;
  /** Number of 10 m² curtain hangings. */
  curtains: number;
  /** Number of 2 m² acoustic panels. */
  panels: number;
  people: number;
  cushioned: boolean;
}

export function hallVolume(h: HallSpec) {
  return h.L * h.W * h.H;
}

export function hallAreas(h: HallSpec) {
  return { floor: h.L * h.W, ceiling: h.L * h.W, walls: 2 * (h.L + h.W) * h.H };
}

/** Total absorption A (m²) of a hall with its treatments. Curtains and panels cover bare wall. */
export function hallAbsorption(h: HallSpec, s: HallSetup) {
  const a = hallAreas(h);
  const curtainArea = Math.min(a.walls, s.curtains * CURTAIN_M2);
  const panelArea = Math.min(a.walls - curtainArea, s.panels * PANEL_M2);
  const bareWall = a.walls - curtainArea - panelArea;
  const seat = s.cushioned ? SEAT.cushioned : SEAT.hard;
  const seated = Math.min(s.people, h.seats);
  const others = Math.max(0, s.people - h.seats);
  return (
    a.floor * (s.carpet ? Math.max(h.floor, ALPHA.carpet) : h.floor) +
    a.ceiling * h.ceiling +
    bareWall * h.walls +
    curtainArea * ALPHA.curtain +
    panelArea * ALPHA.panel +
    seated * seat.full +
    (h.seats - seated) * seat.empty +
    others * PERSON_M2
  );
}

export function hallRT(h: HallSpec, s: HallSetup) {
  return rt60(hallVolume(h), hallAbsorption(h, s));
}

/** Good reverberation for speech in a school hall (s). */
export const SPEECH_RT = { min: 1, max: 1.5 };

/** The school auditorium in the free lab: bare concrete floor and plastered walls, 200 wooden seats. */
export const AUDITORIUM: HallSpec = { name: "School auditorium", L: 20, W: 12, H: 6, floor: ALPHA.concrete, walls: ALPHA.plaster, ceiling: ALPHA.plaster, seats: 200 };
export const AUDITORIUM_START: HallSetup = { carpet: false, curtains: 0, panels: 0, people: 0, cushioned: false };
export const LIMITS = { curtains: 12, panels: 40 };

export interface ChallengeHall {
  id: string;
  spec: HallSpec;
  /** What is already there and cannot be changed. */
  fixed: { people: number; cushioned: boolean; carpet: boolean };
  /** Most panels you may buy. Curtains up to LIMITS.curtains, and carpet, are free to choose. */
  budget: number;
  target: number;
  tolerance: number;
  why: string;
}

export const CHALLENGE_HALLS: ChallengeHall[] = [
  {
    id: "classroom",
    spec: { name: "Classroom", L: 9, W: 7, H: 3.5, floor: ALPHA.concrete, walls: ALPHA.plaster, ceiling: ALPHA.plaster, seats: 40 },
    fixed: { people: 40, cushioned: false, carpet: false },
    budget: 20,
    target: 0.6,
    tolerance: 0.08,
    why: "A classroom needs a short time, about 0.6 s, so every word of the teacher is clear.",
  },
  {
    id: "mandapam",
    spec: { name: "Temple mandapam", L: 24, W: 16, H: 8, floor: ALPHA.granite, walls: ALPHA.concrete, ceiling: ALPHA.concrete, seats: 0 },
    fixed: { people: 150, cushioned: false, carpet: false },
    budget: 30,
    target: 2,
    tolerance: 0.2,
    why: "Bhajans and music sound rich with a longer time, about 2 s, but 7 s turns them into a blur.",
  },
  {
    id: "cinema",
    spec: { name: "Cinema", L: 20, W: 14, H: 6, floor: ALPHA.carpet, walls: ALPHA.plaster, ceiling: ALPHA.plaster, seats: 200 },
    fixed: { people: 120, cushioned: true, carpet: true },
    budget: 40,
    target: 0.9,
    tolerance: 0.08,
    why: "A cinema wants a fairly dead room, about 0.9 s, so the speakers alone shape the sound.",
  },
];

export function rtOk(T: number, target: number, tolerance: number) {
  return Number.isFinite(T) && Math.abs(T - target) <= tolerance + 1e-9;
}

// ---------- Ultrasound flaw detection ----------

/** Speed of sound in steel (m/s), the same value the first sound lab uses. */
export const STEEL_V = 5960;

export interface SteelBlock {
  /** Length along the top (m) and thickness (m). */
  length: number;
  thickness: number;
  /** Hidden crack: from x0 to x1 along the top (m), at this depth below the top (m). */
  crack: { x0: number; x1: number; depth: number };
}

/** Depth of the first surface the pulse bounces off, under a probe at x. */
export function reflectorDepth(b: SteelBlock, x: number) {
  return x >= b.crack.x0 && x <= b.crack.x1 ? b.crack.depth : b.thickness;
}

/** Echo time (s) for a probe at x: the pulse goes down to the reflector and back. */
export function scanEchoTime(b: SteelBlock, x: number, v = STEEL_V) {
  return echoDelay(reflectorDepth(b, x), v);
}

/** Depth worked out from an echo time: d = v t / 2. */
export function depthFromEcho(t: number, v = STEEL_V) {
  return (v * t) / 2;
}

// ---------- Hearing ranges ----------

export type AnimalId = "human" | "elephant" | "dog" | "bat" | "dolphin";

/** Approximate hearing ranges (Hz). Real values vary between individuals and species. */
export const HEARING: { id: AnimalId; label: string; emoji: string; min: number; max: number }[] = [
  { id: "elephant", label: "Elephant", emoji: "🐘", min: 16, max: 12000 },
  { id: "human", label: "Human", emoji: "🧒", min: 20, max: 20000 },
  { id: "dog", label: "Dog", emoji: "🐕", min: 67, max: 45000 },
  { id: "dolphin", label: "Dolphin", emoji: "🐬", min: 75, max: 150000 },
  { id: "bat", label: "Bat", emoji: "🦇", min: 2000, max: 110000 },
];

export function hearers(f: number): AnimalId[] {
  return HEARING.filter((a) => f >= a.min && f <= a.max).map((a) => a.id);
}

/** True when only this animal, of all those listed, can hear frequency f. */
export function onlyHears(f: number, id: AnimalId) {
  const h = hearers(f);
  return h.length === 1 && h[0] === id;
}

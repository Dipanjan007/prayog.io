/**
 * Physics for the "Lemon batteries and nervous compasses" lab (Class 8).
 *
 * Part 1: the magnetic effect of a current. A compass needle lines up with the total
 * horizontal magnetic field: Earth's field (pointing north) plus the field of a
 * current-carrying wire or coil.
 *
 * Part 2: fruit cells. Two different metals in a juicy fruit make a cell. Each cell has an
 * open-circuit voltage (EMF) set mainly by the pair of metals and a large internal
 * resistance (the juice conducts poorly), so the current is tiny.
 *
 * Coordinates for the compass table: x points east, y points north, in metres.
 * Angles of a needle are measured from north, positive towards east, in degrees.
 */

/** Permeability of free space, T·m/A. */
export const MU0 = 4 * Math.PI * 1e-7;

/** Horizontal part of Earth's magnetic field over most of India, about 35 µT (it varies from about 30 to 40 µT). */
export const EARTH_BH = 35e-6;

/** Current in the compass circuit: one 1.5 V cell, a switch and a short thick wire. Typical value; it drains the cell, so switch off soon. */
export const COMPASS_CURRENT = 1.5;

/** The straight wire runs north-south, held this high (m) above the compasses, like NCERT's activity. */
export const WIRE_HEIGHT = 0.01;

/** The coil lies on the table with its axis east-west. */
export const COIL = { turns: 50, radius: 0.012, length: 0.06 };

export type Vec = { x: number; y: number };

/**
 * Horizontal field (T) at a compass at east offset x (m) from a north-south wire held h (m) above it.
 * Current flowing north (I > 0) makes the field under the wire point west, so the compass
 * turns west: B = μ0 I h / (2π (h² + x²)), the horizontal part of μ0 I / (2π r).
 */
export function wireField(current: number, x: number, h = WIRE_HEIGHT): Vec {
  return { x: (-MU0 * current * h) / (2 * Math.PI * (h * h + x * x)), y: 0 };
}

/** Field (T) right under a long straight wire: μ0 I / (2π r). */
export function fieldNearWire(current: number, r: number) {
  return (MU0 * current) / (2 * Math.PI * r);
}

/** Field (T) inside a long coil: μ0 N I / L. */
export function coilInsideField(turns: number, current: number, length: number) {
  return (MU0 * turns * current) / length;
}

/**
 * Field (T) of a short coil (solenoid) centred at the origin with its axis along x.
 * Outside, it acts like a bar magnet: two "poles" of strength q = N I A / L at its ends.
 * With current > 0 the north end is on the east (+x) side; a negative current swaps the poles.
 * Inside, the field runs along the axis from the south end to the north end.
 */
export function coilField(p: Vec, current: number, coil = COIL): Vec {
  const half = coil.length / 2;
  if (Math.abs(p.x) < half && Math.abs(p.y) < coil.radius) {
    return { x: coilInsideField(coil.turns, current, coil.length), y: 0 };
  }
  const q = (coil.turns * current * Math.PI * coil.radius * coil.radius) / coil.length;
  const k = (MU0 / (4 * Math.PI)) * q;
  const pole = (cx: number, sign: number): Vec => {
    const dx = p.x - cx;
    const dy = p.y;
    const r2 = Math.max(dx * dx + dy * dy, 1e-6);
    const r3 = r2 * Math.sqrt(r2);
    return { x: (sign * k * dx) / r3, y: (sign * k * dy) / r3 };
  };
  const n = pole(half, 1);
  const s = pole(-half, -1);
  return { x: n.x + s.x, y: n.y + s.y };
}

/** Which end of the coil is its north pole, for a given current direction. */
export function coilNorthEnd(current: number): "east" | "west" | null {
  if (current === 0) return null;
  return current > 0 ? "east" : "west";
}

/** Direction a compass needle's north end points (degrees from north, + towards east). */
export function needleAngle(b: Vec) {
  return (Math.atan2(b.x, b.y) * 180) / Math.PI;
}

/** Total field at a compass: Earth's field plus the field of the circuit. */
export function totalField(extra: Vec, earth = EARTH_BH): Vec {
  return { x: extra.x, y: extra.y + earth };
}

/** How far the needle turns from north (degrees, + east) when this extra field is added to Earth's. */
export function deflection(extra: Vec, earth = EARTH_BH) {
  return needleAngle(totalField(extra, earth));
}

// ---------------------------------------------------------------- fruit cells

export type FruitId = "lemon" | "orange" | "tomato" | "potato";
export type PairId = "zn-cu" | "fe-cu" | "cu-cu";
export type LoadId = "none" | "led" | "clock" | "calc";
export type Gadget = Exclude<LoadId, "none">;

/**
 * Typical open-circuit voltage (V) of one zinc-copper cell in each fruit, and its internal
 * resistance (Ω). Measured school values vary from fruit to fruit: lemons give about 0.9 V
 * and a short-circuit current of around 1 mA, potatoes a little less voltage and less current.
 */
export const FRUITS: Record<FruitId, { label: string; emf: number; r: number }> = {
  lemon: { label: "Lemon", emf: 0.92, r: 1000 },
  orange: { label: "Orange", emf: 0.9, r: 1500 },
  tomato: { label: "Tomato", emf: 0.86, r: 2000 },
  potato: { label: "Potato", emf: 0.84, r: 3000 },
};

/**
 * Electrode pairs. The voltage depends on how far apart the two metals are in the
 * reactivity series: zinc-copper gives the most, iron-copper about half as much, and two
 * strips of the same metal give nothing. `factor` scales the fruit's zinc-copper voltage.
 * The negative strip is the more reactive metal (zinc or iron); copper is positive.
 */
export const PAIRS: Record<PairId, { label: string; neg: string; pos: string; factor: number }> = {
  "zn-cu": { label: "Zinc + copper", neg: "zinc", pos: "copper", factor: 1 },
  "fe-cu": { label: "Iron + copper", neg: "iron", pos: "copper", factor: 0.54 },
  "cu-cu": { label: "Copper + copper", neg: "copper", pos: "copper", factor: 0 },
};

export const MAX_CELLS = 5;

/** One fruit cell: its EMF (V) and internal resistance (Ω). */
export function fruitCell(fruit: FruitId, pair: PairId) {
  return { emf: FRUITS[fruit].emf * PAIRS[pair].factor, r: FRUITS[fruit].r };
}

/** n identical cells in series: V = n × V₁ and the internal resistances add too. */
export function series(n: number, cell: { emf: number; r: number }) {
  return { emf: n * cell.emf, r: n * cell.r };
}

/** A red LED: it starts to conduct at about 1.8 V, and only one way round. */
export const LED = { vf: 1.8, rd: 100, glowAmps: 1e-4, fullAmps: 2e-3 };

/** Small gadgets as simple loads: the voltage they need and how much they draw (as a resistance). */
export const GADGETS: Record<"clock" | "calc", { label: string; needV: number; load: number }> = {
  clock: { label: "Wall clock", needV: 1.5, load: 20000 },
  calc: { label: "Calculator", needV: 3, load: 300000 },
};

export interface CircuitResult {
  /** Voltmeter reading across the fruit battery (V). */
  volts: number;
  /** Current through the load (A). */
  current: number;
  /** For the LED: is it glowing? For a gadget: does it work? */
  works: boolean;
  /** LED brightness 0..1. */
  glow: number;
}

/**
 * Solve the fruit battery with its load. The voltmeter is ideal, so it draws no current.
 * LED: no current until the battery pushes past 1.8 V, and none at all if it is flipped.
 */
export function solveCircuit(battery: { emf: number; r: number }, load: LoadId, ledFlipped = false): CircuitResult {
  if (load === "none") return { volts: battery.emf, current: 0, works: false, glow: 0 };
  if (load === "led") {
    const i = ledFlipped ? 0 : Math.max(0, (battery.emf - LED.vf) / (battery.r + LED.rd));
    const works = i >= LED.glowAmps;
    const glow = works ? Math.min(1, Math.sqrt(i / LED.fullAmps)) : 0;
    return { volts: battery.emf - i * battery.r, current: i, works, glow };
  }
  const g = GADGETS[load];
  const i = battery.emf / (battery.r + g.load);
  const v = i * g.load;
  return { volts: v, current: i, works: v >= g.needV, glow: 0 };
}

/** Does this load work with n cells of this fruit and metal pair? */
export function loadWorks(load: LoadId, n: number, fruit: FruitId, pair: PairId) {
  return solveCircuit(series(n, fruitCell(fruit, pair)), load).works;
}

/** The fewest fruit cells (any fruit, any metals) that run this load, or null if none can. */
export function fewestCells(load: LoadId): number | null {
  for (let n = 1; n <= MAX_CELLS; n++) {
    for (const f of Object.keys(FRUITS) as FruitId[]) {
      for (const p of Object.keys(PAIRS) as PairId[]) if (loadWorks(load, n, f, p)) return n;
    }
  }
  return null;
}

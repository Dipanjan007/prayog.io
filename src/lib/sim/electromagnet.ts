/**
 * Electromagnet crane and heating-effect physics for the Class 8 Curiosity lesson
 * "Electricity: Magnetic and Heating Effects". Pure functions, so they can be unit tested.
 *
 * Simplifications a teacher may question (also stated in the lesson's simNote):
 * - The crane's holding strength is taken as proportional to (turns × current). For a real
 *   electromagnet the pull grows faster than that at first and then levels off when the iron
 *   is saturated. A straight-line rule keeps "more turns, more current, more lift" clear.
 * - The iron core multiplies the strength by a fixed 30 here. A real soft-iron core can
 *   multiply the field by hundreds, but air gaps to the load cut that down a lot.
 * - A wire's steady temperature uses one fixed heat-loss coefficient. Real wires lose heat
 *   faster when very hot (radiation), and nichrome's resistance changes a little with heat.
 */

/** One dry cell: 1.5 V with a small internal resistance (ohm). */
export const CELL = { volts: 1.5, r: 0.4 };
/** Connecting wires and the switch together (ohm). */
export const LEADS_R = 0.3;
export const CELLS = { min: 1, max: 6 };
export const TURNS = { min: 10, max: 100, step: 10 };

/** Thin enamelled copper wire wound on the crane: resistance per turn (ohm). 100 turns ≈ 3 Ω. */
export const COIL_R_PER_TURN = 0.03;
/** How much the soft-iron core multiplies the magnet's strength in this sim. */
export const CORE_FACTOR = 30;
/** Grams the crane can hold per ampere-turn, with the iron core in. */
export const GRAMS_PER_AMP_TURN = 2.6;

export type LoadId = "scrap" | "clips";
export type ItemKind = "iron" | "clip" | "aluminium" | "plastic";

/** Mass in grams and whether a magnet attracts it. Only iron (and steel) is magnetic here. */
export const ITEMS: Record<ItemKind, { label: string; grams: number; magnetic: boolean }> = {
  iron: { label: "Iron scrap", grams: 50, magnetic: true },
  clip: { label: "Paper clip", grams: 1, magnetic: true },
  aluminium: { label: "Aluminium can", grams: 15, magnetic: false },
  plastic: { label: "Plastic bottle", grams: 25, magnetic: false },
};

/** What sits in the yard for each load choice. */
export const PILES: Record<LoadId, { kind: ItemKind; count: number }[]> = {
  scrap: [
    { kind: "iron", count: 10 },
    { kind: "aluminium", count: 2 },
    { kind: "plastic", count: 1 },
  ],
  clips: [{ kind: "clip", count: 25 }],
};

/** Current (A) from n cells in series through a load of resistance R (ohm). */
export function seriesCurrent(cells: number, loadR: number) {
  return (cells * CELL.volts) / (cells * CELL.r + LEADS_R + loadR);
}

/** The crane's electromagnet: current, ampere-turns and how many grams it can hold. */
export function electromagnet(cells: number, turns: number, core: boolean, on: boolean) {
  const coilR = turns * COIL_R_PER_TURN;
  const current = on ? seriesCurrent(cells, coilR) : 0;
  const ampTurns = turns * current;
  const holdGrams = GRAMS_PER_AMP_TURN * ampTurns * (core ? 1 : 1 / CORE_FACTOR);
  return { coilR, current, ampTurns, holdGrams };
}

/** How many items of this kind the magnet can hold, out of `available`. Non-magnetic items: always 0. */
export function canLift(kind: ItemKind, holdGrams: number, available: number) {
  const it = ITEMS[kind];
  if (!it.magnetic) return 0;
  return Math.max(0, Math.min(available, Math.floor(holdGrams / it.grams + 1e-9)));
}

// ---------------------------------------------------------------- heating

export type WireId = "nichrome" | "copper";

/** Test wire: 10 cm long, 0.3 mm across. Resistivity in ohm metre. */
export const WIRE_LEN = 0.1;
export const WIRE_DIAM = 0.3e-3;
export const WIRES: Record<WireId, { label: string; resistivity: number }> = {
  nichrome: { label: "Nichrome", resistivity: 1.1e-6 },
  copper: { label: "Copper", resistivity: 1.7e-8 },
};
/** Fuse wire in series (ohm), and the ratings on offer (A). */
export const FUSE_R = 0.05;
export const FUSE_RATINGS = [1, 2, 3] as const;
/** Combined heat loss from the wire surface to the air (W per m² per °C). */
export const HEAT_LOSS = 80;
export const ROOM_C = 25;
/** Below about 525 °C a hot wire gives no visible glow (Draper point). */
export const GLOW_C = 525;

export function wireResistance(wire: WireId) {
  const area = (Math.PI * WIRE_DIAM * WIRE_DIAM) / 4;
  return (WIRES[wire].resistivity * WIRE_LEN) / area;
}

/** Steady state of the heating circuit with the switch on and the fuse whole. */
export function heating(wire: WireId, cells: number) {
  const R = wireResistance(wire);
  const current = seriesCurrent(cells, R + FUSE_R);
  const power = current * current * R; // heat made in the test wire each second (W)
  const surface = Math.PI * WIRE_DIAM * WIRE_LEN;
  const tempC = ROOM_C + power / (HEAT_LOSS * surface);
  return { R, current, power, tempC };
}

/** Does a fuse of this rating melt at this current? (Simplified: any current above the rating.) */
export const fuseMelts = (current: number, rating: number) => current > rating;

/** Glow colour name and canvas colour for a wire temperature in °C. */
export function glowOf(tempC: number): { name: string; color: string | null } {
  if (tempC < 60) return { name: "cool", color: null };
  if (tempC < GLOW_C) return { name: "hot, no glow yet", color: null };
  if (tempC < 700) return { name: "dull red glow", color: "#b91c1c" };
  if (tempC < 900) return { name: "cherry red glow", color: "#ef4444" };
  if (tempC < 1100) return { name: "orange glow", color: "#fb923c" };
  return { name: "yellow-white glow", color: "#fde68a" };
}

// ---------------------------------------------------------------- crane state

export const magneticKind = (load: LoadId): ItemKind => (load === "scrap" ? "iron" : "clip");
export const pileCount = (load: LoadId) => PILES[load].find((p) => ITEMS[p.kind].magnetic)!.count;

export interface CraneState {
  cells: number;
  turns: number;
  core: boolean;
  on: boolean;
  load: LoadId;
  pos: "pile" | "truck";
  /** Magnetic items still in the pile, on the magnet and in the truck. */
  pile: number;
  held: number;
  truck: number;
  /** How many times items have fallen off the magnet. */
  drops: number;
}

export function newCrane(load: LoadId = "scrap"): CraneState {
  return { cells: 2, turns: 50, core: true, on: false, load, pos: "pile", pile: pileCount(load), held: 0, truck: 0, drops: 0 };
}

/**
 * Apply a change of settings or position. Over the pile the magnet grabs as many items as it can hold;
 * anything it can no longer hold falls where it is: back to the pile, or into the truck.
 */
export function craneUpdate(s: CraneState, patch: Partial<Omit<CraneState, "pile" | "held" | "truck" | "drops">>): CraneState {
  let n: CraneState = { ...s, ...patch };
  if (patch.load && patch.load !== s.load) n = { ...n, pile: pileCount(n.load), held: 0, truck: 0 };
  const kind = magneticKind(n.load);
  const { holdGrams } = electromagnet(n.cells, n.turns, n.core, n.on);
  if (n.pos === "pile") {
    const total = n.pile + n.held;
    const held = canLift(kind, holdGrams, total);
    return { ...n, held, pile: total - held, drops: n.drops + (held < n.held ? 1 : 0) };
  }
  const held = canLift(kind, holdGrams, n.held);
  return { ...n, held, truck: n.truck + n.held - held, drops: n.drops + (held < n.held ? 1 : 0) };
}

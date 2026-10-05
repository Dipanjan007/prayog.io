/**
 * A single-loop (series) circuit with a few slots. Good enough for Class 7:
 * open/closed circuits, switches, conductors and insulators, adding cells,
 * and bulbs that fuse when given too much voltage.
 */

export type MaterialId =
  | "iron-nail"
  | "copper-wire"
  | "aluminium-foil"
  | "pencil-lead"
  | "coin"
  | "eraser"
  | "plastic-scale"
  | "wooden-stick"
  | "rubber-band"
  | "glass-bangle";

export const MATERIALS: Record<MaterialId, { label: string; conducts: boolean; emoji: string }> = {
  "iron-nail": { label: "Iron nail", conducts: true, emoji: "📍" },
  "copper-wire": { label: "Copper wire", conducts: true, emoji: "🧵" },
  "aluminium-foil": { label: "Aluminium foil", conducts: true, emoji: "🥈" },
  "pencil-lead": { label: "Pencil lead (graphite)", conducts: true, emoji: "✏️" },
  coin: { label: "Steel coin", conducts: true, emoji: "🪙" },
  eraser: { label: "Eraser", conducts: false, emoji: "🧽" },
  "plastic-scale": { label: "Plastic scale", conducts: false, emoji: "📏" },
  "wooden-stick": { label: "Wooden stick", conducts: false, emoji: "🪵" },
  "rubber-band": { label: "Rubber band", conducts: false, emoji: "➰" },
  "glass-bangle": { label: "Glass bangle", conducts: false, emoji: "⭕" },
};

export type Part =
  | { kind: "empty" }
  | { kind: "wire" }
  | { kind: "cell" }
  | { kind: "bulb"; fused: boolean }
  | { kind: "switch"; on: boolean }
  | { kind: "material"; id: MaterialId };

export const CELL_VOLTS = 1.5;
/** Torch bulb rating: more than this across one bulb breaks its filament. */
export const BULB_RATED_VOLTS = 3;

export interface CircuitState {
  closed: boolean;
  cells: number;
  bulbs: number;
  /** 0 to 1 for each working bulb in the loop (same for all, in series). */
  brightness: number;
  /** True if current flows with no bulb to limit it. */
  shortCircuit: boolean;
  /** Why the loop is open, in plain words, when it is. */
  reason: string | null;
  /** Indexes of bulbs that would fuse with this much voltage. */
  overloaded: number[];
}

export function solve(slots: Part[]): CircuitState {
  const cells = slots.filter((p) => p.kind === "cell").length;
  const bulbIdx = slots.flatMap((p, i) => (p.kind === "bulb" ? [i] : []));
  const bulbs = bulbIdx.length;

  let reason: string | null = null;
  for (const p of slots) {
    if (p.kind === "empty") reason = "There's a gap in the loop.";
    else if (p.kind === "switch" && !p.on) reason = "The switch is off, so the loop is open.";
    else if (p.kind === "bulb" && p.fused) reason = "A fused bulb's broken filament leaves a gap.";
    else if (p.kind === "material" && !MATERIALS[p.id].conducts) reason = `${MATERIALS[p.id].label} doesn't let current through.`;
    if (reason) break;
  }
  if (!reason && cells === 0) reason = "There's no cell to push the current.";

  const closed = reason === null;
  const volts = cells * CELL_VOLTS;
  const perBulb = bulbs ? volts / bulbs : 0;
  return {
    closed,
    cells,
    bulbs,
    brightness: closed && bulbs ? Math.min(perBulb / BULB_RATED_VOLTS, 1) : 0,
    shortCircuit: closed && bulbs === 0,
    reason,
    overloaded: closed && perBulb > BULB_RATED_VOLTS + 1e-9 ? bulbIdx : [],
  };
}

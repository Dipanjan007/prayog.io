/**
 * Current electricity physics for the Class 10 "Electricity" lesson.
 * Ideal cells (no internal resistance), ideal meters (ammeter has no resistance,
 * voltmeter draws no current) and resistors whose resistance does not change as they warm up.
 * Pure functions, so they can be unit tested.
 */

/** EMF of one dry cell, in volts. */
export const CELL_VOLTS = 1.5;
export const MAX_CELLS = 6;

/** Above this the ammeter goes off scale and we treat the circuit as nearly a short circuit. */
export const MAX_AMPS = 10;

export type MaterialId = "copper" | "nichrome" | "constantan";

/**
 * Resistivity at 20 °C in Ω m.
 * Copper matches NCERT Table 11.2 (1.62 × 10⁻⁸ Ω m). For the alloys the printed NCERT table reads
 * "× 10⁻⁶", but measured values are about 49 × 10⁻⁸ Ω m (constantan) and 100 × 10⁻⁸ Ω m (nichrome),
 * which is what we use here.
 */
export const MATERIALS: Record<MaterialId, { label: string; rho: number; colour: string; note: string }> = {
  copper: { label: "Copper", rho: 1.62e-8, colour: "#e8894a", note: "a very good conductor" },
  nichrome: { label: "Nichrome", rho: 1.0e-6, colour: "#a8b0bc", note: "an alloy used in heaters" },
  constantan: { label: "Constantan", rho: 4.9e-7, colour: "#d9c89a", note: "an alloy used in resistors" },
};

/** Wire lengths (m) and cross-section areas (mm²) offered on the bench. */
export const LENGTH = { min: 0.25, max: 2, step: 0.25 };
export const AREAS_MM2 = [0.05, 0.1, 0.2, 0.4] as const;

/** Resistor values (Ω) offered for the two-resistor board. */
export const RESISTOR_VALUES = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20] as const;

export const batteryVolts = (cells: number) => cells * CELL_VOLTS;

/** R = ρL/A, with L in metres and A in mm². */
export const wireResistance = (rho: number, lengthM: number, areaMm2: number) => (rho * lengthM) / (areaMm2 * 1e-6);

/** ρ = RA/L for a wire of diameter d (m). */
export const resistivityFrom = (r: number, lengthM: number, diameterM: number) => (r * Math.PI * (diameterM / 2) ** 2) / lengthM;

export const series = (...rs: number[]) => rs.reduce((a, b) => a + b, 0);
export const parallel = (...rs: number[]) => 1 / rs.reduce((a, b) => a + 1 / b, 0);

/** Ohm's law, I = V/R. */
export const current = (v: number, r: number) => v / r;

export type Connection = "series" | "parallel";

/** Everything the meters show for two resistors joined to a battery of voltage v. */
export function solvePair(v: number, r1: number, r2: number, how: Connection) {
  if (how === "series") {
    const r = series(r1, r2);
    const i = v / r;
    return { r, i, i1: i, i2: i, v1: i * r1, v2: i * r2 };
  }
  const r = parallel(r1, r2);
  return { r, i: v / r, i1: v / r1, i2: v / r2, v1: v, v2: v };
}

/** Electric power P = VI (equal to I²R and V²/R for a resistor). */
export const power = (v: number, i: number) => v * i;

/** Joule's law of heating, H = I²Rt (joules). */
export const heat = (i: number, r: number, t: number) => i * i * r * t;

export const J_PER_KWH = 3.6e6;
export const toKWh = (joules: number) => joules / J_PER_KWH;

/** True when the measured current is within 1% of the target. */
export const hitsTarget = (i: number, target: number) => Math.abs(i - target) <= 0.01 * target;

/** All ways to make a target current from two resistors and up to MAX_CELLS cells. */
export function solutions(r1: number, r2: number, target: number) {
  const out: { cells: number; how: Connection }[] = [];
  for (let cells = 1; cells <= MAX_CELLS; cells++)
    for (const how of ["series", "parallel"] as const)
      if (hitsTarget(solvePair(batteryVolts(cells), r1, r2, how).i, target)) out.push({ cells, how });
  return out;
}

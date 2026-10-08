/**
 * Olympiad track: electricity (current, resistance, power and heating).
 * Pure functions shared by the OlyCircuit sim and the problem answers, so the two always agree.
 * Every resistance is taken as fixed (a real filament or heating coil changes resistance as it warms up).
 */

export interface Outcome {
  ok: boolean;
  text: string;
}

/* ---------- Basic relations ---------- */

/** Resistance of a device from its rating: R = V² / P. */
export function ratedResistance(volts: number, watts: number) {
  return (volts * volts) / watts;
}

/** Resistance of two resistors in parallel. */
export function parallel(a: number, b: number) {
  return (a * b) / (a + b);
}

/** Resistance of a round wire: R = ρ L / A with A = π d² / 4. */
export function wireResistance(rho: number, length: number, diameter: number) {
  return (rho * length) / ((Math.PI * diameter * diameter) / 4);
}

/* ---------- 1. Series resistor for a bulb ---------- */

/** Series resistor so a bulb rated (ratedV, ratedP) gets exactly its rated current from an ideal source E. */
export function seriesResistorForBulb(E: number, ratedV: number, ratedP: number) {
  const I = ratedP / ratedV;
  return (E - ratedV) / I;
}

export interface BulbScene {
  kind: "electricity-bulb";
  /** Battery EMF (V), taken as ideal. */
  E: number;
  ratedV: number;
  ratedP: number;
  /** The series resistor (Ω). */
  R: number;
  /** Allowed fractional difference from the rated current. */
  window: number;
}

export function bulbCurrent(s: BulbScene) {
  return s.E / (s.R + ratedResistance(s.ratedV, s.ratedP));
}

export function planBulb(s: BulbScene) {
  const Rb = ratedResistance(s.ratedV, s.ratedP);
  const Irated = s.ratedP / s.ratedV;
  const I = s.R > 0 ? s.E / (s.R + Rb) : s.E / Rb;
  const P = I * I * Rb;
  const off = I / Irated - 1;
  const ok = Math.abs(off) <= s.window;
  const pct = Math.round(Math.abs(off) * 100);
  const outcome: Outcome = ok
    ? { ok, text: `The bulb glows at its full rated brightness: ${I.toFixed(3)} A, just as the label says.` }
    : off > 0
      ? { ok, text: `Too bright! ${I.toFixed(3)} A is ${pct}% over the rating. The filament runs too hot and will burn out early.` }
      : { ok, text: `Too dim. Only ${I.toFixed(3)} A flows, ${pct}% under the rating, so the bulb glows a dull orange.` };
  return { duration: 3, I, Irated, P, Rb, outcome };
}

/* ---------- 2. Heating coil and fuse ---------- */

/** Length of round wire (m) for a heater that gives power P on a supply V. */
export function heaterWireLength(V: number, P: number, rho: number, diameter: number) {
  const R = ratedResistance(V, P);
  return (R * Math.PI * diameter * diameter) / 4 / rho;
}

export interface HeaterScene {
  kind: "electricity-heater";
  /** Mains voltage (V, rms). */
  V: number;
  /** Resistivity (Ω m) and wire diameter (m). */
  rho: number;
  d: number;
  /** Wire length (m). */
  L: number;
  /** Power wanted (W) and allowed fractional difference. */
  targetP: number;
  window: number;
  /** Fuse rating (A). */
  fuseA: number;
}

export function planHeater(s: HeaterScene) {
  const R = wireResistance(s.rho, s.L, s.d);
  const I = s.V / R;
  const P = s.V * I;
  const blows = I > s.fuseA;
  const duration = 4;
  const off = P / s.targetP - 1;
  let outcome: Outcome;
  if (blows) outcome = { ok: false, text: `Bang! The coil draws ${I.toFixed(2)} A, more than the ${s.fuseA} A fuse allows. The fuse blows and the kettle goes cold.` };
  else if (Math.abs(off) <= s.window) outcome = { ok: true, text: `The coil gives ${Math.round(P)} W at ${I.toFixed(2)} A. The fuse holds and the water boils right on time.` };
  else if (off < 0) outcome = { ok: false, text: `The fuse holds, but the coil gives only ${Math.round(P)} W. The water is still not boiling when the next train pulls in.` };
  else outcome = { ok: false, text: `The coil gives ${Math.round(P)} W, ${Math.round(off * 100)}% more than the design. It runs too hot for its wire.` };
  return { duration, R, I, P, blows, blowAt: blows ? 1.1 : null, outcome };
}

/* ---------- 3. Battery with internal resistance and a shunt ---------- */

/** EMF and internal resistance from two terminal-voltage readings with known load resistors. */
export function emfAndInternal(R1: number, V1: number, R2: number, V2: number) {
  const I1 = V1 / R1;
  const I2 = V2 / R2;
  const r = (V1 - V2) / (I2 - I1);
  return { E: V1 + I1 * r, r };
}

/**
 * Resistor X across a lamp (RL) so the lamp gets exactly VL. The lamp and X sit in parallel,
 * fed from a source (E, r) through a series resistor Rs.
 */
export function shuntForLampVoltage(E: number, r: number, Rs: number, RL: number, VL: number) {
  const I = (E - VL) / (r + Rs);
  const IX = I - VL / RL;
  return VL / IX;
}

export interface ShuntScene {
  kind: "electricity-shunt";
  E: number;
  r: number;
  /** Series resistor (Ω), lamp resistance (Ω) and the lamp's rated voltage (V). */
  Rs: number;
  RL: number;
  VL: number;
  /** The resistor across the lamp (Ω). */
  X: number;
  /** Allowed fractional difference in the lamp's voltage. */
  window: number;
}

export function shuntCircuit(s: ShuntScene) {
  const Rp = parallel(s.RL, s.X);
  const I = s.E / (s.r + s.Rs + Rp);
  const V = I * Rp;
  return { Rp, I, V, IL: V / s.RL, IX: V / s.X, terminal: s.E - I * s.r };
}

export function planShunt(s: ShuntScene) {
  const c = shuntCircuit(s);
  const off = c.V / s.VL - 1;
  const ok = Math.abs(off) <= s.window;
  const outcome: Outcome = ok
    ? { ok, text: `The lamp gets ${c.V.toFixed(2)} V, its rated voltage. It glows at full brightness and will last for years.` }
    : off > 0
      ? { ok, text: `The lamp gets ${c.V.toFixed(2)} V, more than its ${s.VL} V rating. It glares and will wear out early.` }
      : { ok, text: `The lamp gets only ${c.V.toFixed(2)} V. The resistor across it takes too much current and the lamp glows dim.` };
  return { duration: 3, ...c, outcome };
}

/* ---------- Shared ---------- */

export type CircuitScene = BulbScene | HeaterScene | ShuntScene;

/** True for every scene this sim draws. */
export function isCircuitScene(s: { kind: string }): s is CircuitScene {
  return s.kind.startsWith("electricity-");
}

export function planCircuit(s: CircuitScene): { outcome: Outcome; duration: number } {
  switch (s.kind) {
    case "electricity-bulb":
      return planBulb(s);
    case "electricity-heater":
      return planHeater(s);
    case "electricity-shunt":
      return planShunt(s);
  }
}

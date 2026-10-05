/**
 * Magnetic field physics for the Class 10 "Magnetic Effects of Electric Current" lesson.
 * Pure functions, so they can be unit tested.
 *
 * The field view is a 2D slice. Every wire crosses the page at right angles and is
 * treated as a long straight line current, so the field is exact Biot–Savart for
 * line currents: B = μ0 I / (2π r), going round the wire (right-hand thumb rule).
 * A loop is two such wires (where the loop cuts the page) and a solenoid is two rows.
 * Real circular loops and solenoids give the same pattern in this slice, with
 * slightly different strengths.
 *
 * Axes: x to the right, y up, z out of the page (towards you). Lengths in cm.
 */

export const MU0 = 4 * Math.PI * 1e-7;

/** A current crossing the page. dir +1 means out of the page (⊙), −1 into it (⊗). */
export interface LineCurrent {
  x: number;
  y: number;
  dir: 1 | -1;
}

export type FieldMode = "wire" | "loop" | "solenoid";

export const LOOP_RADIUS_CM = 2;
export const SOLENOID = { turns: 8, lengthCm: 8, radiusCm: 1.5 };

/**
 * The wires for each mode. `reversed` flips every current.
 * Wire: out of the page unless reversed. Loop and solenoid: top row out, bottom row in,
 * so the field inside points to the right and the right end acts as a north pole.
 */
export function sources(mode: FieldMode, reversed: boolean): LineCurrent[] {
  const s: 1 | -1 = reversed ? -1 : 1;
  const neg = (-s) as 1 | -1;
  if (mode === "wire") return [{ x: 0, y: 0, dir: s }];
  if (mode === "loop")
    return [
      { x: 0, y: LOOP_RADIUS_CM, dir: s },
      { x: 0, y: -LOOP_RADIUS_CM, dir: neg },
    ];
  const out: LineCurrent[] = [];
  const { turns, lengthCm, radiusCm } = SOLENOID;
  for (let k = 0; k < turns; k++) {
    const x = -lengthCm / 2 + (lengthCm * (k + 0.5)) / turns;
    out.push({ x, y: radiusCm, dir: s }, { x, y: -radiusCm, dir: neg });
  }
  return out;
}

/** Magnetic field (tesla) at (x, y) cm from currents of `amps` each. Biot–Savart for long straight wires. */
export function fieldAt(src: LineCurrent[], amps: number, x: number, y: number) {
  let bx = 0;
  let by = 0;
  for (const w of src) {
    const rx = (x - w.x) / 100;
    const ry = (y - w.y) / 100;
    const r2 = rx * rx + ry * ry;
    if (r2 === 0) continue;
    // |B| = μ0 I / (2π r), direction ẑ × r̂ for current out of the page.
    const k = (MU0 * amps * w.dir) / (2 * Math.PI * r2);
    bx += -k * ry;
    by += k * rx;
  }
  return { bx, by, b: Math.hypot(bx, by) };
}

/**
 * Vector potential A_z in units of μ0/(2π) × amps (cm, arbitrary zero).
 * Field lines are exactly the contours of A_z, and evenly spaced contours
 * are packed closer where the field is stronger.
 */
export function potentialAt(src: LineCurrent[], amps: number, x: number, y: number, minR = 0.05) {
  let a = 0;
  for (const w of src) {
    const r = Math.max(minR, Math.hypot(x - w.x, y - w.y));
    a -= w.dir * Math.log(r);
  }
  return a * amps;
}

/** Which end of the solenoid acts as a north pole (field lines leave it). */
export function solenoidNorthEnd(reversed: boolean): "left" | "right" {
  return fieldAt(sources("solenoid", reversed), 1, 0, 0).bx > 0 ? "right" : "left";
}

/** F = I L × B for a conductor along z (s = +1 out of the page) in an in-page field (bx, by). Per unit IL. */
export function forceDirection(s: 1 | -1, bx: number, by: number) {
  // ẑ × x̂ = ŷ and ẑ × ŷ = −x̂.
  return { fx: -s * by, fy: s * bx };
}

/** The "force on a conductor" bench: a 5 cm rod of 10 g hanging in a 0.1 T field. */
export const ROD = { fieldT: 0.1, lengthM: 0.05, massKg: 0.01, g: 9.8 };

/**
 * Rod between the poles of a magnet. fieldDown: north pole on top, so the field points down.
 * currentOut: current flows towards you along the rod.
 * Returns the sideways force (N), its direction (+1 right, −1 left, 0 none) and the angle
 * (degrees) the hanging rod settles at, from tan θ = F / mg.
 */
export function rodForce(amps: number, fieldDown: boolean, currentOut: boolean) {
  const s: 1 | -1 = currentOut ? 1 : -1;
  const { fx } = forceDirection(s, 0, fieldDown ? -1 : 1);
  const force = amps * ROD.lengthM * ROD.fieldT; // F = B I L, the rod is at right angles to the field
  const dir = amps === 0 ? 0 : (Math.sign(fx) as 1 | -1);
  const angleDeg = (Math.atan(force / (ROD.massKg * ROD.g)) * 180) / Math.PI;
  return { force, dir, angleDeg: dir * angleDeg };
}

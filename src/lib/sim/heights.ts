/**
 * Heights and distances (NCERT Class 10 Mathematics, "Some Applications of Trigonometry").
 * Pure functions for the Clinometer sim: the angle of elevation of a tower top,
 * the angle of depression from a lighthouse, and working a height back out.
 */

const RAD = Math.PI / 180;

/** The distance slider (m): far enough to see the Qutub Minar top at 30°. */
export const DIST = { min: 5, max: 130, step: 0.5 };

/** Eye height of the student holding the clinometer (m). */
export const EYE = 1.5;

/** Angle of elevation (degrees) of a point `rise` metres above your eye, `d` metres away along the ground. */
export function elevation(rise: number, d: number) {
  return Math.atan2(rise, d) / RAD;
}

/** Angle of elevation of the top of an object of height H seen from distance d by an eye at height eye. */
export function topElevation(H: number, d: number, eye = EYE) {
  return elevation(H - eye, d);
}

/** Height of an object from the distance and the angle of elevation: H = (d × tan θ) + eye. */
export function heightFrom(d: number, thetaDeg: number, eye = EYE) {
  return d * Math.tan(thetaDeg * RAD) + eye;
}

/** Distance to stand from an object of height H so the top is at angle θ: d = (H − eye) ÷ tan θ. */
export function distanceFor(H: number, thetaDeg: number, eye = EYE) {
  return (H - eye) / Math.tan(thetaDeg * RAD);
}

/** Angle of depression (degrees) of a boat d metres from the foot of a lighthouse whose lamp is H metres up. */
export function depression(H: number, d: number) {
  return Math.atan2(H, d) / RAD;
}

/** The exact values of tan from the NCERT table. */
export const TAN: Record<30 | 45 | 60, number> = { 30: 1 / Math.sqrt(3), 45: 1, 60: Math.sqrt(3) };

/** Things to measure. Mystery ones hide their height until the student works it out. */
export interface Tower {
  id: string;
  label: string;
  emoji: string;
  /** Height in metres. */
  H: number;
  mystery?: boolean;
}

export const TOWERS: Tower[] = [
  { id: "tree", label: "Coconut tree", emoji: "🌴", H: 16.5 },
  { id: "flood", label: "Stadium floodlight", emoji: "🏟️", H: 41.5 },
  { id: "minar", label: "Qutub Minar", emoji: "🕌", H: 72.5 },
];

/** Challenge: find the height of three mystery objects to within this many metres. */
export const GUESS_TOL = 1;

export const MYSTERIES: Tower[] = [
  { id: "water", label: "Water tank", emoji: "🛢️", H: 21.5, mystery: true },
  { id: "mobile", label: "Mobile tower", emoji: "📡", H: 36, mystery: true },
  { id: "statue", label: "Giant statue", emoji: "🗿", H: 58, mystery: true },
];

export function closeEnough(guess: number, H: number, tol = GUESS_TOL) {
  return Number.isFinite(guess) && Math.abs(guess - H) <= tol;
}

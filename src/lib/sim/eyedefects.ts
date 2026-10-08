/**
 * Accommodation, near point, presbyopia and bifocal physics for the Class 10
 * "Human Eye and the Colourful World" second lab (eye defects).
 * Pure functions, so they can be unit tested.
 *
 * Model: the "reduced eye" of NCERT. The eye lens sits 2.5 cm in front of the retina,
 * so the image distance v is fixed and only the eye lens's focal length changes.
 * Distances are in metres with the NCERT sign convention: an object in front of a lens
 * has a negative u. Power P = 1/f with f in metres, in dioptres (D).
 * Spectacles are treated as thin lenses touching the eye, so powers simply add.
 */

/** Lens to retina distance of the eye, in metres. */
export const RETINA_M = 0.025;
/** Eye power when fully relaxed for a normal eye: focuses parallel light (far point at infinity) on the retina. */
export const RELAXED_D = 1 / RETINA_M; // 40 D
/** Least distance of distinct vision for a normal young eye (NCERT): 25 cm. */
export const NEAR_POINT_NORMAL_M = 0.25;
/** A short-sighted grandparent in the sim has a far point of 2 m. */
export const MYOPIC_FAR_POINT_M = 2;
/** The image counts as sharp if the focus error is below this many dioptres. */
export const SHARP_TOLERANCE_D = 0.1;

/** Power P = 1/f, with f in metres, gives dioptres. */
export const powerFromFocal = (fM: number) => 1 / fM;
export const focalFromPower = (pD: number) => 1 / pD;

/**
 * Lens formula 1/v − 1/u = 1/f (NCERT sign convention, metres).
 * Returns v for an object at u (u < 0 in front of the lens). v < 0 means a virtual image on the object's side.
 * u = -Infinity means a very far object; returns Infinity when the image is at infinity.
 */
export function lensImage(u: number, powerD: number) {
  const inv = powerD + (Number.isFinite(u) ? 1 / u : 0);
  return inv === 0 ? Infinity : 1 / inv;
}

/**
 * Amplitude of accommodation (in dioptres) at a given age: how much extra power the ciliary
 * muscles can squeeze out of the eye lens. A teaching curve fixed to NCERT's numbers:
 * 4 D (near point 25 cm) up to age 15, falling in a straight line to 1 D (near point 1 m)
 * at 60, and never below 0.5 D.
 */
export function amplitudeAtAge(age: number) {
  if (age <= 15) return 4;
  return Math.max(0.5, 4 - (age - 15) / 15);
}

export interface EyeProfile {
  /** Power with the ciliary muscles relaxed (far point). */
  relaxed: number;
  /** Power with the ciliary muscles squeezed fully (near point). */
  max: number;
}

/** An eye of this age; `myopic` gives it a far point of 2 m as well. */
export function eyeAtAge(age: number, myopic = false): EyeProfile {
  const relaxed = RELAXED_D + (myopic ? 1 / MYOPIC_FAR_POINT_M : 0);
  return { relaxed, max: relaxed + amplitudeAtAge(age) };
}

/** An eye with a given amplitude (dioptres), used for the hidden challenge customers. */
export const eyeWithAmplitude = (amp: number): EyeProfile => ({ relaxed: RELAXED_D, max: RELAXED_D + amp });

/** Total power (eye + glasses) needed to focus an object d metres away on the retina: 1/v − 1/u with v = 2.5 cm, u = −d. */
export const neededPower = (d: number) => RELAXED_D + (Number.isFinite(d) ? 1 / d : 0);

/** Nearest point the naked eye can focus, in metres. */
export const nearPoint = (eye: EyeProfile) => 1 / (eye.max - RELAXED_D);

/** Furthest point the naked eye can focus, in metres (Infinity for a normal eye). */
export function farPoint(eye: EyeProfile) {
  const extra = eye.relaxed - RELAXED_D;
  return extra <= 0 ? Infinity : 1 / extra;
}

/**
 * Convex lens power that lets an eye with this near point read at 25 cm:
 * the lens must turn an object at u = −0.25 m into a virtual image at v = −nearPoint.
 * From 1/v − 1/u = P: P = 1/0.25 − 1/nearPoint.
 */
export const readingGlassesPower = (nearPointM: number) => 1 / NEAR_POINT_NORMAL_M - 1 / nearPointM;

/** Concave lens power that lets a short-sighted eye see far away: f = −(far point). */
export const distanceGlassesPower = (farPointM: number) => -1 / farPointM;

/**
 * How sharply this eye, wearing a lens of `glasses` dioptres, sees an object d metres away.
 * The eye lens accommodates as far as it can; whatever it cannot reach is the focus error.
 */
export function viewThrough(eye: EyeProfile, d: number, glasses: number) {
  const need = neededPower(d);
  const eyePower = Math.min(eye.max, Math.max(eye.relaxed, need - glasses));
  const defocus = eyePower + glasses - need; // > 0: image forms in front of the retina
  const sharp = Math.abs(defocus) < SHARP_TOLERANCE_D;
  const focus: "on" | "front" | "behind" = sharp ? "on" : defocus > 0 ? "front" : "behind";
  // Where the glasses put the image the eye actually looks at (metres in front of the eye).
  const v = glasses === 0 ? -d : lensImage(-d, glasses);
  const imageDistance = v < 0 ? -v : Infinity;
  /** Fraction of the eye's focusing range in use (0 relaxed, 1 squeezed fully). */
  const effort = eye.max > eye.relaxed ? (eyePower - eye.relaxed) / (eye.max - eye.relaxed) : 0;
  return { need, eyePower, defocus, sharp, focus, imageDistance, effort };
}

/** Bifocal lenses: you look through the top half at far things and the bottom half when you look down to read. */
export const bifocalHalf = (d: number): "top" | "bottom" => (Number.isFinite(d) && d < 1 ? "bottom" : "top");

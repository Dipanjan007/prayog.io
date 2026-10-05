/**
 * Sound wave physics for the Class 9 "Sound Waves: Characteristics and Applications" lesson.
 * Pure functions, so they can be unit tested.
 */

export type MediumId = "air" | "water" | "steel";

/** Speed of sound in m/s: air at 20 °C, sea water (about), steel (NCERT table value). */
export const MEDIA: Record<MediumId, { label: string; v: number }> = {
  air: { label: "Air", v: 343 },
  water: { label: "Water", v: 1500 },
  steel: { label: "Steel", v: 5960 },
};

/** Our ear keeps the sensation of a sound for about 0.1 s (persistence of hearing). */
export const PERSISTENCE_S = 0.1;

/** Human audible range in Hz. */
export const AUDIBLE = { min: 20, max: 20000 } as const;

/** v = f λ, so λ = v / f (metres). */
export function wavelength(v: number, f: number) {
  return v / f;
}

/** T = 1 / f (seconds). */
export function period(f: number) {
  return 1 / f;
}

/** Time for a sound to go to a reflector at distance d and come back. */
export function echoDelay(d: number, v: number) {
  return (2 * d) / v;
}

/** Distance to the reflector from the echo time: d = v t / 2. */
export function distanceFromEcho(t: number, v: number) {
  return (v * t) / 2;
}

/** Smallest distance for an echo to be heard apart from the original sound. */
export function minEchoDistance(v: number) {
  return distanceFromEcho(PERSISTENCE_S, v);
}

/** True when the echo arrives at least 0.1 s after the sound, so it is heard separately. */
export function echoIsDistinct(d: number, v: number) {
  return echoDelay(d, v) >= PERSISTENCE_S - 1e-9;
}

export function band(f: number): "infrasound" | "audible" | "ultrasound" {
  if (f < AUDIBLE.min) return "infrasound";
  if (f > AUDIBLE.max) return "ultrasound";
  return "audible";
}

/**
 * A longitudinal wave moving to the right. Each particle with rest position x (m)
 * moves along the direction of travel: s(x, t) = s0 sin(kx − ωt).
 * Pass the phase ωt directly so animations stay smooth when f changes.
 */
export function displacement(x: number, phase: number, s0: number, k: number) {
  return s0 * Math.sin(k * x - phase);
}

/**
 * Excess pressure (above normal air pressure) as a fraction of its peak value.
 * Pressure goes up where particles crowd together: p ∝ −ds/dx = −cos(kx − ωt).
 */
export function excessPressure(x: number, phase: number, k: number) {
  return -Math.cos(k * x - phase);
}

/** Wave number k = 2π / λ. */
export function waveNumber(v: number, f: number) {
  return (2 * Math.PI) / wavelength(v, f);
}

/** Is a depth guess within a fractional tolerance of the true depth? */
export function depthGuessOk(guess: number, depth: number, tolerance: number) {
  return Number.isFinite(guess) && Math.abs(guess - depth) <= tolerance * depth;
}

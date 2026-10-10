/**
 * Proportional reasoning 2 (NCERT Class 8 Ganita Prakash Part 2, "Proportional Reasoning-2").
 * Pure functions for the InverseLab sim: speed and time on a fixed trip, and
 * workers and days on a fixed job. In both, one goes up as the other goes down
 * and their product stays the same (inverse proportion).
 */

/** The free-play trip: about 240 km by road from Delhi to Agra. */
export const TRIP = { from: "Delhi", to: "Agra", km: 240 };

/** The speed slider, km/h. */
export const SPEED = { min: 20, max: 120, step: 10 };

/** The workers slider. */
export const WORKERS = { min: 1, max: 16 };

/** Time for a trip: time = distance ÷ speed (hours). */
export function tripTime(km: number, speed: number) {
  return km / speed;
}

/** x and y in inverse proportion with x1 × y1 = k: the y that goes with x2 is k ÷ x2. */
export function inverseValue(x1: number, y1: number, x2: number) {
  return (x1 * y1) / x2;
}

/** y in direct proportion with x, y1 for x1: the y for x2 is (y1 ÷ x1) × x2. */
export function directValue(x1: number, y1: number, x2: number) {
  return (y1 * x2) / x1;
}

/** "4 h", "4 h 48 min" or "3 h 26 min", to the nearest minute. */
export function hoursText(h: number) {
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return mm ? `${hh} h ${mm} min` : `${hh} h`;
}

/** A job shared out among people: people × days = total person-days. */
export interface Job {
  id: string;
  name: string;
  emoji: string;
  /** Who does it, plural: "workers", "masons", "students". */
  who: string;
  /** People × days, fixed for the job. */
  total: number;
  /** Optional direct-proportion partner: what one person does in a day. */
  perPerson?: { amount: number; unit: string };
}

/** Free play: a brick wall of 1200 bricks; one worker lays 50 bricks a day, so it takes 24 worker-days. */
export const WALL: Job = { id: "wall", name: "Build a brick wall", emoji: "🧱", who: "workers", total: 24, perPerson: { amount: 50, unit: "bricks" } };

/** Days a job takes (or a store lasts) with `people` sharing it. */
export function jobDays(job: Job, people: number) {
  return job.total / people;
}

/** Days shown with up to 2 decimals. */
export function daysText(d: number) {
  return `${Math.round(d * 100) / 100}`;
}

/** Challenge rounds: hit a target time or number of days. */
export type Round =
  | { kind: "trip"; name: string; brief: string; from: string; to: string; km: number; hours: number }
  | { kind: "job"; name: string; brief: string; job: Job; days: number };

/** Does this control setting (speed for a trip, people for a job) meet the round's target exactly? */
export function roundOk(r: Round, value: number) {
  return r.kind === "trip" ? value * r.hours === r.km : r.days * value === r.job.total;
}

/** Every setting the sim's slider allows that meets the round's target. */
export function roundAnswers(r: Round) {
  const out: number[] = [];
  if (r.kind === "trip") {
    for (let s = SPEED.min; s <= SPEED.max; s += SPEED.step) if (roundOk(r, s)) out.push(s);
  } else {
    for (let p = WORKERS.min; p <= WORKERS.max; p++) if (roundOk(r, p)) out.push(p);
  }
  return out;
}

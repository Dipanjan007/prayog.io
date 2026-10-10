/**
 * Data (NCERT Class 9 Ganita Manjari Part 2, "How Quantities Combine: Understanding Data").
 * Pure functions for the DotPlotLab sim: mean, median, mode and range of a small data set, the
 * cricketer's scores and class heights it starts from, and the challenge targets.
 */

export type DataSetId = "cricket" | "heights";

export interface DataSet {
  id: DataSetId;
  label: string;
  /** What one value is, e.g. "Innings"; used on the point buttons. */
  item: string;
  unit: string;
  min: number;
  max: number;
  /** Fewest and most points the student can have. */
  minN: number;
  maxN: number;
  start: number[];
  /** Value given to a newly added point. */
  addValue: number;
}

export const DATASETS: Record<DataSetId, DataSet> = {
  cricket: {
    id: "cricket",
    label: "Cricket scores",
    item: "Innings",
    unit: "runs",
    min: 0,
    max: 150,
    minN: 3,
    maxN: 12,
    // Meera's last 7 innings for her school team.
    start: [12, 25, 31, 8, 40, 25, 18],
    addValue: 30,
  },
  heights: {
    id: "heights",
    label: "Class heights",
    item: "Student",
    unit: "cm",
    min: 120,
    max: 180,
    minN: 3,
    maxN: 12,
    // Heights of 9 students in a Class 9 row.
    start: [148, 152, 145, 160, 150, 155, 142, 158, 149],
    addValue: 150,
  },
};

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Mean: (sum of the values) ÷ (number of values). */
export function mean(xs: number[]) {
  return xs.length ? sum(xs) / xs.length : NaN;
}

export const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b);

/** Median: the middle value once sorted; with an even count, the mean of the two middle values. */
export function median(xs: number[]) {
  if (!xs.length) return NaN;
  const s = sorted(xs);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** The value or values that occur most often. Empty when every value occurs just once (no mode). */
export function modes(xs: number[]) {
  const count = new Map<number, number>();
  for (const x of xs) count.set(x, (count.get(x) ?? 0) + 1);
  const top = Math.max(0, ...count.values());
  if (top < 2) return [];
  return [...count.entries()].filter(([, c]) => c === top).map(([v]) => v).sort((a, b) => a - b);
}

/** How many times the mode occurs (1 when there is no mode). */
export function modeCount(xs: number[]) {
  const count = new Map<number, number>();
  for (const x of xs) count.set(x, (count.get(x) ?? 0) + 1);
  return Math.max(0, ...count.values());
}

/** Range: largest value − smallest value. */
export function range(xs: number[]) {
  return xs.length ? Math.max(...xs) - Math.min(...xs) : NaN;
}

export interface Summary {
  n: number;
  mean: number;
  median: number;
  modes: number[];
  range: number;
}

export function summary(xs: number[]): Summary {
  return { n: xs.length, mean: mean(xs), median: median(xs), modes: modes(xs), range: range(xs) };
}

/** A number for a readout: whole numbers as they are, others to 2 decimal places. */
export function fmt(v: number) {
  if (Number.isNaN(v)) return "–";
  const r = Math.round(v * 100) / 100;
  return Number.isInteger(r) ? `${r}` : r.toFixed(2).replace(/0$/, "");
}

/** Keep a value inside the data set's limits, as a whole number. */
export function clampValue(ds: DataSet, v: number) {
  return Math.min(ds.max, Math.max(ds.min, Math.round(v)));
}

/* ---------- Tasks ---------- */

/** Task "balance": the heights changed but their total (so the mean) did not. */
export function balanced(start: number[], now: number[]) {
  return now.length === start.length && now.some((v, i) => v !== start[i]) && sum(now) === sum(start);
}

/**
 * Task "century": one score of 100 or more, and the mean moved further from its starting value than
 * the median did. Starting data is the cricket set with the same number of innings.
 */
export function outlierPulls(start: number[], now: number[]) {
  if (now.length !== start.length || now.filter((v) => v >= 100).length !== 1) return false;
  return Math.abs(mean(now) - mean(start)) > Math.abs(median(now) - median(start));
}

/* ---------- Challenge: make a data set with a given mean and median ---------- */

export interface DataTarget {
  name: string;
  brief: string;
  set: DataSetId;
  start: number[];
  mean?: number;
  median?: number;
}

/** Exact check of a challenge round. */
export function meetsData(xs: number[], t: DataTarget) {
  if (xs.length !== t.start.length) return false;
  if (t.mean !== undefined && sum(xs) !== t.mean * xs.length) return false;
  if (t.median !== undefined && median(xs) !== t.median) return false;
  return true;
}

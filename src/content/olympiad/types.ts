import type { Scene } from "@/lib/olympiad/scene";
import type { Level } from "@/lib/olympiad/score";

export type SetId = "projectiles" | "newton" | "circular-energy" | "momentum" | "optics" | "electricity" | "fluids" | "heat" | "orbits";

export interface OlySet {
  id: SetId;
  title: string;
  emoji: string;
  blurb: string;
  /** Accent colour for the card dot. */
  colour: string;
  /** Which reusable sim the set mostly uses. */
  sim: string;
}

export interface SolutionStep {
  /** One or two plain sentences. */
  text: string;
  /** The working, in plain text with Unicode symbols. */
  math?: string;
}

export interface OlyProblem {
  /** Unique, URL safe. */
  id: string;
  set: SetId;
  level: Level;
  title: string;
  emoji: string;
  /** The real-world setting, a few short paragraphs. */
  story: string[];
  /** Data given, one line each. */
  given: string[];
  /** The question itself. */
  ask: string;
  /** Exact answer, computed with the same physics functions the sim uses. */
  answer: number;
  /** Symbol shown before the input (like "v =") and the unit shown after it. */
  symbol: string;
  unit: string;
  /** Sensible range for the sim; out-of-range numbers are refused with a message. */
  range: [number, number];
  hints: [string, string];
  solution: SolutionStep[];
  /** Builds the sim scene from a value in the problem's unit. */
  scene: (value: number) => Scene;
  /** What the sim shows and simplifies, for the curious. */
  simNote: string;
}

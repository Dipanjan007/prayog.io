/**
 * One place that knows every Olympiad sim scene. The problem files build a scene from the
 * student's answer, and both the sims and the tests ask `planScene` what happens.
 */
import { planArc, planRiver, type ArcScene, type RiverScene } from "@/lib/sim/oly-projectile";
import { planIncline, type InclineScene } from "@/lib/sim/oly-incline";
import { planBank, planLoop, type BankScene, type LoopScene } from "@/lib/sim/oly-track";
import { isOpticsScene, planOptics, type OpticsScene } from "@/lib/sim/oly-optics";
import { isCircuitScene, planCircuit, type CircuitScene } from "@/lib/sim/oly-electricity";
import { isFluidsScene, planFluids, type FluidsScene } from "@/lib/sim/oly-fluids";
import { isHeatScene, planHeat, type HeatScene } from "@/lib/sim/oly-heat";
import { isOrbitsScene, planOrbits, type OrbitsScene } from "@/lib/sim/oly-orbits";
import { planCrash, planPendulum, planRecoil, type CrashScene, type PendulumScene, type RecoilScene } from "@/lib/sim/oly-momentum";
import { isNumberScene, planNumber, type NumberScene } from "@/lib/sim/oly-number";
import { isCountScene, planCount, type CountScene } from "@/lib/sim/oly-count";
import { isPolygonScene, planPolygon, type PolygonScene } from "@/lib/sim/oly-polygon";
import { isTriangleScene, planTriangle, type TriangleScene } from "@/lib/sim/oly-triangle";
import { isFillScene, planFill, type FillScene } from "@/lib/sim/oly-fill";
import { isEquationScene, planEquation, type EquationScene } from "@/lib/sim/oly-equation";
import { isPatternScene, planPattern, type PatternScene } from "@/lib/sim/oly-pattern";

/** Maths Olympiad scenes. */
export type MathsScene = NumberScene | CountScene | PolygonScene | TriangleScene | FillScene | EquationScene | PatternScene;

export type Scene = ArcScene | RiverScene | InclineScene | BankScene | LoopScene | RecoilScene | PendulumScene | CrashScene | OpticsScene | CircuitScene | FluidsScene | HeatScene | OrbitsScene | MathsScene;

/** Which reusable sim draws a scene. */
export type SimFamily = "projectile" | "incline" | "track" | "collision" | "optics" | "electricity" | "fluids" | "heat" | "orbits" | MathsFamily;

/** Which reusable sim draws a Maths Olympiad scene. */
export type MathsFamily = "number" | "count" | "polygon" | "triangle" | "fill" | "equation" | "pattern";

/** The maths family of a scene, or null for a physics scene. */
export function mathsFamily(s: Scene): MathsFamily | null {
  if (isNumberScene(s)) return "number";
  if (isCountScene(s)) return "count";
  if (isPolygonScene(s)) return "polygon";
  if (isTriangleScene(s)) return "triangle";
  if (isFillScene(s)) return "fill";
  if (isEquationScene(s)) return "equation";
  if (isPatternScene(s)) return "pattern";
  return null;
}

export function simFamily(s: Scene): SimFamily {
  const m = mathsFamily(s);
  if (m) return m;
  if (isOpticsScene(s)) return "optics";
  if (isCircuitScene(s)) return "electricity";
  if (isFluidsScene(s)) return "fluids";
  if (isHeatScene(s)) return "heat";
  if (isOrbitsScene(s)) return "orbits";
  switch (s.kind) {
    case "arc":
    case "river":
      return "projectile";
    case "atwood":
    case "slide":
    case "pulley":
      return "incline";
    case "bank":
    case "loop":
      return "track";
    default:
      return "collision";
  }
}

export interface Outcome {
  ok: boolean;
  text: string;
}

export function planOutcome(s: Scene): { outcome: Outcome; duration: number } {
  if (isNumberScene(s)) return planNumber(s);
  if (isCountScene(s)) return planCount(s);
  if (isPolygonScene(s)) return planPolygon(s);
  if (isTriangleScene(s)) return planTriangle(s);
  if (isFillScene(s)) return planFill(s);
  if (isEquationScene(s)) return planEquation(s);
  if (isPatternScene(s)) return planPattern(s);
  if (isOpticsScene(s)) return planOptics(s);
  if (isCircuitScene(s)) return planCircuit(s);
  if (isFluidsScene(s)) return planFluids(s);
  if (isHeatScene(s)) return planHeat(s);
  if (isOrbitsScene(s)) return planOrbits(s);
  switch (s.kind) {
    case "arc":
      return planArc(s);
    case "river":
      return planRiver(s);
    case "atwood":
    case "slide":
    case "pulley":
      return planIncline(s);
    case "bank":
      return planBank(s);
    case "loop":
      return planLoop(s);
    case "recoil":
      return planRecoil(s);
    case "pendulum":
      return planPendulum(s);
    case "crash":
      return planCrash(s);
  }
}

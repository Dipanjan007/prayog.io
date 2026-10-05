/**
 * One place that knows every Olympiad sim scene. The problem files build a scene from the
 * student's answer, and both the sims and the tests ask `planScene` what happens.
 */
import { planArc, planRiver, type ArcScene, type RiverScene } from "@/lib/sim/oly-projectile";
import { planIncline, type InclineScene } from "@/lib/sim/oly-incline";
import { planBank, planLoop, type BankScene, type LoopScene } from "@/lib/sim/oly-track";
import { planCrash, planPendulum, planRecoil, type CrashScene, type PendulumScene, type RecoilScene } from "@/lib/sim/oly-momentum";

export type Scene = ArcScene | RiverScene | InclineScene | BankScene | LoopScene | RecoilScene | PendulumScene | CrashScene;

/** Which of the four reusable sims draws a scene. */
export type SimFamily = "projectile" | "incline" | "track" | "collision";

export function simFamily(s: Scene): SimFamily {
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

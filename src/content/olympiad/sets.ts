import type { OlySet } from "./types";

export const OLY_SETS: OlySet[] = [
  {
    id: "projectiles",
    title: "Kinematics and projectiles",
    emoji: "🏏",
    blurb: "Ferries that fight the current, sixes over the rope and a throw onto a moving tram.",
    colour: "#739ca8",
    sim: "Projectile and river sim",
  },
  {
    id: "newton",
    title: "Newton's laws",
    emoji: "🏗️",
    blurb: "Pulleys, slopes and friction. Free-body diagrams decide everything here.",
    colour: "#ae8ba6",
    sim: "Incline and pulley sim",
  },
  {
    id: "circular-energy",
    title: "Circular motion and energy",
    emoji: "🎢",
    blurb: "Banked ghat roads, roller coaster loops and a spring launcher.",
    colour: "#c97f8a",
    sim: "Loop track sim",
  },
  {
    id: "momentum",
    title: "Momentum",
    emoji: "💥",
    blurb: "Recoil in space, an air rifle pellet in a block and a crash at a crossing.",
    colour: "#cf7f5c",
    sim: "Collision sim",
  },
];

export function getSet(id: string) {
  return OLY_SETS.find((s) => s.id === id);
}

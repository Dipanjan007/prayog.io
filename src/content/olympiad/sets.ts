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
  {
    id: "optics",
    title: "Optics",
    emoji: "🔭",
    blurb: "Optical benches, two-lens projectors and lasers into water. Get the lens formula and Snell's law right and the picture comes out sharp.",
    colour: "#7aa6c9",
    sim: "Optical bench sim",
  },
  {
    id: "electricity",
    title: "Electricity",
    emoji: "⚡",
    blurb: "Pick a resistor, wind a heater coil and tame a solar lamp. Ohm's law and P = V²/R decide everything here.",
    colour: "#a9b86a",
    sim: "Circuit sim",
  },
  {
    id: "fluids",
    title: "Fluids and buoyancy",
    emoji: "🚢",
    blurb: "Hydraulic lifts, barges loaded to the line in sea water, and a cube caught between kerosene and water.",
    colour: "#5fa3b3",
    sim: "Tank and buoyancy sim",
  },
  {
    id: "heat",
    title: "Heat and temperature",
    emoji: "🌡️",
    blurb: "Mixing bath water, cooling chai in a steel tumbler and leaving just enough ice in a glass of sharbat.",
    colour: "#d0925f",
    sim: "Calorimeter sim",
  },
  {
    id: "orbits",
    title: "Gravitation and orbits",
    emoji: "🛰️",
    blurb: "Jump on Mars, park a GSAT over India and toss a sample to a probe above Phobos.",
    colour: "#9d8fc9",
    sim: "Orbit sim",
  },
];

export function getSet(id: string) {
  return OLY_SETS.find((s) => s.id === id);
}

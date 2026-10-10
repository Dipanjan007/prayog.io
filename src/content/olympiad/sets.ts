import { MATHS_OLY_SETS } from "./maths-sets";
import type { OlySet, OlySubject } from "./types";

const PHYSICS_OLY_SETS: OlySet[] = [
  {
    id: "projectiles",
    symbols: [
      { sym: "u, v", meaning: "speeds, in m/s" },
      { sym: "θ", meaning: "theta, the angle of the throw or of the boat, in degrees" },
      { sym: "sin, cos, tan", meaning: "sine, cosine and tangent of an angle, calculator buttons" },
      { sym: "sin⁻¹", meaning: "the angle whose sine is this number" },
      { sym: "c", meaning: "speed of the river current, in m/s" },
      { sym: "t, T", meaning: "time and time of flight, in s" },
      { sym: "x, y", meaning: "distance across and height, in m" },
      { sym: "h₀", meaning: "height where the ball leaves the hand, in m" },
      { sym: "g", meaning: "pull of gravity, 9.8 m/s²" },
      { sym: "⇒", meaning: "so, which gives" },
      { sym: "( ) and [ ]", meaning: "work out what is inside first; [ ] is just a bigger bracket around ( )" },
      { sym: "/", meaning: "divide, the same as ÷" },
    ],
    title: "Kinematics and projectiles",
    emoji: "🏏",
    blurb: "Ferries that fight the current, sixes over the rope and a throw onto a moving tram.",
    colour: "#739ca8",
    sim: "Projectile and river sim",
  },
  {
    id: "newton",
    symbols: [
      { sym: "M, m", meaning: "the two masses, in kg" },
      { sym: "a", meaning: "acceleration, in m/s²" },
      { sym: "s", meaning: "distance, in m" },
      { sym: "t", meaning: "time, in s" },
      { sym: "T", meaning: "tension in the rope, in newtons (N)" },
      { sym: "g", meaning: "pull of gravity, 9.8 m/s²" },
      { sym: "θ", meaning: "theta, the slope angle" },
      { sym: "sin, cos", meaning: "sine and cosine of the angle" },
      { sym: "μₖ, μₛ", meaning: "mu, friction coefficients when sliding (kinetic) and still (static)" },
      { sym: "⇒", meaning: "so, which gives" },
      { sym: "( ) and [ ]", meaning: "work out what is inside first; [ ] is just a bigger bracket around ( )" },
      { sym: "/", meaning: "divide, the same as ÷" },
    ],
    title: "Newton's laws",
    emoji: "🏗️",
    blurb: "Pulleys, slopes and friction. Free-body diagrams decide everything here.",
    colour: "#ae8ba6",
    sim: "Incline and pulley sim",
  },
  {
    id: "circular-energy",
    symbols: [
      { sym: "m", meaning: "mass, in kg" },
      { sym: "v", meaning: "speed, in m/s" },
      { sym: "r, R", meaning: "radius of the bend or the loop, in m" },
      { sym: "N", meaning: "normal force from the road or track, in N" },
      { sym: "θ", meaning: "theta, the bank angle" },
      { sym: "tan⁻¹", meaning: "the angle whose tangent is this number" },
      { sym: "h", meaning: "starting height, in m" },
      { sym: "k", meaning: "spring constant: how stiff the spring is, in N/m" },
      { sym: "x", meaning: "how far the spring is squashed, in m" },
      { sym: "μₖ", meaning: "mu, sliding friction coefficient" },
      { sym: "W_f", meaning: "work lost to friction, in J" },
      { sym: "L", meaning: "length of the rough patch, in m" },
      { sym: "g", meaning: "pull of gravity, 9.8 m/s²" },
      { sym: "½", meaning: "one half" },
      { sym: "⇒", meaning: "so, which gives" },
      { sym: "( ) and [ ]", meaning: "work out what is inside first; [ ] is just a bigger bracket around ( )" },
      { sym: "/", meaning: "divide, the same as ÷" },
    ],
    title: "Circular motion and energy",
    emoji: "🎢",
    blurb: "Banked ghat roads, roller coaster loops and a spring launcher.",
    colour: "#c97f8a",
    sim: "Loop track sim",
  },
  {
    id: "momentum",
    symbols: [
      { sym: "m, M", meaning: "the two masses, in kg" },
      { sym: "u, v, V", meaning: "speeds before and after, in m/s" },
      { sym: "L", meaning: "length of the string, in m" },
      { sym: "h", meaning: "height the block swings up, in m" },
      { sym: "g", meaning: "pull of gravity, 9.8 m/s²" },
      { sym: "μ", meaning: "mu, friction coefficient of the road" },
      { sym: "d", meaning: "skid distance, in m" },
      { sym: "sin, cos", meaning: "sine and cosine of the angle" },
      { sym: "⇒", meaning: "so, which gives" },
      { sym: "( ) and [ ]", meaning: "work out what is inside first; [ ] is just a bigger bracket around ( )" },
      { sym: "/", meaning: "divide, the same as ÷" },
    ],
    title: "Momentum",
    emoji: "💥",
    blurb: "Recoil in space, an air rifle pellet in a block and a crash at a crossing.",
    colour: "#cf7f5c",
    sim: "Collision sim",
  },
  {
    id: "optics",
    symbols: [
      { sym: "u", meaning: "object distance, in cm (negative in front of the lens)" },
      { sym: "v", meaning: "image distance, in cm" },
      { sym: "f", meaning: "focal length, in cm" },
      { sym: "m", meaning: "magnification: image height ÷ object height" },
      { sym: "n", meaning: "refractive index of the water" },
      { sym: "i, r", meaning: "angles of incidence and refraction" },
      { sym: "sin, tan", meaning: "sine and tangent of an angle" },
      { sym: "x, d, D", meaning: "distances along the floor and depth, in m" },
      { sym: "⇒", meaning: "so, which gives" },
      { sym: "( ) and [ ]", meaning: "work out what is inside first; [ ] is just a bigger bracket around ( )" },
      { sym: "/", meaning: "divide, the same as ÷" },
    ],
    title: "Optics",
    emoji: "🔭",
    blurb: "Optical benches, two-lens projectors and lasers into water. Get the lens formula and Snell's law right and the picture comes out sharp.",
    colour: "#7aa6c9",
    sim: "Optical bench sim",
  },
  {
    id: "electricity",
    symbols: [
      { sym: "V", meaning: "voltage, in volts (V)" },
      { sym: "I", meaning: "current, in amperes (A)" },
      { sym: "R, X", meaning: "resistances, in ohms (Ω)" },
      { sym: "P", meaning: "power, in watts (W)" },
      { sym: "ρ", meaning: "rho, resistivity of the wire, in Ω m" },
      { sym: "L", meaning: "length of the wire, in m" },
      { sym: "A", meaning: "area of the wire's cross-section, in m²" },
      { sym: "d", meaning: "diameter of the wire, in m" },
      { sym: "π", meaning: "pi, about 3.1416" },
      { sym: "E", meaning: "EMF: the battery's full voltage, in V" },
      { sym: "r", meaning: "internal resistance of the battery, in Ω" },
      { sym: "⇒", meaning: "so, which gives" },
      { sym: "( ) and [ ]", meaning: "work out what is inside first; [ ] is just a bigger bracket around ( )" },
      { sym: "/", meaning: "divide, the same as ÷" },
    ],
    title: "Electricity",
    emoji: "⚡",
    blurb: "Pick a resistor, wind a heater coil and tame a solar lamp. Ohm's law and P = V²/R decide everything here.",
    colour: "#a9b86a",
    sim: "Circuit sim",
  },
  {
    id: "fluids",
    symbols: [
      { sym: "F", meaning: "force you push with, in N" },
      { sym: "W", meaning: "weight lifted, in N" },
      { sym: "A", meaning: "area of a piston, in m²" },
      { sym: "ρ", meaning: "rho, density, in kg/m³" },
      { sym: "V", meaning: "volume, in m³" },
      { sym: "m", meaning: "mass, in kg" },
      { sym: "g", meaning: "pull of gravity, 9.8 m/s²" },
      { sym: "⇒", meaning: "so, which gives" },
      { sym: "( ) and [ ]", meaning: "work out what is inside first; [ ] is just a bigger bracket around ( )" },
      { sym: "/", meaning: "divide, the same as ÷" },
    ],
    title: "Fluids and buoyancy",
    emoji: "🚢",
    blurb: "Hydraulic lifts, barges loaded to the line in sea water, and a cube caught between kerosene and water.",
    colour: "#5fa3b3",
    sim: "Tank and buoyancy sim",
  },
  {
    id: "heat",
    symbols: [
      { sym: "Q", meaning: "heat energy, in joules (J)" },
      { sym: "m", meaning: "mass, in kg" },
      { sym: "c", meaning: "specific heat: energy to warm 1 kg by 1 °C, in J/(kg °C)" },
      { sym: "4186, 2100, 840, 500", meaning: "specific heat of water, ice, glass and steel" },
      { sym: "334 000", meaning: "latent heat: energy to melt 1 kg of ice, in J/kg" },
      { sym: "(65 − 38)", meaning: "a temperature change, in °C" },
      { sym: "⇒", meaning: "so, which gives" },
      { sym: "( ) and [ ]", meaning: "work out what is inside first; [ ] is just a bigger bracket around ( )" },
      { sym: "/", meaning: "divide, the same as ÷" },
    ],
    title: "Heat and temperature",
    emoji: "🌡️",
    blurb: "Mixing bath water, cooling chai in a steel tumbler and leaving just enough ice in a glass of sharbat.",
    colour: "#d0925f",
    sim: "Calorimeter sim",
  },
  {
    id: "orbits",
    symbols: [
      { sym: "G", meaning: "the gravitational constant, 6.674 × 10⁻¹¹ N m²/kg²" },
      { sym: "M, m", meaning: "mass of the planet and of the object, in kg" },
      { sym: "g_E, g_M", meaning: "pull of gravity on Earth and on Mars" },
      { sym: "h_E, h_M", meaning: "jump height on Earth and on Mars" },
      { sym: "R, r", meaning: "radius of the planet, and distance from its centre, in m" },
      { sym: "H", meaning: "height above the surface, in m" },
      { sym: "v", meaning: "speed, in m/s" },
      { sym: "T", meaning: "time for one orbit, in s" },
      { sym: "π", meaning: "pi, about 3.14" },
      { sym: "⇒", meaning: "so, which gives" },
      { sym: "( ) and [ ]", meaning: "work out what is inside first; [ ] is just a bigger bracket around ( )" },
      { sym: "/", meaning: "divide, the same as ÷" },
    ],
    title: "Gravitation and orbits",
    emoji: "🛰️",
    blurb: "Jump on Mars, park a GSAT over India and toss a sample to a probe above Phobos.",
    colour: "#9d8fc9",
    sim: "Orbit sim",
  },
];

/** Every set, Physics first, then Maths. Use `setsFor` to show one track. */
export const OLY_SETS: OlySet[] = [...PHYSICS_OLY_SETS, ...MATHS_OLY_SETS];

export function getSet(id: string) {
  return OLY_SETS.find((s) => s.id === id);
}

export function subjectOf(set: Pick<OlySet, "subject">): OlySubject {
  return set.subject ?? "physics";
}

/** The sets of one track, in order. */
export function setsFor(subject: OlySubject) {
  return OLY_SETS.filter((s) => subjectOf(s) === subject);
}

/** Where a track's pages live: "/olympiad" or "/maths/olympiad". */
export function olyBase(subject: OlySubject) {
  return subject === "maths" ? "/maths/olympiad" : "/olympiad";
}

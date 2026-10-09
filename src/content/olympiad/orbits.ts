/**
 * Olympiad track: gravitation and orbits.
 * Original problems. Answers come from src/lib/sim/oly-orbits.ts, the same code the sim runs.
 */
import { EARTH, MARS, PHOBOS, SIDEREAL_DAY, heightForPeriod, jumpHeightOn, throwSpeedToHeight } from "@/lib/sim/oly-orbits";
import type { OlyProblem } from "./types";

const PROBE_H = 8000; // m above Phobos

export const ORBITS_PROBLEMS: OlyProblem[] = [
  {
    id: "mars-hop",
    set: "orbits",
    level: "warm-up",
    title: "A hop on Mars",
    emoji: "🔴",
    story: [
      "During training in Bengaluru, a future Indian astronaut in a full practice suit jumps straight up. Her feet rise 0.40 m off the floor.",
      "Mission planners want to know how high the same jump would take her on Mars, with the same suit and the same push from her legs, so they can set the height of the steps on a Mars lander.",
    ],
    given: ["Height of the jump on Earth: 0.40 m", "Earth: M = 5.97 × 10²⁴ kg, R = 6371 km", "Mars: M = 6.42 × 10²³ kg, R = 3390 km", "G = 6.674 × 10⁻¹¹ N m²/kg²", "Same take-off speed on both planets"],
    ask: "How high do her feet rise on Mars?",
    answer: jumpHeightOn(0.4, MARS),
    symbol: "h =",
    unit: "m",
    range: [0.05, 10],
    hints: [
      "The take-off speed is the same, so ½v² = g h is the same on both planets. That means h × g stays fixed: weaker gravity, higher jump.",
      "Find g on each planet from g = GM/R², or skip G altogether: g_Earth / g_Mars = (M_Earth / M_Mars) × (R_Mars / R_Earth)².",
    ],
    solution: [
      { text: "At the top of the jump all the take-off kinetic energy has become potential energy. The take-off speed is the same on both planets.", math: "½ v² = g_E h_E = g_M h_M  ⇒  h_M = (h_E × g_E) / g_M" },
      { text: "Surface gravity is g = GM/R². In the ratio, G cancels.", math: "g_E / g_M = (M_E / M_M) × (R_M / R_E)²" },
      { text: "Put in the numbers.", math: "g_E / g_M = [(5.97 × 10²⁴) / (6.42 × 10²³)] × (3390 / 6371)² = 9.30 × 0.283 = 2.63" },
      { text: "So the same jump goes about 2.6 times as high.", math: "h_M = 0.40 × 2.63 = 1.05 m" },
      { text: "Check: g_Mars = GM/R² = 6.674 × 10⁻¹¹ × 6.42 × 10²³ / (3.39 × 10⁶)² = 3.73 m/s², a little over a third of Earth's 9.8 m/s². She also takes 2.6 times as long to come down." },
    ],
    scene: (h) => ({ kind: "orbits-jump", hEarth: 0.4, on: MARS, mark: h, window: 0.04 }),
    simNote: "Side view. There is no air on Mars worth worrying about, so the jump is a clean up-and-down motion under constant g. The faint figure shows the same jump on Earth for comparison.",
  },
  {
    id: "gsat-parking",
    set: "orbits",
    level: "standard",
    title: "Parking GSAT over India",
    emoji: "📡",
    story: [
      "ISRO's communication satellites, like the GSAT series, sit above the equator and seem to hang still in the sky. A dish on a rooftop in Pune can point at one and never move.",
      "This works only if the satellite goes round the Earth in exactly the time the Earth takes to turn once. ISRO's Master Control Facility at Hassan in Karnataka places each satellite at just the right height.",
      "Careful: the Earth turns once relative to the stars in 23 h 56 min 4 s (a sidereal day). The 24 h solar day is a little longer, because the Earth also moves along its orbit round the Sun.",
    ],
    given: ["Period needed: 23 h 56 min 4 s = 86164 s", "Earth: M = 5.972 × 10²⁴ kg, R = 6371 km", "G = 6.674 × 10⁻¹¹ N m²/kg²", "Circular orbit above the equator"],
    ask: "At what height above the Earth's surface must the satellite orbit? Give your answer in km.",
    answer: heightForPeriod(EARTH, SIDEREAL_DAY) / 1000,
    symbol: "h =",
    unit: "km",
    range: [500, 200000],
    hints: [
      "Gravity provides the centripetal force: GMm/r² = mv²/r. Here r is measured from the Earth's centre, not from the ground.",
      "The speed is one circumference per period, v = 2πr/T. Put that in and you get r³ = GMT²/(4π²). Take the cube root, then subtract the Earth's radius.",
    ],
    solution: [
      { text: "Gravity is the only force, and it pulls towards the Earth's centre. It supplies the centripetal force.", math: "(G M m) / r² = (m v²) / r  ⇒  v² = (G M) / r" },
      { text: "One orbit, a distance 2πr, takes one period T. So v = 2πr/T. Substitute and rearrange.", math: "[(2πr) / T]² = (G M) / r  ⇒  r³ = (G M T²) / (4π²)" },
      { text: "Work out GM first, then r³.", math: "G M = 6.674 × 10⁻¹¹ × 5.972 × 10²⁴ = 3.986 × 10¹⁴ m³/s²;   r³ = (3.986 × 10¹⁴ × 86164²) / 39.48 = 7.495 × 10²² m³" },
      { text: "Take the cube root. This is the distance from the Earth's centre.", math: "r = 4.216 × 10⁷ m = 42 160 km" },
      { text: "Subtract the Earth's radius to get the height.", math: "h = 42 160 − 6371 ≈ 35 790 km" },
      { text: "Using 24 h instead gives about 35 870 km, only 0.2% more. The mass of the satellite cancelled, so a small GSAT and a big one park at the same height. Kepler's third law (T² ∝ r³) is hiding in step 2." },
    ],
    scene: (hKm) => ({ kind: "orbits-geo", hKm, day: SIDEREAL_DAY, maxDrift: 2, station: "Hassan" }),
    simNote: "Seen from above the North Pole, with the Earth turning anticlockwise. The satellite starts straight above Hassan and we watch for one sidereal day, sped up. The Earth and orbit are to scale; the satellite and station dots are not.",
  },
  {
    id: "phobos-toss",
    set: "orbits",
    level: "olympiad",
    title: "Tossing a sample on Phobos",
    emoji: "🥔",
    story: [
      "Imagine a future ISRO mission to Phobos, the small potato-shaped moon of Mars. A rover on the surface has collected a rock sample in a canister.",
      "A probe hovers 8.0 km straight above the rover, waiting with a soft net. The rover's spring launcher will throw the canister straight up. The net only works if the canister arrives almost at rest.",
      "Phobos is so small that 8 km up, its gravity is only about a third as strong as at the surface. So mgh is not good enough here.",
    ],
    given: ["Phobos: M = 1.07 × 10¹⁶ kg, mean radius R = 11.1 km (treat it as a sphere)", "Probe height above the surface: H = 8.0 km", "G = 6.674 × 10⁻¹¹ N m²/kg²", "No air, ignore the pull of Mars and the spin of Phobos"],
    ask: "With what speed must the canister leave the surface so that it just reaches the probe?",
    answer: throwSpeedToHeight(PHOBOS, PROBE_H),
    symbol: "v =",
    unit: "m/s",
    range: [0.5, 30],
    hints: [
      "Use the full gravitational potential energy, U = −GMm/r, with r measured from the centre of Phobos. The canister starts at r = R and should stop at r = R + H.",
      "Energy is conserved: ½mv² − GMm/R = 0 − GMm/(R + H). The mass m cancels.",
    ],
    solution: [
      { text: "Gravity gets weaker with height, so g is not constant over 8 km. Use the potential energy U = −GMm/r instead of mgh.", math: "(½ m v²) − [(G M m) / R] = −(G M m) / (R + H)" },
      { text: "Cancel m and solve for v².", math: "v² = 2 G M × [(1/R) − 1/(R + H)]" },
      { text: "Work out each piece. The centre-to-probe distance is 11.1 + 8.0 = 19.1 km.", math: "G M = 6.674 × 10⁻¹¹ × 1.07 × 10¹⁶ = 7.141 × 10⁵ m³/s²;   (1/R) − 1/(R + H) = (1/11 100) − (1/19 100) = 3.773 × 10⁻⁵ m⁻¹" },
      { text: "Now find the speed.", math: "v² = 2 × 7.141 × 10⁵ × 3.773 × 10⁻⁵ = 53.9 m²/s²  ⇒  v = 7.34 m/s" },
      { text: "The mgh shortcut uses g = GM/R² = 0.0058 m/s² all the way up and gives v = √(2gH) = 9.6 m/s, about 30% too fast. The canister would hit the net at about 6 m/s." },
      { text: "Escape speed from Phobos is √(2GM/R) = 11.3 m/s. A good cricket throw is faster than that, so a ball thrown hard on Phobos would never come back." },
    ],
    scene: (v) => ({ kind: "orbits-throw", body: PHOBOS, H: PROBE_H, v, catchSpeed: 1.5 }),
    simNote: "Side view, to scale, with Phobos drawn as a sphere. The canister's motion is stepped through time with Newton's law of gravity, so it slows down less and less as it climbs. The flight takes over half an hour and is sped up.",
  },
];

"use client";

import { createLocalStore } from "./store";

export interface LessonProgress {
  /** Step ids completed, e.g. "hook", "predict", "task:roof". */
  done: string[];
  predictionCorrect?: boolean;
  challengeStars?: number;
  quizBest?: number;
}

export interface Progress {
  xp: number;
  badges: string[];
  lessons: Record<string, LessonProgress>;
  streak: { count: number; lastDay: string | null; freezes: number };
}

const initial: Progress = {
  xp: 0,
  badges: [],
  lessons: {},
  streak: { count: 0, lastDay: null, freezes: 1 },
};

export const progressStore = createLocalStore<Progress>("prayog.progress.v1", initial);
export const useProgress = progressStore.use;

export interface BadgeInfo {
  id: string;
  name: string;
  how: string;
  emoji: string;
}

export const BADGES: BadgeInfo[] = [
  { id: "first-gust", name: "First Gust", how: "Finish your first mission in any lab", emoji: "💨" },
  { id: "storm-chaser", name: "Storm Chaser", how: "Lift a roof in a cyclone-speed wind", emoji: "🌀" },
  { id: "shape-shifter", name: "Shape Shifter", how: "Draw your own shape in the wind tunnel", emoji: "✏️" },
  { id: "downforce", name: "Downforce", how: "Push a sports car onto the road with its rear wing", emoji: "🏎️" },
  { id: "wind-whisperer", name: "Wind Whisperer", how: "Finish every step of the pressure lesson", emoji: "🌬️" },
  { id: "first-flight", name: "First Flight", how: "Get 3 stars in the wing challenge", emoji: "🛩️" },
  { id: "speed-demon", name: "Speed Demon", how: "Finish every step of the motion lesson", emoji: "🏁" },
  { id: "perfect-stop", name: "Perfect Stop", how: "Get 3 stars in the stopping challenge", emoji: "🛑" },
  { id: "bright-spark", name: "Bright Spark", how: "Finish every step of the circuits lesson", emoji: "💡" },
  { id: "torch-fixer", name: "Torch Fixer", how: "Repair the torch in 3 moves", emoji: "🔦" },
  { id: "mirror-maze", name: "Mirror Maze", how: "Finish every step of the Class 8 mirrors lesson", emoji: "🪞" },
  { id: "image-matcher", name: "Image Matcher", how: "Make all three images in Image match", emoji: "🖼️" },
  { id: "lens-crafter", name: "Lens Crafter", how: "Finish every step of the Class 10 light lesson", emoji: "🔍" },
  { id: "sharp-focus", name: "Sharp Focus", how: "Focus all three projector screens", emoji: "📽️" },
  { id: "eye-doctor", name: "Eye Doctor", how: "Finish every step of the human eye lesson", emoji: "👓" },
  { id: "clear-vision", name: "Clear Vision", how: "Help all three patients in the eye clinic", emoji: "🌈" },
  { id: "ohm-master", name: "Ohm Master", how: "Finish every step of the electricity lesson", emoji: "⚡" },
  { id: "on-target", name: "On Target", how: "Hit all three target currents in the electricity challenge", emoji: "🔋" },
  { id: "field-finder", name: "Field Finder", how: "Finish every step of the magnetism lesson", emoji: "🧭" },
  { id: "left-hand-hero", name: "Left-Hand Hero", how: "Predict the rod's swing in all three rounds", emoji: "🫲" },
  { id: "magnet-maker", name: "Magnet Maker", how: "Finish every step of the magnetic and heating effects lesson", emoji: "🧲" },
  { id: "crane-master", name: "Crane Master", how: "Fill all three scrap trucks with exactly the right load", emoji: "🏗️" },
  { id: "force-finder", name: "Force Finder", how: "Finish every step of the forces lesson", emoji: "💪" },
  { id: "crate-master", name: "Crate Master", how: "Slide the crate into the target on wood, sand and ice", emoji: "📦" },
  { id: "newtons-apprentice", name: "Newton's Apprentice", how: "Finish every step of the forces and motion lesson", emoji: "🍎" },
  { id: "perfect-knock", name: "Perfect Knock", how: "Knock all three target carts to their exact speeds", emoji: "🎱" },
  { id: "energy-engineer", name: "Energy Engineer", how: "Finish every step of the work and energy lesson", emoji: "🎡" },
  { id: "just-clear", name: "Just Clear", how: "Get the coaster over the last hill slower than 2 m/s", emoji: "🎢" },
  { id: "sound-explorer", name: "Sound Explorer", how: "Finish every step of the sound lesson", emoji: "🔊" },
  { id: "sonar-captain", name: "SONAR Captain", how: "Find the sea depth at all three spots with SONAR", emoji: "🚢" },
  { id: "sky-keeper", name: "Sky Keeper", how: "Finish every step of the Class 8 sky clock lesson", emoji: "🌓" },
  { id: "moon-watcher", name: "Moon Watcher", how: "Match all three Moons in Moon match", emoji: "🌙" },
  { id: "time-keeper", name: "Time Keeper", how: "Finish every step of the Class 7 time and motion lesson", emoji: "⏱️" },
  { id: "clock-maker", name: "Clock Maker", how: "Build pendulum clocks that tick at 1 s, 2 s and 1.5 s", emoji: "🕰️" },
  { id: "heat-explorer", name: "Heat Explorer", how: "Finish every step of the heat transfer lesson", emoji: "🔥" },
  { id: "heat-detective", name: "Heat Detective", how: "Answer all three heat detective questions", emoji: "🕵️" },
  { id: "shadow-master", name: "Shadow Master", how: "Finish every step of the Class 7 shadows and reflections lesson", emoji: "🌗" },
  { id: "laser-ace", name: "Laser Ace", how: "Guide the laser to the target in all three mirror levels", emoji: "🎯" },
  { id: "orbit-explorer", name: "Orbit Explorer", how: "Finish every step of the Earth, Moon and Sun lesson", emoji: "🌍" },
  { id: "eclipse-hunter", name: "Eclipse Hunter", how: "Finish all three Sky planner jobs, including a total solar and a total lunar eclipse", emoji: "🌑" },
  { id: "gravity-guru", name: "Gravity Guru", how: "Finish every step of the gravity lesson", emoji: "🍎" },
  { id: "planet-detective", name: "Planet Detective", how: "Name all three mystery worlds from the scale reading", emoji: "🪐" },
  { id: "spin-doctor", name: "Spin Doctor", how: "Finish every step of the circular motion lesson", emoji: "🌀" },
  { id: "orbit-ace", name: "Orbit Ace", how: "Take the bend and put both satellites into circular orbits", emoji: "🛰️" },
  { id: "black-hole-explorer", name: "Black Hole Explorer", how: "Finish every step of the black holes lesson", emoji: "🕳️" },
  { id: "horizon-hunter", name: "Horizon Hunter", how: "Find the black hole size of all three mystery objects", emoji: "🔭" },
  { id: "clock-bender", name: "Clock Bender", how: "Finish every step of the light clock lesson", emoji: "⏳" },
  { id: "twin-tracker", name: "Twin Tracker", how: "Get 3 stars in the twin time machine", emoji: "👯" },
  { id: "speed-limit-keeper", name: "Speed Limit Keeper", how: "Finish every step of the nothing beats light lesson", emoji: "🚦" },
  { id: "rocket-squeezer", name: "Rocket Squeezer", how: "Get 3 stars in the rocket squeeze", emoji: "🚀" },
  { id: "frozen-energy", name: "Frozen Energy", how: "Finish every step of the E = mc² lesson", emoji: "⚛️" },
  { id: "star-forger", name: "Star Forger", how: "Solve all three mass to energy rounds", emoji: "☀️" },
  { id: "pressure-pro", name: "Pressure Pro", how: "Finish every step of the press, pour and pump lab", emoji: "🧱" },
  { id: "light-footed", name: "Light Footed", how: "Get the camel, elephant and tractor across soft ground", emoji: "🐘" },
  { id: "path-finder", name: "Path Finder", how: "Finish every step of the distance and displacement lesson", emoji: "🧭" },
  { id: "route-master", name: "Route Master", how: "Solve all three Kolkata route puzzles", emoji: "🗺️" },
  { id: "safe-sparky", name: "Safe Sparky", how: "Finish every step of the house wiring lesson", emoji: "🔌" },
  { id: "budget-boss", name: "Budget Boss", how: "Keep all three household bills within budget", emoji: "💡" },
  { id: "lemon-volta", name: "Lemon Volta", how: "Finish every step of the lemon battery lesson", emoji: "🍋" },
  { id: "fruit-power", name: "Fruit Power Station", how: "Power all three gadgets with the fewest fruits", emoji: "🔋" },
  { id: "triangle-maker", name: "Triangle Maker", how: "Finish every step of the Class 7 triangles lesson", emoji: "🔺" },
  { id: "set-square", name: "Set Square", how: "Build all three triangles to order", emoji: "📐" },
  { id: "square-sage", name: "Square Sage", how: "Finish every step of the Baudhayana-Pythagoras lesson", emoji: "🟪" },
  { id: "ladder-ace", name: "Ladder Ace", how: "Pick the right fire ladder for all three rescues", emoji: "🚒" },
  { id: "grid-pilot", name: "Grid Pilot", how: "Finish every step of the coordinates lesson", emoji: "🛸" },
  { id: "drone-courier", name: "Drone Courier", how: "Make all three drone deliveries", emoji: "📦" },
  { id: "height-hunter", name: "Height Hunter", how: "Finish every step of the heights and distances lesson", emoji: "📏" },
  { id: "mystery-measurer", name: "Mystery Measurer", how: "Find all three mystery heights to within 1 m", emoji: "🗼" },
  { id: "zeno-runner", name: "Zeno Runner", how: "Finish every step of the infinite sums lab", emoji: "🏃" },
  { id: "series-seer", name: "Series Seer", how: "Predict where all three sums settle", emoji: "♾️" },
  { id: "code-cracker", name: "Code Cracker", how: "Finish every step of the secret codes lab", emoji: "🔐" },
  { id: "kindi-codebreaker", name: "Al-Kindi's Heir", how: "Decode all three secret messages", emoji: "🕵️" },
  { id: "root-ranger", name: "Root Ranger", how: "Finish every step of the quadratic equations lesson", emoji: "🌈" },
  { id: "sridhara-solver", name: "Sridhara Solver", how: "Make all three curves with the right roots", emoji: "🎯" },
  { id: "data-detective", name: "Data Detective", how: "Finish every step of the Understanding Data lab", emoji: "📊" },
  { id: "selectors-choice", name: "Selectors' Choice", how: "Meet all three selectors' requests", emoji: "🏏" },
  { id: "chance-champ", name: "Chance Champ", how: "Finish every step of the probability lesson", emoji: "🎲" },
  { id: "mela-maker", name: "Mela Maker", how: "Build all three mela game stalls to order", emoji: "🎡" },
  { id: "line-walker", name: "Line Walker", how: "Finish every step of the Two Variables, One Line lab", emoji: "✏️" },
  { id: "cross-checker", name: "Cross Checker", how: "Crack all three puzzles where two lines cross", emoji: "❌" },
  { id: "fare-finder", name: "Fare Finder", how: "Finish every step of the linear polynomials lesson", emoji: "🛺" },
  { id: "meter-master", name: "Meter Master", how: "Match all three fare charts", emoji: "📈" },
  { id: "ratio-raja", name: "Ratio Raja", how: "Finish every step of the proportional reasoning lesson", emoji: "🍋" },
  { id: "holi-mixer", name: "Holi Mixer", how: "Mix all three Holi colour orders exactly", emoji: "🎨" },
  { id: "percent-pro", name: "Percent Pro", how: "Finish every step of the percentages lesson", emoji: "💯" },
  { id: "bill-buster", name: "Bill Buster", how: "Hit all three exact bills in the Diwali sale", emoji: "🪔" },
  { id: "power-player", name: "Power Player", how: "Finish every step of the Power Play lab", emoji: "📄" },
  { id: "fold-master", name: "Fold Master", how: "Fold just enough for all three targets", emoji: "🌕" },
  { id: "tile-master", name: "Tile Master", how: "Finish every step of the squares and cubes lesson", emoji: "🟨" },
  { id: "block-builder", name: "Block Builder", how: "Build all three orders exactly", emoji: "🧊" },
  { id: "pattern-spotter", name: "Pattern Spotter", how: "Finish every step of the letter-numbers lab", emoji: "🔥" },
  { id: "rule-maker", name: "Rule Maker", how: "Crack the rule for all three new patterns", emoji: "📏" },
  { id: "balance-keeper", name: "Balance Keeper", how: "Finish every step of the Finding the Unknown lesson", emoji: "⚖️" },
  { id: "mandi-master", name: "Mandi Master", how: "Solve all three mandi balances within par", emoji: "🥕" },
  { id: "point-zoomer", name: "Point Zoomer", how: "Finish every step of the decimals lab", emoji: "🔎" },
  { id: "photo-finish", name: "Photo Finish", how: "Do all three sports day jobs to the exact paisa", emoji: "⏱️" },
  { id: "fraction-chef", name: "Fraction Chef", how: "Finish every step of the fractions lesson", emoji: "🍫" },
  { id: "mithai-master", name: "Mithai Master", how: "Get all three mithai shop orders right", emoji: "🍬" },
  { id: "rangoli-tiler", name: "Rangoli Tiler", how: "Finish every step of the tilings lab", emoji: "🔷" },
  { id: "corner-fitter", name: "Corner Fitter", how: "Fill all three half-done corners with no gap", emoji: "🧩" },
  { id: "rail-ranger", name: "Rail Ranger", how: "Finish every step of the parallel lines lesson", emoji: "🛤️" },
  { id: "track-layer", name: "Track Layer", how: "Lay all three lines perfectly parallel", emoji: "🚆" },
  { id: "machine-builder", name: "Machine Builder", how: "Finish every step of the simple machines lesson", emoji: "🏗️" },
  { id: "load-master", name: "Load Master", how: "Finish all three loading jobs", emoji: "🚚" },
  { id: "hall-tuner", name: "Hall Tuner", how: "Finish every step of the silent bells and singing halls lesson", emoji: "🎛️" },
  { id: "sabine-ear", name: "Sabine's Ear", how: "Tune all three halls", emoji: "🏛️" },
  { id: "eureka-finder", name: "Eureka Finder", how: "Finish every step of the float or sink lesson", emoji: "🛁" },
  { id: "cargo-captain", name: "Cargo Captain", how: "Load all three cargo boats as full as they can safely go", emoji: "⚓" },
  { id: "sky-painter", name: "Sky Painter", how: "Finish every step of the sky colours lesson", emoji: "🌅" },
  { id: "rainbow-catcher", name: "Rainbow Catcher", how: "Solve all three Sky detective rounds", emoji: "🌦️" },
  { id: "near-point-navigator", name: "Near Point Navigator", how: "Finish every step of the eye defects lesson", emoji: "🤓" },
  { id: "spectacle-shop-star", name: "Spectacle Shop Star", how: "Fit reading glasses for all three customers in the spectacle shop", emoji: "🕶️" },
  { id: "monsoon-maker", name: "Monsoon Maker", how: "Finish every step of the water cycle lesson", emoji: "🌧️" },
  { id: "weather-maker", name: "Weather Maker", how: "Solve all three weather rounds", emoji: "⛈️" },
  { id: "friction-fighter", name: "Friction Fighter", how: "Finish every step of the friction and tension lesson", emoji: "🛷" },
  { id: "pulley-pro", name: "Pulley Pro", how: "Solve all three pulley puzzles", emoji: "🪝" },
  { id: "sharp-mind", name: "Sharp Mind", how: "Score full marks in a Master quiz", emoji: "🎯" },
];

/** XP needed to reach each level: 0, 100, 300, 600, 1000, ... */
export function levelFor(xp: number) {
  let level = 1;
  while (xp >= (100 * level * (level + 1)) / 2) level++;
  const start = (100 * (level - 1) * level) / 2;
  const next = (100 * level * (level + 1)) / 2;
  return { level, start, next, fraction: (xp - start) / (next - start) };
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** Count today towards the streak. A missed day uses a freeze if there is one. */
function touchStreak(s: Progress["streak"]): Progress["streak"] {
  const t = today();
  if (s.lastDay === t) return s;
  if (!s.lastDay) return { ...s, count: 1, lastDay: t };
  const gap = daysBetween(s.lastDay, t);
  if (gap === 1) return { ...s, count: s.count + 1, lastDay: t };
  if (gap === 2 && s.freezes > 0) return { count: s.count + 1, lastDay: t, freezes: s.freezes - 1 };
  return { ...s, count: 1, lastDay: t };
}

/**
 * Mark a lesson step done and award XP once. Returns the XP gained (0 if the
 * step was already done).
 */
export function completeStep(lessonId: string, stepId: string, xp: number, patch: Partial<LessonProgress> = {}) {
  let gained = 0;
  progressStore.update((p) => {
    const lesson = p.lessons[lessonId] ?? { done: [] };
    const already = lesson.done.includes(stepId);
    gained = already ? 0 : xp;
    return {
      ...p,
      xp: p.xp + gained,
      streak: touchStreak(p.streak),
      lessons: {
        ...p.lessons,
        [lessonId]: { ...lesson, ...patch, done: already ? lesson.done : [...lesson.done, stepId] },
      },
    };
  });
  return gained;
}

/** Award XP for improving a best score, e.g. more challenge stars. */
export function improveBest(lessonId: string, field: "challengeStars" | "quizBest", value: number, xpPerPoint: number) {
  let gained = 0;
  progressStore.update((p) => {
    const lesson = p.lessons[lessonId] ?? { done: [] };
    const prev = lesson[field] ?? 0;
    if (value <= prev) return p;
    gained = (value - prev) * xpPerPoint;
    return {
      ...p,
      xp: p.xp + gained,
      streak: touchStreak(p.streak),
      lessons: { ...p.lessons, [lessonId]: { ...lesson, [field]: value } },
    };
  });
  return gained;
}

/** Returns true if the badge is new. */
export function awardBadge(id: string) {
  let isNew = false;
  progressStore.update((p) => {
    if (p.badges.includes(id)) return p;
    isNew = true;
    return { ...p, badges: [...p.badges, id] };
  });
  return isNew;
}

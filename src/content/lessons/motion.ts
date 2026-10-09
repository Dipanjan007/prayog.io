/**
 * Class 9 · Exploration · "Describing Motion Around Us".
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c9-motion";

/** Challenge: stop in the zone from a standing start. Seconds needed for 1, 2 and 3 stars. */
export const STOP_STARS = [12, 10, 9];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "speed-demon",
  classNum: 9,
  book: "Exploration",
  chapter: "Describing Motion Around Us",
  title: "Drive it, then graph it",
  intro: {
    objective:
      "Drive a sports car and watch its distance–time and speed–time graphs draw live, to understand speed and acceleration.",
    learn: [
      "Speed, and the difference between uniform and non-uniform motion",
      "How to read the slope of a distance–time graph",
      "What acceleration is and how to calculate it",
      "How the equations of motion predict stopping distances",
    ],
    realLife:
      "Car adverts that boast 0 to 100 km/h times, speed cameras and the safe braking distance on highways all use these ideas.",
    minutes: 25,
  },
  hook: {
    title: "The 0 to 100 question",
    text:
      "Car adverts brag that a sports car goes from 0 to 100 km/h in under 6 seconds. What does that number really tell you, and how far has the car gone by then? Take the wheel and find out.",
  },
  predict: {
    question: "A sports car speeds up steadily from rest. What does its distance–time graph look like?",
    options: ["A straight sloping line", "A curve that gets steeper and steeper", "A flat line"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:cruise",
      title: "Steady cruise",
      text:
        "Speed up a little, then let go of both pedals. This ideal road has no friction, so the car keeps its speed. Cruise for 4 seconds and watch the distance–time graph.",
      found:
        "The distance–time graph became a straight line: the car covered equal distances in equal times. That is uniform motion, and the slope of the line is the speed.",
    },
    {
      id: "task:accel",
      title: "Floor it",
      text: "Stop the car (or press Reset), then hold Accelerate for 3 seconds without letting go.",
      found:
        "The speed–time graph is a straight sloping line: the speed rose by 5 m/s every second. That steady change is uniform acceleration, 5 m/s². Meanwhile the distance–time graph curved upwards.",
    },
    {
      id: "task:stop",
      title: "Brake to a stop",
      text: "Get above 15 m/s (54 km/h), then hold Brake until the car stops. We'll measure how far it travels while braking.",
      found:
        "While braking, the speed–time graph slopes down to zero. The area under it, a triangle of ½ × speed × time, equals the distance travelled while stopping.",
    },
  ],
  discovery: {
    scientist: "Nicole Oresme",
    years: "about 1320–1382",
    fact: "Around 1350, the French scholar Oresme drew some of the first graphs, with time along one side and speed up the other. He used them to show that the area under the graph gives the distance travelled.",
    formula: "s = (u × t) + (½ × a × t²)",
    formulaNote: "Distance travelled with steady acceleration. It is the area under the speed–time graph.",
  },
  symbols: [
    { sym: "u", meaning: "starting speed, in m/s" },
    { sym: "v", meaning: "final speed, in m/s" },
    { sym: "a", meaning: "acceleration: how fast the speed changes, in m/s²" },
    { sym: "t", meaning: "time taken, in s" },
    { sym: "s", meaning: "distance covered, in m" },
    { sym: "½", meaning: "one half" },
    { sym: "t², u², v²", meaning: "t × t, u × u, v × v" },
  ],
  ideas: [
    {
      title: "Speed",
      text: "Speed tells how much distance is covered per unit time. To change m/s to km/h, multiply by 3.6.",
      formula: "speed = distance ÷ time   (unit: m/s)",
    },
    {
      title: "Uniform and non-uniform motion",
      text: "In uniform motion an object covers equal distances in equal intervals of time, so its distance–time graph is a straight line. The slope of that line is the speed.",
    },
    {
      title: "Acceleration",
      text: "Acceleration is the change in velocity per unit time. Speeding up gives positive acceleration; slowing down gives negative acceleration (retardation).",
      formula: "a = (v − u) ÷ t   (unit: m/s²)",
    },
    {
      title: "Equations of uniform acceleration",
      text: "For steady acceleration, these link the starting velocity u, final velocity v, acceleration a, time t and distance s. The area under a speed–time graph is the distance travelled.",
      formula: "v = u + (a × t)    s = (u × t) + (½ × a × t²)    v² = u² + (2 × a × s)",
    },
  ],
  challenge: {
    title: "Perfect stop",
    text: "Press Reset, then race from the start and stop with the car's nose inside the green Stop Zone (95 to 100 m). Faster times earn more stars: 12 s, 10 s, 9 s.",
  },
  quiz: [
    {
      q: "A car covers 150 km in 3 hours. What is its average speed?",
      options: ["450 km/h", "50 km/h", "153 km/h", "0.02 km/h"],
      answer: 1,
      why: "Average speed = 150 km ÷ 3 h = 50 km/h.",
    },
    {
      q: "What does the slope of a distance–time graph tell you?",
      options: ["The acceleration", "The speed", "The total time", "The mass"],
      answer: 1,
      why: "Slope = distance ÷ time, which is speed.",
    },
    {
      q: "What does the area under a speed–time graph give?",
      options: ["The distance travelled", "The acceleration", "The average speed", "The time taken"],
      answer: 0,
      why: "Speed × time is distance, so the area under the graph is the distance.",
    },
    {
      q: "A car goes from 0 to 20 m/s in 5 s. What is its acceleration?",
      options: ["100 m/s²", "25 m/s²", "4 m/s²", "0.25 m/s²"],
      answer: 2,
      why: "a = (20 − 0) ÷ 5 = 4 m/s².",
    },
    {
      q: "A distance–time graph is a straight sloping line. The motion is…",
      options: ["Uniform", "Accelerating", "At rest", "Slowing down"],
      answer: 0,
      why: "A straight line means equal distances in equal times: uniform motion.",
    },
    {
      q: "A car at 20 m/s brakes with a deceleration of 4 m/s². How far does it travel before stopping?",
      options: ["5 m", "50 m", "80 m", "100 m"],
      answer: 1,
      why: "v² = u² + 2as gives 0 = 400 − 8s, so s = 50 m.",
    },
    {
      q: "You run one full lap of a circular track and finish where you started. What is your displacement?",
      options: ["The length of the track", "Twice the radius", "Zero", "It depends on your speed"],
      answer: 2,
      why: "Displacement is the straight-line change in position; you ended where you began.",
    },
  ],
};

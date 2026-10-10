/**
 * Class 7 · Curiosity (NCERT 2024) · "Measurement of Time and Motion".
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c7-time-motion";

/**
 * Challenge: clock maker. Build a pendulum with each target time period (seconds).
 * A run of 10 oscillations counts if its period is within PERIOD_TOLERANCE. One star per clock.
 */
export const CLOCK_ROUNDS: { period: number; who: string; hint: string }[] = [
  { period: 1, who: "A clock that ticks once every second", hint: "One full oscillation should take exactly 1 s." },
  { period: 2, who: "A tall wall clock like the one at Nani's house", hint: "This one swings slowly: 2 s for each oscillation." },
  { period: 1.5, who: "A clock in between", hint: "Aim for 1.5 s. Should the thread be longer or shorter than for 1 s?" },
];
export const PERIOD_TOLERANCE = 0.02;

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "time-keeper",
  classNum: 7,
  book: "Curiosity",
  chapter: "Measurement of Time and Motion",
  title: "Tick, tock and zoom",
  intro: {
    objective:
      "Use a swinging pendulum to measure time, then time a race to find out who is really the fastest.",
    learn: [
      "What an oscillation and a time period are",
      "What changes the time period of a pendulum, and what does not",
      "How to find speed using distance ÷ time, in m/s and km/h",
      "The difference between uniform and non-uniform motion",
    ],
    realLife:
      "Old wall clocks, the hourglass in board games, the speedometer in a bus, sports day races and the speed shown on TV for a cricket ball all use these ideas.",
    minutes: 25,
  },
  hook: {
    title: "The tick-tock clock",
    text:
      "Your nani's old wall clock has a brass weight that swings tick, tock all day long. When Jasprit Bumrah bowls, the TV shows 145 km/h before the batter even swings. Both are about time. How can a swinging weight keep time? And how do we know who is the fastest? Let's find out.",
  },
  predict: {
    question: "You tie a heavy bob to a pendulum instead of a light one. The thread stays the same length. What happens to the time for one swing?",
    options: ["It takes more time", "It takes less time", "It stays the same"],
    answer: 2,
  },
  tasks: [
    {
      id: "task:period",
      title: "Time 10 oscillations",
      text: "Press Release. The stopwatch stops by itself after 10 oscillations. Look at the time period in the log.",
      found:
        "One oscillation is a full swing: from one end to the other end and back again. The time for one oscillation is the time period. We time 10 oscillations and divide by 10, because one swing is too quick to time well by hand.",
    },
    {
      id: "task:mass",
      title: "Heavy or light?",
      text: "Keep the same length and angle. Change only the mass of the bob, then time 10 oscillations again.",
      found:
        "The time period did not change. A heavy bob and a light bob swing in the same time. Try a big angle too. The period grows only a tiny bit, so for small swings we can say it stays the same.",
    },
    {
      id: "task:length",
      title: "Long or short?",
      text: "Now change the length of the thread by at least 20 cm and time it again.",
      found:
        "A longer thread swings more slowly, so it has a longer time period. A shorter thread swings faster. The length is what sets the time period. Clockmakers make a pendulum clock run slow or fast by changing the length.",
    },
    {
      id: "task:speed",
      title: "Find a speed",
      text: "Switch to the race track. Race any racer over 100 m. Then work out its speed and type it in.",
      found:
        "Speed tells us how much distance is covered in one unit of time. Speed = distance ÷ time. If the cycle covers 100 m in 20 s, its speed is 100 ÷ 20 = 5 m/s. That is the same as 18 km/h.",
    },
    {
      id: "task:uniform",
      title: "Steady or not?",
      text: "Race the cycle and the auto-rickshaw. Look at the dots. Each dot shows where a racer was after every second.",
      found:
        "The cycle's dots are equally spaced. It covers the same distance every second, so it is in uniform linear motion. The auto-rickshaw's dots are close at the start, far apart in the middle and bunched up at the speed breaker. Its speed keeps changing, so it is in non-uniform linear motion.",
    },
  ],
  discovery: {
    scientist: "Galileo Galilei",
    years: "1564–1642",
    fact: "The story goes that as a 19-year-old in Pisa Cathedral, Galileo timed a swinging lamp against his own pulse. Wide swings and small swings took the same time, the idea behind pendulum clocks.",
    formula: "T = 2π × √(L ÷ g)",
    formulaNote: "A pendulum's time period depends only on its length L (and gravity g), not on its mass or how wide it swings.",
  },
  symbols: [
    { sym: "T", meaning: "time period: time for one full swing, in seconds (s)" },
    { sym: "L", meaning: "length of the pendulum string, in metres (m)" },
    { sym: "g", meaning: "pull of gravity, about 9.8 m/s²" },
    { sym: "π", meaning: "pi, about 3.14" },
    { sym: "√( )", meaning: "square root of what is inside the bracket" },
    { sym: "÷", meaning: "divide" },
    { sym: "×", meaning: "multiply" },
  ],
  ideas: [
    {
      title: "Clocks, old and new",
      text: "Long ago people used a sundial (the shadow of a stick), a water clock or ghatika (a bowl that sinks as water flows in) and an hourglass (sand falling through a narrow neck). Later, pendulum clocks used a swinging bob. Today we use quartz and atomic clocks. The SI unit of time is the second (s).",
      formula: "1 minute = 60 s    1 hour = 60 minutes = 3600 s",
    },
    {
      title: "The simple pendulum",
      text: "A simple pendulum is a small heavy bob hanging from a thread. One oscillation is a swing from one end to the other and back. The time period is the time for one oscillation. It depends on the length of the thread. It does not depend on the mass of the bob, and for small swings it hardly depends on the angle.",
      formula: "Time period = total time ÷ number of oscillations",
    },
    {
      title: "Speed",
      text: "Speed is the distance covered in one unit of time. The SI unit of speed is metre per second (m/s). On roads we often use kilometre per hour (km/h). To compare two racers, compare their speeds, not just their distances or times.",
      formula: "Speed = distance ÷ time    5 m/s = 18 km/h",
    },
    {
      title: "Uniform and non-uniform motion",
      text: "An object moving along a straight line is in linear motion. If its speed stays the same, it is uniform linear motion. If its speed keeps changing, it is non-uniform linear motion. Most real motion is non-uniform, so distance ÷ time gives the average speed. A speedometer shows the speed at each moment and an odometer shows the distance travelled.",
      formula: "Average speed = total distance ÷ total time",
    },
  ],
  challenge: {
    title: "Clock maker",
    text: "Build three pendulum clocks. For each clock, set the length, release the bob and time 10 oscillations. The time period must be within 0.02 s of the target. One star per clock.",
  },
  quiz: [
    {
      q: "What is the SI unit of time?",
      options: ["Minute", "Hour", "Second", "Day"],
      answer: 2,
      why: "The SI unit of time is the second, written as s.",
    },
    {
      q: "A pendulum makes 20 oscillations in 32 s. What is its time period?",
      options: ["0.6 s", "1.6 s", "12 s", "640 s"],
      answer: 1,
      why: "Time period = total time ÷ number of oscillations = 32 ÷ 20 = 1.6 s.",
    },
    {
      q: "Which change will make a pendulum's time period longer?",
      options: ["A heavier bob", "A lighter bob", "A longer thread", "A shorter thread"],
      answer: 2,
      why: "The time period depends on the length of the thread. A longer thread swings more slowly.",
    },
    {
      q: "A bus covers 150 km in 3 hours. What is its speed?",
      options: ["50 km/h", "450 km/h", "153 km/h", "0.02 km/h"],
      answer: 0,
      why: "Speed = distance ÷ time = 150 km ÷ 3 h = 50 km/h.",
    },
    {
      q: "Rani runs 100 m in 20 s. Sohan runs 200 m in 50 s. Who is faster?",
      options: ["Sohan, because he ran farther", "Rani, because her speed is higher", "Both are equally fast", "We cannot tell"],
      answer: 1,
      why: "Rani: 100 ÷ 20 = 5 m/s. Sohan: 200 ÷ 50 = 4 m/s. Rani covers more distance every second.",
    },
    {
      q: "A car on a straight road covers exactly 10 m in every second. Its motion is…",
      options: ["Uniform linear motion", "Non-uniform linear motion", "Oscillatory motion", "Not motion at all"],
      answer: 0,
      why: "It moves in a straight line and covers equal distances in equal times, so its speed stays the same.",
    },
    {
      q: "Which old timekeeper uses the shadow of a stick?",
      options: ["Hourglass", "Water clock", "Sundial", "Pendulum clock"],
      answer: 2,
      why: "A sundial tells the time from where the Sun casts the shadow of its stick (gnomon).",
    },
  ],
};

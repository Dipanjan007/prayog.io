/**
 * Class 8 · Ganita Prakash Part 2 · Chapter "Proportional Reasoning-2".
 * Second lab for proportional reasoning: inverse proportion. Covers speed and
 * time on a fixed trip, workers and days on a fixed job, the product staying the
 * same, and how inverse proportion differs from direct proportion.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { Round } from "@/lib/sim/inverse";
import type { LessonDef } from "./types";

export const LESSON_ID = "c8-inverse-proportion";

/** Challenge: three deadlines, one star each. */
export const ROUNDS: Round[] = [
  {
    kind: "trip",
    name: "Lunch in Agra",
    brief: "Your family leaves Delhi at 9 am and has a lunch booking in Agra at 12 noon. The road is 240 km. Pick the steady speed that gets you there exactly on time.",
    from: "Delhi",
    to: "Agra",
    km: 240,
    hours: 3,
  },
  {
    kind: "job",
    name: "Wall for Independence Day",
    brief: "One mason alone would take 36 days to build the school's boundary wall. It must be done in exactly 4 days. How many masons?",
    job: { id: "boundary", name: "Boundary wall", emoji: "🧱", who: "masons", total: 36 },
    days: 4,
  },
  {
    kind: "job",
    name: "Hostel rice",
    brief: "The hostel's rice store would feed 8 students for 30 days. How many students can it feed for exactly 20 days?",
    job: { id: "rice", name: "Rice store", emoji: "🍚", who: "students", total: 240 },
    days: 20,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "road-tripper",
  classNum: 8,
  book: "Ganita Prakash Part 2",
  chapter: "Proportional Reasoning-2",
  title: "Faster car, shorter trip",
  intro: {
    objective:
      "Drive from Delhi to Agra at different speeds and share out a building job among workers. Find the number that never changes, and learn to tell inverse proportion from direct proportion.",
    learn: [
      "In inverse proportion, when one quantity doubles the other halves",
      "The product stays the same: speed × time = distance",
      "Workers × days stays the same for a fixed job",
      "How to tell direct proportion from inverse proportion",
    ],
    realLife:
      "Planning a trip, sharing a job among friends, working out how long the hostel's rice will last, or how many taps fill a tank fastest: all of these are inverse proportion.",
    minutes: 20,
  },
  hook: {
    title: "The road to the Taj",
    text:
      "Your family is driving from Delhi to the Taj Mahal in Agra, about 240 km away. Papa says, \"If we go twice as fast, we'll get there twice as early!\" Is he right? And what stays the same, however fast you drive?",
  },
  predict: {
    question: "At a steady 60 km/h the trip to Agra takes 4 hours. At a steady 120 km/h it takes:",
    options: ["8 hours", "2 hours", "3 hours"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:double",
      title: "Double the speed",
      text: "In Trip, drive to Agra at 40 km/h. Then drive again at 80 km/h. Compare the times.",
      found: "At 40 km/h the trip took 6 hours. At 80 km/h it took 3 hours. Doubling the speed halved the time.",
    },
    {
      id: "task:product",
      title: "What never changes?",
      text: "Drive the trip at three different speeds. Look at speed × time after each one.",
      found:
        "Every time, speed × time came to 240, the length of the road: 40 × 6 = 60 × 4 = 80 × 3 = 240. When one goes up, the other goes down so that their product stays the same. That is inverse proportion.",
    },
    {
      id: "task:wall",
      title: "Wall in 4 days",
      text: "Switch to Work. One worker would take 24 days to build the wall. Find how many workers finish it in exactly 4 days.",
      found:
        "6 workers × 4 days = 24 worker-days, the same as 1 worker × 24 days. To make the days 6 times fewer, you need 6 times as many workers.",
    },
    {
      id: "task:contrast",
      title: "Direct or inverse?",
      text: "In Work, set 2 workers, then 6 workers. Watch the bricks laid each day and the days the wall takes.",
      found:
        "Tripling the workers from 2 to 6 tripled the bricks laid each day, from 100 to 300: that is direct proportion. The days went from 12 to 4, one third as many: that is inverse proportion.",
    },
  ],
  discovery: {
    scientist: "Bhaskara II",
    years: "1114–1185",
    fact: "Bhaskara II's book Lilavati teaches arithmetic through puzzles. It has a rule called vyasta-trairashika, the inverse rule of three. One of its examples is grain: measure the same heap with a bigger pot and you get fewer potfuls.",
    formula: "new count = (old count × old size) ÷ new size",
    formulaNote: "A heap that fills 30 pots of 2 kg fills (30 × 2) ÷ 3 = 20 pots of 3 kg. The product, 60 kg, stays the same.",
  },
  symbols: [
    { sym: "s", meaning: "speed, in km/h" },
    { sym: "t", meaning: "time taken for the trip, in hours (h)" },
    { sym: "km/h", meaning: "kilometres per hour: how many km you go in one hour" },
    { sym: "x, y", meaning: "two quantities that change together" },
    { sym: "k", meaning: "the number that stays the same: the product x × y (or, for direct proportion, the ratio y ÷ x)" },
    { sym: "×", meaning: "times (multiply)" },
    { sym: "÷", meaning: "divided by" },
    { sym: "worker-days", meaning: "workers × days: the total amount of work in a job" },
  ],
  ideas: [
    {
      title: "Inverse proportion",
      text: "Two quantities are in inverse proportion when one is multiplied by a number and the other is divided by the same number. Double one and the other halves; triple one and the other becomes a third. Their product never changes.",
      formula: "x × y = k",
    },
    {
      title: "Speed and time on a fixed trip",
      text: "The road to Agra is 240 km whatever your speed, so speed × time is always 240. Faster means less time, slower means more time.",
      formula: "t = 240 ÷ s;  s × t = 240",
    },
    {
      title: "Workers and days",
      text: "A job needs a fixed amount of work. Share it among more workers and it takes fewer days. The same idea tells you how long a store of food lasts for more or fewer people.",
      formula: "workers × days = 24 worker-days;  4 × 6 = 6 × 4 = 8 × 3 = 24",
    },
    {
      title: "Direct or inverse?",
      text: "In direct proportion both go up together and the ratio stays the same: more workers lay more bricks each day. In inverse proportion one goes up as the other goes down and the product stays the same. Not every pair that changes together is either one: your age and height grow together but are not in proportion.",
      formula: "direct: y ÷ x = k;  inverse: x × y = k",
    },
  ],
  challenge: {
    title: "Beat the deadline",
    text: "A lunch booking, a wall for Independence Day and the hostel's rice store. Set the speed or the number of people, then go. The time stays hidden until you try. One star per deadline.",
  },
  quiz: [
    {
      q: "6 workers build a wall in 10 days. How long would 15 workers take?",
      options: ["25 days", "4 days", "5 days", "6 days"],
      answer: 1,
      why: "The job is 6 × 10 = 60 worker-days. With 15 workers it takes 60 ÷ 15 = 4 days.",
    },
    {
      q: "Which pair is in inverse proportion?",
      options: [
        "Number of pens bought and their cost",
        "Speed of a car and the time for a fixed trip",
        "Distance walked and time, at a steady speed",
        "Number of cupcakes and sugar needed",
      ],
      answer: 1,
      why: "On a fixed trip, speed × time = distance stays the same, so doubling the speed halves the time. The other three are direct proportion: both go up together.",
    },
    {
      q: "A train at 60 km/h takes 5 hours for a journey. How long at 75 km/h?",
      options: ["6¼ hours", "4 hours", "3 hours", "4½ hours"],
      answer: 1,
      why: "The journey is 60 × 5 = 300 km. At 75 km/h it takes 300 ÷ 75 = 4 hours.",
    },
    {
      q: "A hostel has rice for 40 students for 15 days. 10 more students join. How long will the rice last now?",
      options: ["12 days", "18¾ days", "10 days", "20 days"],
      answer: 0,
      why: "The rice is 40 × 15 = 600 student-days. With 50 students it lasts 600 ÷ 50 = 12 days.",
    },
    {
      q: "x and y are in inverse proportion. When x = 4, y = 9. What is y when x = 6?",
      options: ["13.5", "6", "11", "4"],
      answer: 1,
      why: "x × y = 4 × 9 = 36 always. So y = 36 ÷ 6 = 6.",
    },
  ],
};

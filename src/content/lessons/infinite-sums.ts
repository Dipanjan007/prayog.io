/**
 * Class 9 level · Outliers (Maths) · "Infinite sums".
 * Goes past the NCERT book: an endless sum can add up to a plain number.
 * Covers eating half the laddoo again and again (1/2 + 1/4 + 1/8 + ... = 1),
 * Zeno's runner and tortoise, the harmonic sum that grows forever, and the
 * geometric series a + ar + ar² + ... = a ÷ (1 − r).
 */
import type { SumRound } from "@/lib/sim/infinite-sums";
import type { LessonDef } from "./types";

export const LESSON_ID = "xm-infinite-sums";

/** Challenge: three endless sums. Predict where each settles, then watch it get there. One star each. */
export const SUM_ROUNDS: SumRound[] = [
  {
    name: "The bouncing ball",
    brief: "Each bounce of a ball goes half as high as the one before: 8 m, then 4 m, then 2 m, and so on. Add up all the heights.",
    a: 8,
    r: { p: 1, q: 2 },
    shown: "8 + 4 + 2 + 1 + 1/2 + ...",
  },
  {
    name: "The shrinking chai",
    brief: "Raju pours 6 cups of chai for the cricket team, then a third as much for the next batch, then a third of that, forever.",
    a: 6,
    r: { p: 1, q: 3 },
    shown: "6 + 2 + 2/3 + 2/9 + ...",
  },
  {
    name: "Ninety per cent each time",
    brief: "This one shrinks slowly: every term is 9/10 of the one before. Does it still settle? Where?",
    a: 1,
    r: { p: 9, q: 10 },
    shown: "1 + 0.9 + 0.81 + 0.729 + ...",
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "zeno-runner",
  classNum: 9,
  book: "Outliers",
  chapter: "Infinite sums",
  title: "Sums that never end",
  intro: {
    objective:
      "Eat half a laddoo again and again, race Zeno's tortoise, and add up endless lists of numbers. Find out which endless sums settle at a number and which grow forever.",
    learn: [
      "An endless sum can add up to a plain number: 1/2 + 1/4 + 1/8 + ... = 1",
      "Why the fast runner does catch the tortoise",
      "Some endless sums, like 1 + 1/2 + 1/3 + ..., grow past any number",
      "A geometric sum a + ar + ar² + ... settles at a ÷ (1 − r) when r is between −1 and 1",
    ],
    realLife:
      "A ball that bounces lower each time, a loan paid back in shrinking parts, the recurring decimal 0.333... and the way a calculator works out π all use endless sums.",
    minutes: 20,
  },
  hook: {
    title: "The endless laddoo",
    text:
      "Dadi gives you one laddoo with a rule: each time, you may eat only half of what is left. Half, then a quarter, then an eighth... You can keep going forever, so do you end up eating more than one laddoo? Or less? Let's find out.",
  },
  predict: {
    question: "You eat 1/2 of the laddoo, then 1/4, then 1/8, and keep halving forever. How much do you eat in all?",
    options: ["Exactly one whole laddoo", "More than one laddoo, because it never stops", "About three quarters of the laddoo"],
    answer: 0,
  },
  tasks: [
    {
      id: "task:laddoo",
      title: "Halve it again and again",
      text: "In Laddoo, take bite after bite until you have taken 10 bites. Watch how much is eaten and how much is left.",
      found:
        "After 10 bites you had eaten 1023/1024 of the laddoo, and only 1/1024 was left. Each bite eats half of what is left, so you get as close to 1 as you like but never go past it. The endless sum 1/2 + 1/4 + 1/8 + ... is exactly 1.",
    },
    {
      id: "task:zeno",
      title: "Zeno's race",
      text: "Switch to Zeno. The runner is 10 times faster but gives the tortoise a 100 m head start. Press Next stage at least 5 times.",
      found:
        "The stages took 10 s, 1 s, 0.1 s, 0.01 s... The stages never end, but their times add up to only 11.11... s. That is exactly when the runner draws level, at 111.1 m, and then he races past.",
    },
    {
      id: "task:grow",
      title: "Grow or settle?",
      text: "In Grow or settle, add more and more terms. Push the Harmonic sum past 5, and take Halves to at least 20 terms.",
      found:
        "Halves got stuck just under 2, no matter how many terms you added. Harmonic needed 83 terms to pass 5, but it kept going: its terms shrink too slowly, so it grows past any number you name.",
    },
    {
      id: "task:geo",
      title: "Build your own",
      text: "In Geometric, choose a first term a and a ratio r so the endless sum settles at exactly 6. Then try r = 1 or more.",
      found:
        "a ÷ (1 − r) told you where each sum settles, like 3 ÷ (1 − 1/2) = 6. With r of 1 or more the terms never shrink, so the sum just keeps growing.",
    },
  ],
  discovery: {
    scientist: "Madhava of Sangamagrama",
    years: "about 1340–1425",
    fact: "Madhava, a mathematician from Kerala, found endless sums for π and for sine and cosine, more than 250 years before European mathematicians found them again. Later mathematicians of his Kerala school wrote them down with proofs, in books such as the Yuktibhasha.",
    formula: "π ÷ 4 = 1 − 1/3 + 1/5 − 1/7 + ...",
    formulaNote: "Add and take away the odd fractions forever, and you get closer and closer to π ÷ 4.",
  },
  symbols: [
    { sym: "...", meaning: "and so on forever, following the same pattern" },
    { sym: "a", meaning: "the first term of a geometric sum" },
    { sym: "r", meaning: "the ratio: each term is r times the one before" },
    { sym: "ar², rⁿ", meaning: "powers: r² = r × r, and rⁿ is r multiplied by itself n times" },
    { sym: "n", meaning: "how many terms are added" },
    { sym: "S", meaning: "the number an endless sum settles at" },
    { sym: "÷", meaning: "divided by; 1/2 also means 1 ÷ 2" },
    { sym: "π", meaning: "pi: a circle's distance round divided by its distance across, about 3.14" },
    { sym: "<, >", meaning: "is less than, is more than; −1 < r < 1 means r is between −1 and 1" },
    { sym: "m, s", meaning: "metres and seconds" },
    { sym: "−", meaning: "minus: take away" },
  ],
  ideas: [
    {
      title: "An endless sum can be a plain number",
      text: "Each new bite of the laddoo is half of what is left, so after n bites only (1/2)ⁿ is left. That gap shrinks towards zero, so the endless sum is exactly 1, not a bit less. Mathematicians say the sum settles (or converges) at 1.",
      formula: "1/2 + 1/4 + 1/8 + 1/16 + ... = 1",
    },
    {
      title: "Zeno's puzzle, solved",
      text: "Zeno of Elea, about 2,500 years ago, argued that a runner can never catch a tortoise: every time he reaches where it was, it has moved on. But the endless list of stage times adds up to a finite time. The runner gains 9 m every second, so he closes a 100 m gap in 100 ÷ 9 = 11.11... s.",
      formula: "10 + 1 + 0.1 + 0.01 + ... = 10 ÷ (1 − 0.1) = 11.11... s",
    },
    {
      title: "Some sums grow forever",
      text: "Shrinking terms are not enough. In 1 + 1/2 + 1/3 + 1/4 + ..., group the terms: 1/3 + 1/4 is more than 1/2, and 1/5 + 1/6 + 1/7 + 1/8 is more than 1/2 too. You can make endless groups each bigger than 1/2, so the sum grows past any number, though very slowly.",
      formula: "1 + 1/2 + (1/3 + 1/4) + (1/5 + ... + 1/8) + ...   each bracket > 1/2",
    },
    {
      title: "The geometric sum",
      text: "When each term is r times the one before, the endless sum settles if r is between −1 and 1, at S = a ÷ (1 − r). If r is 1 or more, the terms never shrink, so the sum grows forever.",
      formula: "S = a + ar + ar² + ... = a ÷ (1 − r)   (when −1 < r < 1)",
    },
  ],
  challenge: {
    title: "Where does it settle?",
    text: "Three endless sums. Use a ÷ (1 − r) to predict where each one settles, type your answer, then watch the sum creep up to it. One star per sum.",
  },
  quiz: [
    {
      q: "Where does the endless sum 1/3 + 1/9 + 1/27 + ... settle?",
      options: ["1/3", "1/2", "1", "It grows forever"],
      answer: 1,
      why: "a = 1/3 and r = 1/3, so S = (1/3) ÷ (1 − 1/3) = (1/3) ÷ (2/3) = 1/2.",
    },
    {
      q: "What happens to 1 + 1/2 + 1/3 + 1/4 + 1/5 + ... as you add more and more terms?",
      options: ["It settles at 2", "It settles at about 3", "It grows past any number", "It settles at 1"],
      answer: 2,
      why: "This is the harmonic sum. It grows very slowly (83 terms just to pass 5), but grouping the terms into brackets each bigger than 1/2 shows it never stops growing.",
    },
    {
      q: "0.999... (nines forever) is the endless sum 9/10 + 9/100 + 9/1000 + ... What is it equal to?",
      options: ["A tiny bit less than 1", "Exactly 1", "0.9", "It grows forever"],
      answer: 1,
      why: "a = 9/10 and r = 1/10, so S = (9/10) ÷ (1 − 1/10) = (9/10) ÷ (9/10) = 1. So 0.999... is exactly 1.",
    },
    {
      q: "A ball is dropped from 10 m. Each bounce goes back up half as high as the fall before. How far does it travel in all, up and down?",
      options: ["20 m", "25 m", "30 m", "It travels forever"],
      answer: 2,
      why: "It falls 10 m, then goes up and down 5 m, 2.5 m, 1.25 m... The bounces add up to 5 ÷ (1 − 1/2) = 10 m, and each is travelled twice. Total = 10 + (2 × 10) = 30 m.",
    },
    {
      q: "Which of these endless sums settles at a number?",
      options: ["1 + 2 + 4 + 8 + ...", "1 + 1 + 1 + 1 + ...", "5 + 0.5 + 0.05 + 0.005 + ...", "1 + 1/2 + 1/3 + 1/4 + ..."],
      answer: 2,
      why: "Only 5 + 0.5 + 0.05 + ... has a ratio r = 1/10 between −1 and 1. It settles at 5 ÷ (1 − 1/10) = 5 ÷ 0.9 = 5.555... The others keep growing.",
    },
  ],
};

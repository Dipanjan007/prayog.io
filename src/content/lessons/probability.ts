/**
 * Class 9 · Ganita Manjari · Part I Chapter 7 "The Mathematics of Maybe: Introduction to Probability".
 * Covers experimental probability from many coin tosses, die rolls, spins and marble draws,
 * theoretical probability for equally likely outcomes, how the two meet as the number of trials
 * grows, the sum of two dice, and building a bag or spinner with given chances.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { BuildTarget } from "@/lib/sim/probability";
import type { LessonDef } from "./types";

export const LESSON_ID = "c9-probability";

/** Challenge: three mela game stalls, one star each. Fractions are P(red), P(blue), P(green). */
export const STALLS: BuildTarget[] = [
  {
    name: "Coconut prize bag",
    brief: "The stall owner wants a bag where red and blue each come out 1 time in 4, and green comes out half the time.",
    kind: "bag",
    target: [
      [1, 4],
      [1, 4],
      [1, 2],
    ],
  },
  {
    name: "Bangle lucky dip",
    brief: "Now red must come out half the time, blue 1 time in 3 and green 1 time in 6.",
    kind: "bag",
    target: [
      [1, 2],
      [1, 3],
      [1, 6],
    ],
  },
  {
    name: "Giant wheel spinner",
    brief: "A spinner with up to 12 equal sectors. Red must win 1 time in 4, blue 1 time in 6, and green the rest of the time.",
    kind: "spinner",
    target: [
      [1, 4],
      [1, 6],
      [7, 12],
    ],
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "chance-champ",
  classNum: 9,
  book: "Ganita Manjari",
  chapter: "The Mathematics of Maybe: Introduction to Probability",
  title: "Toss, roll, spin and draw",
  intro: {
    objective:
      "Toss coins, roll dice, spin a spinner and draw marbles from a bag, thousands of times in seconds. Watch the results wobble at first and then settle on the chance you can work out on paper. Then build fair-or-not mela games with exact chances.",
    learn: [
      "Experimental probability: (times it happened) ÷ (number of trials)",
      "Theoretical probability for equally likely outcomes: (favourable outcomes) ÷ (all outcomes)",
      "Why many trials bring the two close together",
      "Why 7 is the most likely total with two dice",
    ],
    realLife:
      "Weather forecasts say \"70% chance of rain\". Cricket analysts quote a batter's chance of hitting a boundary. Board games like Ludo and Snakes and Ladders are all about dice chances.",
    minutes: 20,
  },
  hook: {
    title: "Heads or tails at the IPL",
    text:
      "Before every IPL match, the captains toss a coin. Some fans say their captain \"always loses the toss\". Is a coin really fair? Tossing one 1000 times by hand would take hours. In this lab you can do it in a second, and find out what \"a 1 in 2 chance\" really means.",
  },
  predict: {
    question: "You toss a fair coin 1000 times. How many heads will you get?",
    options: ["Exactly 500, every time", "Close to 500, but rarely exactly 500", "Any number from 0 to 1000 is just as likely"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:coin",
      title: "A thousand tosses",
      text: "Pick Coin. Toss 10 times and look at the frequency of heads. Then keep tossing until you pass 1000 tosses.",
      found:
        "After 10 tosses the share of heads can be far from 1/2, like 0.3 or 0.7. After 1000 tosses it settled close to 0.5, but the number of heads was not exactly 500. More trials bring the experimental probability close to the theoretical 1/2.",
    },
    {
      id: "task:die",
      title: "Six faces, one chance each",
      text: "Pick Die and roll it at least 600 times. Compare each bar with the dashed line at 1/6.",
      found:
        "Every face came up about 100 times in 600 rolls, so each frequency was close to 1/6 ≈ 0.167. A die has 6 equally likely faces, so P(any one face) = 1/6.",
    },
    {
      id: "task:unequal",
      title: "Not all outcomes are equal",
      text: "Spin the Spinner 500 times, then draw from the Bag 500 times. Red takes up half the spinner, and 5 of the 10 marbles are red.",
      found:
        "Red came up about half the time on both. On the spinner red covers 2 of 4 equal quarters; in the bag 5 of 10 marbles are red. Count the equally likely pieces: P(red) = 2/4 = 5/10 = 1/2, while blue in the bag is only 3/10.",
    },
    {
      id: "task:sum",
      title: "Lucky number 7",
      text: "Pick Two dice and roll until 7 is clearly the most common total (at least 1000 rolls).",
      found:
        "7 came up more than any other total, about 1 time in 6. Of the 36 equally likely pairs, six make 7 (1+6, 2+5, 3+4, 4+3, 5+2, 6+1), but only one makes 2 and only one makes 12.",
    },
  ],
  discovery: {
    scientist: "Jacob Bernoulli",
    years: "1655–1705",
    fact: "Bernoulli spent about 20 years proving that with enough trials the experimental frequency gets as close as you like to the true probability. He called it his \"golden theorem\". His book Ars Conjectandi (The Art of Guessing) came out in 1713, eight years after he died. Today we call it the law of large numbers.",
    formula: "(times it happened) ÷ (number of trials) → P(E)",
    formulaNote: "As the number of trials grows, the experimental probability settles on the theoretical probability.",
  },
  symbols: [
    { sym: "P(E)", meaning: "the probability of the event E, a number from 0 (impossible) to 1 (certain)" },
    { sym: "E", meaning: "an event, like \"getting heads\" or \"rolling a 6\"" },
    { sym: "a/b", meaning: "a fraction, a out of b; the same as a ÷ b. 1/6 means 1 out of 6" },
    { sym: "÷", meaning: "divided by" },
    { sym: "×", meaning: "times; 6 × 6 = 36 pairs for two dice" },
    { sym: "−", meaning: "minus; 1 − 0.7 = 0.3" },
    { sym: "→", meaning: "gets closer and closer to" },
    { sym: "≈", meaning: "is about equal to" },
    { sym: "%", meaning: "per cent, out of 100; 70% = 0.7" },
  ],
  ideas: [
    {
      title: "Experimental probability",
      text: "Do an experiment many times and count. If you toss a coin 200 times and get 94 heads, the experimental probability of heads is 94 ÷ 200 = 0.47. It changes a little every time you repeat the experiment.",
      formula: "P(E) ≈ (times E happened) ÷ (number of trials)",
    },
    {
      title: "Theoretical probability",
      text: "When all outcomes are equally likely, count them. A die has 6 faces, and 2 of them (5 and 6) are more than 4, so P(more than 4) = 2/6 = 1/3. Probabilities are always between 0 and 1, and P(not E) = 1 − P(E).",
      formula: "P(E) = (favourable outcomes) ÷ (all outcomes)",
    },
    {
      title: "More trials, less wobble",
      text: "In 10 tosses, 7 heads is quite normal. In 1000 tosses, 700 heads would be very strange. The more trials you do, the closer the experimental probability usually gets to the theoretical one. That is why we trust a forecast built from many years of weather data.",
      formula: "more trials → experimental P closer to theoretical P",
    },
    {
      title: "Two dice and the number 7",
      text: "Two dice give 6 × 6 = 36 equally likely pairs. Six pairs add up to 7, five make 6 and five make 8, but only one makes 2 (1+1) and only one makes 12 (6+6). There are 11 possible totals, yet they are not equally likely.",
      formula: "P(total 7) = 6 ÷ 36 = 1/6",
    },
  ],
  challenge: {
    title: "Mela game stalls",
    text: "Three stall owners at the mela want games with exact chances. Add and remove marbles or spinner sectors until the chances match, then check. One star per stall.",
  },
  quiz: [
    {
      q: "A bag has 3 red and 5 blue marbles. You pick one without looking. What is P(red)?",
      options: ["3/5", "3/8", "5/8", "1/3"],
      answer: 1,
      why: "There are 3 + 5 = 8 marbles, all equally likely, and 3 are red. P(red) = 3 ÷ 8 = 3/8.",
    },
    {
      q: "You roll one die. What is the probability of a number greater than 4?",
      options: ["1/6", "1/3", "1/2", "2/3"],
      answer: 1,
      why: "Only 5 and 6 are greater than 4: 2 of the 6 faces. P = 2/6 = 1/3.",
    },
    {
      q: "You roll two dice and add them. What is the probability that the total is 7?",
      options: ["1/12", "1/11", "1/6", "7/36"],
      answer: 2,
      why: "There are 6 × 6 = 36 equally likely pairs and 6 of them add to 7. P = 6 ÷ 36 = 1/6. The 11 totals are not equally likely, so 1/11 is wrong.",
    },
    {
      q: "The forecast says the chance of rain tomorrow is 0.7. What is the chance it does not rain?",
      options: ["0.7", "0.3", "1.7", "0"],
      answer: 1,
      why: "P(not E) = 1 − P(E) = 1 − 0.7 = 0.3.",
    },
    {
      q: "Riya tosses a coin 10 times and Arjun tosses one 1000 times. Whose share of heads is likely to be closer to 1/2?",
      options: ["Riya's", "Arjun's", "Both are always exactly 1/2", "Neither; coins have no pattern at all"],
      answer: 1,
      why: "With more trials the experimental probability usually settles closer to the theoretical one. Riya might easily get 7 heads in 10 (0.7); Arjun's share will almost surely be close to 0.5.",
    },
  ],
};

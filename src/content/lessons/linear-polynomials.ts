/**
 * Class 9 · Ganita Manjari (Part 1, 2026-27) · Chapter 2 "Introduction to Linear Polynomials".
 * Covers p(x) = ax + b, what a and b do to its straight-line graph, the zero of a
 * linear polynomial (−b ÷ a, where the line crosses the x-axis), why a ≠ 0, and an
 * auto or taxi fare as base fare + (rate × km).
 * Ganita Manjari is new for 2026-27: recheck wording against the NCERT chapter PDF.
 */
import type { FareChart } from "@/lib/sim/linear";
import type { LessonDef } from "./types";

export const LESSON_ID = "c9-linear-polynomials";

/** Challenge: three printed fare charts. Set the meter so every row matches, one star each. */
export const FARE_CHARTS: FareChart[] = [
  {
    name: "Auto stand chart",
    brief: "The chart at the auto stand says: 2 km costs ₹50, 4 km costs ₹80 and 6 km costs ₹110. Set the meter's rate and base fare to match.",
    points: [
      { km: 2, fare: 50 },
      { km: 4, fare: 80 },
      { km: 6, fare: 110 },
    ],
  },
  {
    name: "Airport taxi",
    brief: "The airport taxi card says: 1 km costs ₹45, 5 km costs ₹125 and 10 km costs ₹225. Find its rate per km and its base fare.",
    points: [
      { km: 1, fare: 45 },
      { km: 5, fare: 125 },
      { km: 10, fare: 225 },
    ],
  },
  {
    name: "E-rickshaw",
    brief: "An e-rickshaw driver charges ₹51 for 3 km, ₹79 for 7 km and ₹100 for 10 km. What meter is he using?",
    points: [
      { km: 3, fare: 51 },
      { km: 7, fare: 79 },
      { km: 10, fare: 100 },
    ],
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "fare-finder",
  classNum: 9,
  book: "Ganita Manjari",
  chapter: "Introduction to Linear Polynomials",
  title: "The auto fare line",
  intro: {
    objective:
      "Build an auto-rickshaw fare meter from a base fare and a rate per km, and watch its graph come out as a straight line. Then explore any ax + b and find its zero, the point where the line crosses the x-axis.",
    learn: [
      "A linear polynomial has the form ax + b, with a ≠ 0",
      "a sets how steep the line is; b sets where it meets the y-axis",
      "The zero of ax + b is x = −b ÷ a, where the graph crosses the x-axis",
      "How to read a fare chart and find the rate and the base fare",
    ],
    realLife:
      "Auto and taxi meters, mobile data packs with a fixed charge plus a price per GB, electricity bills with a fixed charge plus a rate per unit, and a plumber's call-out fee plus a rate per hour all follow ax + b.",
    minutes: 20,
  },
  hook: {
    title: "The meter that never lies",
    text:
      "You hop into an auto. Before it even moves, the meter shows ₹30. Then it adds ₹15 for every km. Your friend says a 4 km ride costs ₹90, so an 8 km ride must cost ₹180. Is your friend right? Let's build the meter and see.",
  },
  predict: {
    question: "The meter starts at ₹30 and adds ₹15 per km, so 4 km costs ₹90. What does an 8 km ride cost?",
    options: ["₹180, double the 4 km fare", "₹150", "₹120"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:knobs",
      title: "Turn one knob at a time",
      text: "In Fare, change only the rate per km and watch the line. Then change only the base fare and watch again.",
      found:
        "A bigger rate made the line steeper, but it still started at the same base fare on the ₹ axis. A bigger base fare lifted the whole line up without changing its slant. The rate is the a in ax + b, and the base fare is the b.",
    },
    {
      id: "task:fare",
      title: "Price a 4 km ride",
      text: "Set the base fare to ₹30 and the rate to ₹15 per km. Then set the ride to 4 km and read the fare.",
      found:
        "The meter showed ₹90, because 30 + (15 × 4) = 30 + 60 = 90. The fare is the linear polynomial 15x + 30, where x is the number of km. An 8 km ride is 30 + (15 × 8) = 150, not double ₹90, because the base fare is paid only once.",
    },
    {
      id: "task:zero",
      title: "Cross at x = 3",
      text: "Switch to Graph. Make a line that crosses the x-axis at x = 3. Try 2x − 6 first, then find a different one.",
      found:
        "Lines like 2x − 6, x − 3 and −x + 3 all crossed at x = 3. At that point the value of the polynomial is 0, so x = 3 is its zero. For 2x − 6: 2x − 6 = 0, so 2x = 6 and x = 6 ÷ 2 = 3.",
    },
    {
      id: "task:flat",
      title: "What if a = 0?",
      text: "In Graph, set a to 0 and keep b not 0. Does the line still have a zero?",
      found:
        "With a = 0 the line went flat. The polynomial became just the number b, which is never 0, so the line never meets the x-axis. That is why a linear polynomial must have a ≠ 0.",
    },
  ],
  discovery: {
    scientist: "Brahmagupta",
    years: "598–668 CE",
    fact: "In his book Brahmasphutasiddhanta (628 CE), Brahmagupta gave rules for working with zero and negative numbers, which he called debts, and a rule for solving an equation in one unknown. He called the unknown yavat-tavat, meaning 'as much as so much'.",
    formula: "ax + b = 0   ⇒   x = −b ÷ a",
    formulaNote: "The zero of a linear polynomial: the one value of x that makes ax + b equal to 0.",
  },
  symbols: [
    { sym: "x", meaning: "the variable: here, the number of km you ride, or any number on the x-axis" },
    { sym: "p(x)", meaning: "a polynomial named p, worked out for a value of x; p(4) means put x = 4" },
    { sym: "a", meaning: "the number multiplying x: the rate in ₹ per km, and how steep the line is" },
    { sym: "b", meaning: "the number on its own: the base fare in ₹, and where the line meets the y-axis" },
    { sym: "≠", meaning: "is not equal to; a ≠ 0 means a is not zero" },
    { sym: "⇒", meaning: "so, or which gives" },
    { sym: "−b ÷ a", meaning: "the zero of ax + b: change the sign of b, then divide by a" },
    { sym: "k₁, k₂ and f₁, f₂", meaning: "two rides from a fare chart: their km and their fares in ₹" },
    { sym: "₹, km", meaning: "rupees and kilometres" },
  ],
  ideas: [
    {
      title: "Linear polynomials",
      text: "A linear polynomial is ax + b, where a and b are numbers and a is not 0. The highest power of x is 1, so x is never squared. 15x + 30, 2x − 6 and 5 − x are all linear. x² + 1 is not, and the number 7 on its own is not either.",
      formula: "p(x) = ax + b,   a ≠ 0",
    },
    {
      title: "What a and b do",
      text: "The graph of ax + b is always a straight line. a is how much p(x) goes up when x goes up by 1, so a bigger a makes a steeper line, and a negative a makes it slope down. b is the value when x = 0, so the line meets the y-axis at b. In a fare, a is the rate and b is the base fare.",
      formula: "fare = b + (a × km)",
    },
    {
      title: "The zero of a linear polynomial",
      text: "A zero is a value of x that makes p(x) = 0. On the graph it is where the line crosses the x-axis. Every linear polynomial has exactly one zero. To find it, set ax + b = 0 and solve: ax = −b, so x = −b ÷ a.",
      formula: "ax + b = 0   ⇒   x = −b ÷ a",
    },
    {
      title: "Reading a fare chart",
      text: "Two rows of a chart are enough. The rate is the change in fare divided by the change in km. Then take away (rate × km) from either fare to get the base fare. For 2 km ₹50 and 4 km ₹80: rate = (80 − 50) ÷ (4 − 2) = 30 ÷ 2 = 15, and base = 50 − (15 × 2) = 20.",
      formula: "a = (f₂ − f₁) ÷ (k₂ − k₁);   b = f₁ − (a × k₁)",
    },
  ],
  challenge: {
    title: "Match the fare charts",
    text: "Three printed fare charts, three secret meters. Set the rate per km and the base fare so the line passes through every row of the chart, then check the meter. One star per chart.",
  },
  quiz: [
    {
      q: "What is the zero of p(x) = 3x − 12?",
      options: ["−4", "3", "4", "12"],
      answer: 2,
      why: "3x − 12 = 0, so 3x = 12 and x = 12 ÷ 3 = 4. Check: p(4) = (3 × 4) − 12 = 0.",
    },
    {
      q: "A taxi charges a base fare of ₹40 and ₹12 per km. What is the fare for 5 km?",
      options: ["₹100", "₹260", "₹92", "₹57"],
      answer: 0,
      why: "fare = 40 + (12 × 5) = 40 + 60 = ₹100. The base fare is added only once.",
    },
    {
      q: "Which of these is a linear polynomial?",
      options: ["x² + 1", "5 − 2x", "7", "x³ − x"],
      answer: 1,
      why: "5 − 2x is −2x + 5: a = −2, which is not 0, and the highest power of x is 1. x² + 1 and x³ − x have higher powers, and 7 has no x at all.",
    },
    {
      q: "A fare chart says 2 km costs ₹50 and 5 km costs ₹95. What is the rate per km?",
      options: ["₹15", "₹19", "₹25", "₹45"],
      answer: 0,
      why: "rate = (95 − 50) ÷ (5 − 2) = 45 ÷ 3 = ₹15 per km. The base fare is 50 − (15 × 2) = ₹20.",
    },
    {
      q: "Which is true about the graph of p(x) = −2x + 8?",
      options: [
        "It slopes down and crosses the x-axis at x = 4",
        "It slopes up and crosses the x-axis at x = 4",
        "It slopes down and crosses the x-axis at x = −4",
        "It is a flat line",
      ],
      answer: 0,
      why: "a = −2 is negative, so the line slopes down. The zero is −b ÷ a = −8 ÷ (−2) = 4.",
    },
  ],
};

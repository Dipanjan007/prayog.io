/**
 * Maths Olympiad, set 5: counting.
 * Original problems. Answers come from src/lib/sim/oly-count.ts, which lists every object one by one.
 */
import { gridRoutes, orderedPairs, sizeForCount, unorderedPairs, type CountListScene } from "@/lib/sim/oly-count";
import { isWhole } from "@/lib/sim/oly-number";
import type { OlyProblem } from "./types";

/** Arjun, Bhavna, Chirag, Divya, Eshan and Farah, by first letter. */
const BATTERS = ["A", "B", "C", "D", "E", "F"];
const MATCHES = 45;
const FLOOD: [number, number] = [2, 2];

/** The league: your number of teams plays every pairing once, and the story says 45 matches. */
function league(n: number): CountListScene {
  const base = { kind: "count-list" as const, slots: MATCHES, slotsFrom: "story" as const, word: ["match", "matches"] as [string, string], heading: `${MATCHES} matches in the fixture list` };
  if (!isWhole(n) || n < 2) return { ...base, items: [], invalid: `A league needs a whole number of teams, at least 2, not ${Number(n.toPrecision(4))}.` };
  return { ...base, items: unorderedPairs(Math.round(n)) };
}

export const MATHS_COUNTING_PROBLEMS: OlyProblem[] = [
  {
    id: "opening-pair",
    set: "counting",
    level: "warm-up",
    title: "Picking the opening pair",
    emoji: "🏏",
    story: [
      "The Class 8 cricket team in Pune has six batters who can open: Arjun, Bhavna, Chirag, Divya, Eshan and Farah. Before each match the coach picks two of them to open.",
      "One opener is the striker, who faces the first ball, and the other is the non-striker. Arjun on strike with Bhavna at the other end is different from Bhavna on strike with Arjun.",
    ],
    given: ["6 batters who can open", "Choose a striker and a non-striker", "The same batter cannot fill both places"],
    ask: "How many different opening pairs, striker first, can the coach choose?",
    answer: orderedPairs(BATTERS).length,
    symbol: "N =",
    unit: "pairs",
    range: [1, 100],
    hints: ["Fill the striker's place first. How many choices are there? Then how many are left for the non-striker?", "For 'this and then that' choices, multiply the numbers of choices."],
    solution: [
      { text: "Any of the 6 batters can be the striker.", math: "striker: 6 choices" },
      { text: "The non-striker is one of the other 5.", math: "non-striker: 5 choices" },
      { text: "Each striker goes with each of 5 partners, so multiply.", math: "N = 6 × 5 = 30" },
      { text: "If the order did not matter, each pair would be counted twice, giving 30 ÷ 2 = 15. Here the order matters, so it is 30." },
    ],
    scene: (k) => ({ kind: "count-list", items: orderedPairs(BATTERS), slots: k, slotsFrom: "answer", word: ["pair", "pairs"], heading: "Striker–non-striker, by first letter" }),
    simNote: "The sim lists every striker–non-striker pair, A–B for Arjun and Bhavna and so on, and drops each into a slot of your count.",
  },
  {
    id: "school-league",
    set: "counting",
    level: "standard",
    title: "How many teams in the league?",
    emoji: "🏆",
    story: [
      "Schools in Jaipur run a winter cricket league. Every team plays every other team exactly once, and there are no other matches.",
      "The printed fixture list has 45 matches on it. The organiser has forgotten how many teams signed up.",
    ],
    given: ["Every team plays every other team once", "45 matches in all"],
    ask: "How many teams are in the league?",
    answer: sizeForCount((n) => unorderedPairs(n).length, MATCHES),
    symbol: "n =",
    unit: "teams",
    range: [2, 60],
    hints: [
      "With n teams, each team plays n − 1 matches. Multiply, but each match has two teams, so you have counted it twice.",
      "Matches = [n × (n − 1)] ÷ 2 = 45, so n × (n − 1) = 90. Which two numbers in a row multiply to 90?",
    ],
    solution: [
      { text: "Each of the n teams plays the other n − 1 teams. That counts every match twice, once for each team in it.", math: "matches = [n × (n − 1)] ÷ 2" },
      { text: "Set it equal to the fixture list.", math: "[n × (n − 1)] ÷ 2 = 45  ⇒  n × (n − 1) = 90" },
      { text: "Look for two whole numbers in a row with a product of 90.", math: "10 × 9 = 90  ⇒  n = 10" },
      { text: "Check: 10 teams make C(10, 2) = 45 pairs.", math: "C(10, 2) = (10 × 9) ÷ 2 = 45" },
    ],
    scene: league,
    simNote: "The sim lists every pairing of your number of teams (1v2, 1v3 and so on) and fits them into the 45 slots of the fixture list.",
  },
  {
    id: "flooded-crossing",
    set: "counting",
    level: "olympiad",
    title: "Round the flooded crossing",
    emoji: "🌧️",
    story: [
      "Pooja walks from her home to the temple through a neat grid of lanes in her old Kolkata neighbourhood. The temple is 5 blocks east and 4 blocks north of her home, and she only ever walks east or north.",
      "After a monsoon downpour, the crossing 2 blocks east and 2 blocks north of her home is under knee-deep water, so she must not pass through it.",
    ],
    given: ["Temple: 5 blocks east, 4 blocks north", "Each step is one block east (E) or north (N)", "Flooded crossing: 2 east, 2 north"],
    ask: "How many different routes can Pooja take?",
    answer: gridRoutes(5, 4, FLOOD).length,
    symbol: "N =",
    unit: "routes",
    range: [1, 500],
    hints: [
      "Every route is 9 steps: 5 E and 4 N in some order. Count all routes first, then take away the ones through the water.",
      "A route through the flood goes 2 E and 2 N to reach it, then 3 E and 2 N to the temple. Multiply the ways for the two halves.",
    ],
    solution: [
      { text: "A route is a string of 9 letters with 5 E and 4 N. Choose which 4 of the 9 steps are N.", math: "all routes = C(9, 4) = (9 × 8 × 7 × 6) ÷ (4 × 3 × 2 × 1) = 126" },
      { text: "Routes to the flooded crossing: 2 E and 2 N in some order.", math: "C(4, 2) = 6" },
      { text: "From the crossing to the temple: 3 E and 2 N.", math: "C(5, 2) = 10" },
      { text: "Every first half joins every second half, so multiply, then take these away.", math: "through the water = 6 × 10 = 60  ⇒  N = 126 − 60 = 66" },
    ],
    scene: (k) => ({ kind: "count-list", items: gridRoutes(5, 4, FLOOD), slots: k, slotsFrom: "answer", word: ["route", "routes"], heading: "Dry routes, E and N", grid: { w: 5, h: 4, blocked: FLOOD } }),
    simNote: "The sim walks every dry route on the map, one after another, and drops each into a slot of your count. Routes are written as E and N steps.",
  },
];

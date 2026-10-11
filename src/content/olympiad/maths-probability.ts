/**
 * Maths Olympiad, set 6: probability. Every answer is a count of equally likely outcomes, listed one by one.
 * Original problems. Answers come from src/lib/sim/oly-count.ts, the same code the sim runs.
 */
import { chanceOf, diceGrid, drawTwoGrid, tossGrid } from "@/lib/sim/oly-count";
import type { OlyProblem } from "./types";

const DICE = diceGrid((a, b) => (a * b) % 2 === 0);
/** Three mango (M) and two imli (I) toffees. */
const JAR = drawTwoGrid(["M1", "M2", "M3", "I1", "I2"], (a, b) => a[0] === b[0]);
const TOSSES = tossGrid(5, 4, (seq) => seq.includes("WWW"));

export const MATHS_PROBABILITY_PROBLEMS: OlyProblem[] = [
  {
    id: "even-product-dice",
    set: "probability",
    level: "warm-up",
    title: "An even product on two dice",
    emoji: "🎲",
    story: [
      "On a rainy afternoon in Kochi, Meenu and her cousins invent a dice game. On your turn you roll two ordinary dice and multiply the two numbers.",
      "If the product is even, you move your token forward. If it is odd, you stay where you are.",
    ],
    given: ["Two fair six-sided dice, numbered 1 to 6", "Move if the product of the two numbers is even"],
    ask: "What is the probability that Meenu moves on her turn? Give it as a decimal.",
    answer: chanceOf(DICE.cells).p,
    symbol: "p =",
    unit: "(no unit)",
    range: [0.001, 1],
    hints: ["List the outcomes as (first die, second die). How many are there? It is easier to count when the product is odd.", "A product is odd only when both numbers are odd. Each die has 3 odd numbers."],
    solution: [
      { text: "Each die shows 1 to 6, so there are 6 × 6 equally likely outcomes.", math: "total = 6 × 6 = 36" },
      { text: "The product is odd only if both dice are odd: 1, 3 or 5 on each.", math: "odd products = 3 × 3 = 9" },
      { text: "Every other outcome has an even product.", math: "even products = 36 − 9 = 27" },
      { text: "Probability = favourable ÷ total.", math: "p = 27 ÷ 36 = 3 ÷ 4 = 0.75" },
    ],
    scene: (p) => ({ kind: "count-chance", ...DICE, event: "an even product", p }),
    simNote: "The sim shows all 36 rolls as a grid, first die down the side and second die along the top, and lights up the rolls with an even product.",
  },
  {
    id: "toffee-jar",
    set: "probability",
    level: "standard",
    title: "Two toffees from Nani's jar",
    emoji: "🍬",
    story: [
      "Nani keeps a small jar of toffees on her shelf in Lucknow. Today it holds 3 mango toffees and 2 imli toffees, all in the same wrapper.",
      "Riya reaches in without looking and takes one toffee, then a second one. She does not put the first one back.",
    ],
    given: ["3 mango toffees, 2 imli toffees", "Two picks, one after the other, without putting back"],
    ask: "What is the probability that both toffees are the same flavour? Give it as a decimal.",
    answer: chanceOf(JAR.cells).p,
    symbol: "p =",
    unit: "(no unit)",
    range: [0.001, 1],
    hints: [
      "Name the toffees M1, M2, M3, I1, I2 so that they are all different. Count the ordered picks (first, second): the first can be any of 5, the second any of the 4 left.",
      "Same flavour means mango then mango, or imli then imli. Count each and add.",
    ],
    solution: [
      { text: "With every toffee named, all ordered picks are equally likely.", math: "total = 5 × 4 = 20" },
      { text: "Mango then mango: 3 choices first, then 2.", math: "3 × 2 = 6" },
      { text: "Imli then imli: 2 choices first, then 1.", math: "2 × 1 = 2" },
      { text: "Add the two cases and divide by the total.", math: "p = (6 + 2) ÷ 20 = 8 ÷ 20 = 0.4" },
      { text: "A common slip is to say 'three cases: both mango, both imli, one of each', so 2 ÷ 3. Those cases are not equally likely, which is why we name every toffee." },
    ],
    scene: (p) => ({ kind: "count-chance", ...JAR, event: "the same flavour twice", p }),
    simNote: "The sim shows every (first, second) pick as a grid. The diagonal is greyed out because the same toffee cannot be picked twice. Same-flavour picks light up.",
  },
  {
    id: "captain-tosses",
    set: "probability",
    level: "olympiad",
    title: "Three tosses in a row",
    emoji: "🪙",
    story: [
      "Captain Kavya's team plays a five-match series against a rival school in Chennai. Before each match she calls the coin toss. The coin is fair and each toss has nothing to do with the others.",
      "Her coach says she will buy the whole team ice cream if, somewhere in the series, Kavya wins at least three tosses in a row.",
    ],
    given: ["5 tosses, each won (W) or lost (L) with equal chance", "Success: at least 3 wins in a row somewhere in the 5"],
    ask: "What is the probability that the team gets its ice cream? Give it as a decimal.",
    answer: chanceOf(TOSSES.cells).p,
    symbol: "p =",
    unit: "(no unit)",
    range: [0.001, 1],
    hints: [
      "There are 2 × 2 × 2 × 2 × 2 = 32 equally likely strings of W and L. Count the ones that contain WWW.",
      "Sort them by where the first WWW starts: at toss 1, at toss 2 (so toss 1 is L), or at toss 3 (so toss 2 is L). The cases do not overlap.",
    ],
    solution: [
      { text: "Each toss is W or L, so there are 32 equally likely strings.", math: "total = 2⁵ = 32" },
      { text: "First WWW starts at toss 1: tosses 4 and 5 can be anything.", math: "WWW _ _  ⇒  2 × 2 = 4" },
      { text: "First WWW starts at toss 2: toss 1 must be L, toss 5 anything.", math: "L WWW _  ⇒  2" },
      { text: "First WWW starts at toss 3: toss 2 must be L, toss 1 anything.", math: "_ L WWW  ⇒  2" },
      { text: "Add the cases and divide.", math: "p = (4 + 2 + 2) ÷ 32 = 8 ÷ 32 = 0.25" },
    ],
    scene: (p) => ({ kind: "count-chance", ...TOSSES, event: "3 wins in a row", p }),
    simNote: "The sim lists all 32 strings of five tosses and lights up the ones with WWW somewhere in them.",
  },
];

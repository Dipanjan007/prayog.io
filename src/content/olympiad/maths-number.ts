/**
 * Maths Olympiad, set 1: number sense and divisibility.
 * Original problems. Answers come from src/lib/sim/oly-number.ts and oly-count.ts, the same code the sims run.
 */
import { rectangles } from "@/lib/sim/oly-count";
import { smallestFitting, type PackRule } from "@/lib/sim/oly-number";
import type { OlyProblem } from "./types";

const LADDOO: PackRule[] = [
  { size: 4, rem: 1 },
  { size: 6, rem: 1 },
  { size: 9, rem: 1 },
];

const DIYA: PackRule[] = [
  { size: 3, rem: 2 },
  { size: 5, rem: 4 },
  { size: 7, rem: 1 },
];

export const MATHS_NUMBER_PROBLEMS: OlyProblem[] = [
  {
    id: "laddoo-boxes",
    set: "number-sense",
    level: "warm-up",
    title: "Laddoos that always leave one over",
    emoji: "🍬",
    story: [
      "Kamla Ben's sweet shop in Ahmedabad packs besan laddoos in boxes of 4, 6 or 9. On Raksha Bandhan morning she counts a fresh tray and notices something odd.",
      "Whichever box size she uses, exactly 1 laddoo is left over. The tray holds more than 10 laddoos.",
    ],
    given: ["Boxes of 4: 1 left over", "Boxes of 6: 1 left over", "Boxes of 9: 1 left over", "More than 10 laddoos"],
    ask: "What is the smallest number of laddoos the tray could hold?",
    answer: smallestFitting(LADDOO, 10),
    symbol: "N =",
    unit: "laddoos",
    range: [1, 500],
    hints: [
      "If you eat the 1 extra laddoo, what is left fills boxes of 4, 6 and 9 exactly. So N − 1 is a multiple of 4, of 6 and of 9.",
      "The smallest number that 4, 6 and 9 all divide into is their LCM. Break each into primes and take the highest power of each prime.",
    ],
    solution: [
      { text: "Take the 1 extra laddoo away. Now every box size divides the pile exactly.", math: "N − 1 is a multiple of 4, 6 and 9" },
      { text: "Find the LCM from the prime factors, using the highest power of each prime.", math: "4 = 2 × 2,  6 = 2 × 3,  9 = 3 × 3  ⇒  LCM = (2 × 2) × (3 × 3) = 36" },
      { text: "So N − 1 is 0, 36, 72, ... and N is one more than that.", math: "N = 1, 37, 73, ...  and N > 10  ⇒  N = 37" },
      { text: "Check each box size.", math: "37 = (4 × 9) + 1 = (6 × 6) + 1 = (9 × 4) + 1" },
    ],
    scene: (n) => ({ kind: "num-pack", n, item: ["laddoo", "laddoos"], group: "box", rules: LADDOO, min: 10 }),
    simNote: "The sim packs your number of laddoos into each box size and shows what is left over. It also checks that no smaller pile above 10 works.",
  },
  {
    id: "pt-drill",
    set: "number-sense",
    level: "standard",
    title: "Rectangles for the PT drill",
    emoji: "🧍",
    story: [
      "For Republic Day, the PT teacher at a school in Nagpur must line up all 120 students of Class 8 in a perfect rectangle: equal rows, nobody left over.",
      "The rectangle must have at least 3 rows and at least 3 students in each row. 6 rows of 20 and 20 rows of 6 look different from the stage, so they count as two layouts.",
    ],
    given: ["120 students, all in the rectangle", "At least 3 rows", "At least 3 students in each row", "rows × students per row: order matters"],
    ask: "How many different layouts can the teacher choose from?",
    answer: rectangles(120, 3).length,
    symbol: "N =",
    unit: "layouts",
    range: [1, 200],
    hints: [
      "A layout is a number of rows r that divides 120 exactly. So count the divisors of 120, then throw out the ones that break the rules.",
      "120 = 2³ × 3 × 5. The number of divisors is (3 + 1) × (1 + 1) × (1 + 1). Which divisors give fewer than 3 rows, or fewer than 3 students in a row?",
    ],
    solution: [
      { text: "Every layout is a pair rows × per row = 120, so the number of rows is a divisor of 120. Break 120 into primes.", math: "120 = 2³ × 3 × 5" },
      { text: "A divisor uses 2 zero to three times, 3 zero or one time and 5 zero or one time.", math: "number of divisors = (3 + 1) × (1 + 1) × (1 + 1) = 16" },
      { text: "Throw out 1 and 2 rows (too few rows), and 60 and 120 rows (only 2 or 1 in a row).", math: "16 − 4 = 12" },
      { text: "List them to be sure: 3 × 40, 4 × 30, 5 × 24, 6 × 20, 8 × 15, 10 × 12, 12 × 10, 15 × 8, 20 × 6, 24 × 5, 30 × 4, 40 × 3. That is 12." },
    ],
    scene: (k) => ({ kind: "count-list", items: rectangles(120, 3), slots: k, slotsFrom: "answer", word: ["layout", "layouts"], heading: "120 students, at least 3 × 3" }),
    simNote: "The sim lists every rectangle of 120 with at least 3 rows and 3 in a row, and drops each one into a slot of your count. Spare slots or layouts with no slot show the gap.",
  },
  {
    id: "diwali-diyas",
    set: "number-sense",
    level: "olympiad",
    title: "The diyas that never come out even",
    emoji: "🪔",
    story: [
      "On Diwali night, Meera wants to set her diyas on the terrace wall in neat rows. In rows of 3, she has 2 diyas left over. In rows of 5, 4 are left over.",
      "Then she tries rows of 7 and has exactly 1 diya left over. Her brother says there cannot be many diyas, since the box is small.",
    ],
    given: ["Rows of 3: 2 left over", "Rows of 5: 4 left over", "Rows of 7: 1 left over"],
    ask: "What is the smallest number of diyas Meera could have?",
    answer: smallestFitting(DIYA, 0),
    symbol: "N =",
    unit: "diyas",
    range: [1, 500],
    hints: [
      "2 left from rows of 3 and 4 left from rows of 5 both mean 'one short of a full row'. So N + 1 is a multiple of 3 and of 5.",
      "That makes N one of 14, 29, 44, 59, ... Now test which of these leaves 1 over in rows of 7.",
    ],
    solution: [
      { text: "In rows of 3 and rows of 5, the pile is exactly one diya short of filling the last row.", math: "N + 1 is a multiple of 3 and of 5  ⇒  N + 1 is a multiple of 15" },
      { text: "So N is 1 less than a multiple of 15.", math: "N = (15 × k) − 1 = 14, 29, 44, 59, ..." },
      { text: "Now use rows of 7. Divide each candidate by 7 and look at the remainder.", math: "14 = (7 × 2) + 0,  29 = (7 × 4) + 1  ⇒  N = 29" },
      { text: "Check all three rules.", math: "29 = (3 × 9) + 2 = (5 × 5) + 4 = (7 × 4) + 1" },
      { text: "The next answer is 29 + (3 × 5 × 7) = 134, because 105 is the LCM of 3, 5 and 7. The small box means 29." },
    ],
    scene: (n) => ({ kind: "num-pack", n, item: ["diya", "diyas"], group: "row", rules: DIYA, min: 0 }),
    simNote: "The sim sets your number of diyas in rows of 3, 5 and 7 and shows what is left over each time. It also checks that no smaller number works.",
  },
];

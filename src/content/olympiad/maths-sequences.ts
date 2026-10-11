/**
 * Maths Olympiad, set 8: sequences and patterns.
 * Original problems. Answers come from src/lib/sim/oly-pattern.ts, which builds each pattern stage by stage.
 */
import { stageFor } from "@/lib/sim/oly-pattern";
import type { OlyProblem } from "./types";

const STICKS = 100;
const SEATS = { kind: "pat-seats" as const, first: 20, step: 4 };
const CHAIRS = 720;
const DIYAS = 397;

export const MATHS_SEQUENCE_PROBLEMS: OlyProblem[] = [
  {
    id: "matchstick-squares",
    set: "sequences",
    level: "warm-up",
    title: "A row of matchstick squares",
    emoji: "🔥",
    story: [
      "Kabir is bored at his cousin's wedding in Surat, so he builds squares out of matchsticks in one long row along the table. The first square takes 4 matchsticks.",
      "Every next square shares a side with the one before it, so it needs only 3 more. Kabir has a full box of 100 matchsticks and uses every single one.",
    ],
    given: ["First square: 4 matchsticks", "Each next square: 3 more", "100 matchsticks, all used"],
    ask: "How many squares are in Kabir's row?",
    answer: stageFor({ kind: "pat-sticks" }, STICKS),
    symbol: "n =",
    unit: "squares",
    range: [1, 500],
    hints: ["Write the matchsticks for 1, 2, 3 squares: 4, 7, 10, ... What is the rule for n squares?", "n squares need 1 + (3 × n) matchsticks: one starting stick, then 3 for each square."],
    solution: [
      { text: "Count for small rows: 4, 7, 10, 13, ... Each square adds 3, starting from 1 extra stick.", math: "sticks for n squares = 1 + (3 × n)" },
      { text: "All 100 are used.", math: "1 + (3 × n) = 100" },
      { text: "Solve.", math: "3 × n = 99  ⇒  n = 33" },
      { text: "Check: 1 + (3 × 33) = 1 + 99 = 100." },
    ],
    scene: (n) => ({ kind: "pat-sticks", n, target: STICKS }),
    simNote: "The sim lays your number of squares in a row, stick by stick, and counts them against the box of 100.",
  },
  {
    id: "kabaddi-stand",
    set: "sequences",
    level: "standard",
    title: "Chairs for the kabaddi stand",
    emoji: "🤼",
    story: [
      "For a district kabaddi final in Patna, volunteers set up a stand of plastic chairs along one side of the court. The front row has 20 chairs.",
      "Each row behind has 4 more chairs than the row in front of it. The tent house delivered exactly 720 chairs, and the organisers want every chair used and every row complete.",
    ],
    given: ["Row 1: 20 chairs", "Each next row: 4 more chairs", "720 chairs in all, every row full"],
    ask: "How many rows will the stand have?",
    answer: stageFor(SEATS, CHAIRS),
    symbol: "n =",
    unit: "rows",
    range: [1, 200],
    hints: [
      "The rows hold 20, 24, 28, ... chairs: an arithmetic sequence with a = 20 and d = 4. Use the sum Sₙ.",
      "Sₙ = n × [(2 × 20) + ((n − 1) × 4)] ÷ 2 simplifies to n × [18 + (2 × n)]. Set that equal to 720.",
    ],
    solution: [
      { text: "Sum of the first n rows of an arithmetic sequence with a = 20, d = 4.", math: "Sₙ = n × [(2 × 20) + ((n − 1) × 4)] ÷ 2 = n × [18 + (2 × n)]" },
      { text: "All 720 chairs are used.", math: "n × [18 + (2 × n)] = 720  ⇒  n² + (9 × n) − 360 = 0" },
      { text: "Factor: find two numbers that multiply to −360 and add to 9.", math: "(n + 24) × (n − 15) = 0" },
      { text: "A number of rows cannot be negative.", math: "n = 15" },
      { text: "Check: row 15 has 20 + (14 × 4) = 76 chairs, and 15 × (20 + 76) ÷ 2 = 720." },
    ],
    scene: (n) => ({ ...SEATS, n, target: CHAIRS }),
    simNote: "The sim sets out your number of rows, front row nearest the court, and counts the chairs used against the 720 delivered.",
  },
  {
    id: "diya-hexagon",
    set: "sequences",
    level: "olympiad",
    title: "The hexagon of diyas",
    emoji: "🪔",
    story: [
      "For Dev Deepawali in Varanasi, a group of students lays out diyas in a growing hexagon on the ghat steps. One diya sits in the middle: that is ring 1.",
      "Ring 2 is a small hexagon of 6 diyas around it. Ring 3 is a bigger hexagon of 12 diyas around that, and each ring has 6 more diyas than the ring inside it. When they finish, they have lit 397 diyas in all.",
    ],
    given: ["Ring 1: 1 diya", "Ring 2: 6 diyas, ring 3: 12 diyas, ... (6 more each ring)", "397 diyas in all"],
    ask: "How many rings does the finished hexagon have?",
    answer: stageFor({ kind: "pat-hex" }, DIYAS),
    symbol: "n =",
    unit: "rings",
    range: [1, 200],
    hints: [
      "Ring k (for k from 2 up) has 6 × (k − 1) diyas. Add rings 2 to n: 6 × [1 + 2 + ... + (n − 1)].",
      "1 + 2 + ... + (n − 1) = [n × (n − 1)] ÷ 2, so the total is 1 + [3 × n × (n − 1)]. Set it equal to 397.",
    ],
    solution: [
      { text: "Add the middle diya and the rings around it.", math: "total = 1 + 6 × [1 + 2 + ... + (n − 1)]" },
      { text: "Use the sum of the first counting numbers.", math: "1 + 2 + ... + (n − 1) = [n × (n − 1)] ÷ 2  ⇒  total = 1 + [3 × n × (n − 1)]" },
      { text: "Set it equal to 397.", math: "3 × n × (n − 1) = 396  ⇒  n × (n − 1) = 132" },
      { text: "Two whole numbers in a row with product 132.", math: "12 × 11 = 132  ⇒  n = 12" },
      { text: "Numbers like 1, 7, 19, 37, 61, ... are called centred hexagonal numbers. The 12th one is 397." },
    ],
    scene: (n) => ({ kind: "pat-hex", n, target: DIYAS }),
    simNote: "The sim lights the hexagon ring by ring up to your number of rings and counts the diyas against the 397 the students lit.",
  },
];

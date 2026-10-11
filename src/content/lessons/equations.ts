/**
 * Class 7 · Ganita Prakash Part 2 · Chapter 7 "Finding the Unknown".
 * Covers an equation as a level balance, doing the same thing to both sides
 * (take away the same amount, share into equal parts), unknowns on both sides,
 * writing the equation of a balance and checking a solution by putting it back.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { BalanceRound, Puzzle, Scale } from "@/lib/sim/balance";
import type { LessonDef } from "./types";

export const LESSON_ID = "c7-equations";

const sc = (lb: number, lm: number, rb: number, rm: number): Scale => ({ left: { bags: lb, marbles: lm }, right: { bags: rb, marbles: rm } });

/** Free-play balances. The first three are the missions; the fourth is extra practice. */
export const PUZZLES: Puzzle[] = [
  { name: "Balance 1", brief: "One bag and 5 marbles balance 12 marbles.", scale: sc(1, 5, 0, 12), x: 7 },
  { name: "Balance 2", brief: "Three bags and 2 marbles balance 14 marbles.", scale: sc(3, 2, 0, 14), x: 4 },
  { name: "Balance 3", brief: "Five bags and 1 marble balance two bags and 10 marbles.", scale: sc(5, 1, 2, 10), x: 3 },
  { name: "Balance 4", brief: "Two bags and 9 marbles balance four bags and 3 marbles.", scale: sc(2, 9, 4, 3), x: 3 },
];

/** Write mode: level balances whose equation the student writes. */
export const WRITE_PICS: Puzzle[] = [
  { name: "Picture A", brief: "Write the equation this balance shows.", scale: sc(2, 3, 0, 11), x: 4 },
  { name: "Picture B", brief: "Write the equation this balance shows.", scale: sc(4, 1, 1, 13), x: 4 },
  { name: "Picture C", brief: "Write the equation this balance shows.", scale: sc(3, 0, 1, 10), x: 5 },
];

/** Challenge: three mandi customers' balances, solved in the fewest moves. One star each. */
export const ROUNDS: BalanceRound[] = [
  {
    name: "Onion seller's puzzle",
    brief: "Three bags and 4 marbles balance 19 marbles. Par: 2 moves.",
    scale: sc(3, 4, 0, 19),
    x: 5,
    par: 2,
  },
  {
    name: "Tomato trader's puzzle",
    brief: "Four bags and 6 marbles balance two bags and 14 marbles. Par: 3 moves.",
    scale: sc(4, 6, 2, 14),
    x: 4,
    par: 3,
  },
  {
    name: "Mango merchant's puzzle",
    brief: "Six bags and 9 marbles balance three bags and 21 marbles. Par: 3 moves.",
    scale: sc(6, 9, 3, 21),
    x: 4,
    par: 3,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "balance-keeper",
  classNum: 7,
  book: "Ganita Prakash Part 2",
  chapter: "Finding the Unknown",
  title: "The mandi balance",
  intro: {
    objective:
      "Put mystery bags of marbles on a sabzi mandi taraazu and find how many marbles hide in each bag without opening it. Keep the beam level by doing the same thing to both pans, then write what the balance says as an equation.",
    learn: [
      "An equation is a level balance: both sides are worth the same",
      "Take the same amount off both sides, or share both sides equally, and it stays level",
      "How to solve equations with the unknown on both sides, like 5x + 1 = 2x + 10",
      "How to check an answer by putting it back into the equation",
    ],
    realLife:
      "Shopkeepers balance goods against weights every day. Working out a missing price on a bill, the runs a batter needs, or how many chocolates each friend gets are all equations in disguise.",
    minutes: 20,
  },
  hook: {
    title: "The sabzi mandi taraazu",
    text:
      "At the sabzi mandi, the vegetable seller puts a 1 kg weight on one pan of her taraazu and onions on the other until the beam is level. Your cousin tries a trick on it: some cloth bags that each hold the same number of marbles, plus a few loose marbles. The beam is level. Without opening a single bag, can you tell how many marbles are inside one?",
  },
  predict: {
    question: "A bag of marbles and 3 loose marbles balance 10 loose marbles. What should you do to find out what is in the bag, and keep the beam level?",
    options: ["Take 3 marbles off the bag's pan only", "Take 3 marbles off both pans", "Add 3 marbles to the pan with 10"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:level",
      title: "Leave the bag alone",
      text: "In Solve, pick Balance 1. Take marbles off both pans until the bag is alone on its pan.",
      found:
        "Taking 5 marbles off both pans left the bag alone against 7 marbles, and the beam stayed level. So x + 5 = 12 becomes x = 12 − 5 = 7.",
    },
    {
      id: "task:tilt",
      title: "One pan only",
      text: "Now take one marble off one pan only and watch the beam.",
      found:
        "The beam tipped. Changing one side alone breaks the balance, so the equation is no longer true. Whatever you do to one pan, do the same to the other.",
    },
    {
      id: "task:share",
      title: "Share it out",
      text: "Pick Balance 2 (three bags and 2 marbles balance 14). Solve it. You will need to split both pans into equal shares.",
      found:
        "Taking 2 marbles off both pans left 3x = 12. Splitting each pan into 3 equal shares left one bag against 4 marbles, so x = 4. Check: (3 × 4) + 2 = 14.",
    },
    {
      id: "task:both",
      title: "Bags on both pans",
      text: "Pick Balance 3, where both pans hold bags. Solve it.",
      found:
        "One way: take 2 bags off both pans to get 3x + 1 = 10. Then 3x = 9, so x = 3. Check: (5 × 3) + 1 = 16 and (2 × 3) + 10 = 16. Both sides match, so x = 3 is right.",
    },
    {
      id: "task:write",
      title: "Write the equation",
      text: "Switch to Write. Count the bags and loose marbles on each pan, set them with the + and − buttons, and press Check. Do two pictures.",
      found:
        "Each bag is an x and each loose marble is 1, so a pan with 2 bags and 3 marbles is 2x + 3. The level beam is the = sign: 2x + 3 = 11.",
    },
  ],
  discovery: {
    scientist: "Brahmagupta",
    years: "598–668 CE",
    fact: "In his book Brahmasphutasiddhanta (628 CE), Brahmagupta gave a rule for equations with the unknown on both sides: gather the unknowns on one side and the known numbers on the other, then divide. He called the unknown yavat-tavat, meaning 'as many as', and shortened it to 'ya', much like we write x today.",
    formula: "ax + b = cx + d  →  x = (d − b) ÷ (a − c)",
    formulaNote: "Take the known numbers off one side and the unknowns off the other, then share out what is left.",
  },
  symbols: [
    { sym: "x", meaning: "the unknown: here, the number of marbles in one bag" },
    { sym: "3x", meaning: "3 × x: three bags, so three times the unknown" },
    { sym: "=", meaning: "equals: both sides are worth the same, like a level beam" },
    { sym: "+, −", meaning: "add (put marbles on) and subtract (take marbles off)" },
    { sym: "×, ÷", meaning: "multiply, and divide (share into equal parts)" },
    { sym: "a, b, c, d", meaning: "in Brahmagupta's rule: a and c count the bags on each side, b and d the loose marbles" },
    { sym: "→", meaning: "leads to: the next step of the working" },
  ],
  ideas: [
    {
      title: "An equation is a level balance",
      text: "Each bag stands for the unknown x and each loose marble for 1. When the beam is level, the two pans are worth the same, and we write that with an = sign. Three bags and 2 marbles balancing 14 marbles is the equation 3x + 2 = 14.",
      formula: "3x + 2 = 14",
    },
    {
      title: "Do the same to both sides",
      text: "Take the same number of marbles (or bags) off both pans, and the beam stays level. Split both pans into the same number of equal shares, and one share of each still balances. Do something to one pan only, and it tips.",
      formula: "3x + 2 = 14  →  3x = 12  →  x = 12 ÷ 3 = 4",
    },
    {
      title: "Unknowns on both sides",
      text: "When both pans hold bags, take the smaller number of bags off both. Then take off loose marbles, then share. You are left with one bag on one side and its value on the other.",
      formula: "5x + 1 = 2x + 10  →  3x + 1 = 10  →  3x = 9  →  x = 3",
    },
    {
      title: "Check by putting it back",
      text: "Put your answer back in place of x in the first equation. If both sides come out the same, the answer is right. Always work out the multiplication first.",
      formula: "x = 3:  (5 × 3) + 1 = 16  and  (2 × 3) + 10 = 16",
    },
  ],
  challenge: {
    title: "Mandi rush hour",
    text: "Three customers, three balances. Find x in each in the fewest moves. One move takes any number of marbles off both pans, any number of bags off both pans, or splits both pans into equal shares. Match the par to win the star.",
  },
  quiz: [
    {
      q: "x + 9 = 23. What is x?",
      options: ["32", "14", "13", "9"],
      answer: 1,
      why: "Take 9 off both sides: x = 23 − 9 = 14. Check: 14 + 9 = 23.",
    },
    {
      q: "Four identical bags balance 28 loose marbles. How many marbles are in one bag?",
      options: ["24", "32", "7", "112"],
      answer: 2,
      why: "4x = 28. Share both sides into 4 equal parts: x = 28 ÷ 4 = 7.",
    },
    {
      q: "Solve 3x + 5 = 20.",
      options: ["x = 5", "x = 8", "x = 15", "x = 75"],
      answer: 0,
      why: "Take 5 off both sides: 3x = 15. Share into 3: x = 15 ÷ 3 = 5. Check: (3 × 5) + 5 = 20.",
    },
    {
      q: "At a kirana shop, Meena buys 3 pens of the same price and a ₹10 notebook. She pays ₹46. If one pen costs ₹x, which equation fits?",
      options: ["3 + 10x = 46", "x + 10 = 46", "3x = 46 + 10", "3x + 10 = 46"],
      answer: 3,
      why: "Three pens cost 3x rupees, and the notebook adds ₹10, so 3x + 10 = 46. Then 3x = 36 and x = 12: each pen costs ₹12.",
    },
    {
      q: "Solve 5x + 2 = 2x + 17.",
      options: ["x = 3", "x = 5", "x = 6", "x = 15"],
      answer: 1,
      why: "Take 2x off both sides: 3x + 2 = 17. Take 2 off both sides: 3x = 15, so x = 5. Check: (5 × 5) + 2 = 27 and (2 × 5) + 17 = 27.",
    },
  ],
};

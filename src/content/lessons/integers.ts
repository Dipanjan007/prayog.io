/**
 * Class 7 · Ganita Prakash Part 2 · Chapter 2 "Operations with Integers".
 * Covers adding and subtracting negative numbers as jumps on a number line (a lift with
 * basements and the temperature in Leh), + and − tokens that cancel in zero pairs, and
 * the sign rules for multiplying integers.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { IntRound } from "@/lib/sim/integers";
import type { LessonDef } from "./types";

export const LESSON_ID = "c7-integers";

/** Challenge: three jobs in the control room, one star each. */
export const TRIPS: IntRound[] = [
  {
    kind: "move",
    scene: "lift",
    name: "Down to the car park",
    brief: "You are on floor 7 and your car is parked in basement −3. Today only the Add button works. What number do you add to reach −3?",
    start: 7,
    op: "+",
    target: -3,
  },
  {
    kind: "move",
    scene: "temp",
    name: "Leh warms up",
    brief: "At 5 am the thermometer in Leh reads −9 °C. By 2 pm it reads 4 °C. The weather panel can only subtract. What do you subtract from −9 to get 4?",
    start: -9,
    op: "−",
    target: 4,
  },
  {
    kind: "times",
    name: "Rewind the cold",
    brief: "Since midnight Leh has cooled by 3 °C every hour, a change of −3 each hour. A few hours ago it was 6 °C warmer than now. Hours ago count as negative (−1 means one hour ago). Find the hours a so that a × (−3) = 6.",
    b: -3,
    target: 6,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "sign-sage",
  classNum: 7,
  book: "Ganita Prakash Part 2",
  chapter: "Operations with Integers",
  title: "Lifts, Leh and zero pairs",
  intro: {
    objective:
      "Ride a lift down to the basements, watch the thermometer in Leh drop below zero, cancel + and − tokens, and jump along a number line to find out why a negative times a negative is positive.",
    learn: [
      "Adding a negative number moves you down the number line",
      "Subtracting a number is the same as adding its opposite: 2 − (−3) = 2 + 3",
      "A + token and a − token make a zero pair worth 0",
      "The sign rules for multiplying: (−) × (+) = (−) and (−) × (−) = (+)",
    ],
    realLife:
      "Lifts with basement parking, winter temperatures in Leh and Kashmir, money you owe and money you have, and goal difference in a football table all use negative numbers.",
    minutes: 20,
  },
  hook: {
    title: "Below zero",
    text:
      "On a January night in Leh, Ladakh, the temperature can fall to −15 °C. By the next afternoon it may be −2 °C. How much did it warm up? At a mall in Mumbai, a lift goes from floor 4 down to basement −2 to reach the car park. How many floors did it drop? Both questions need sums with negative numbers. Let's ride.",
  },
  predict: {
    question: "What is 2 − (−3)?",
    options: ["−1", "5", "−5"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:down",
      title: "Down to the basement",
      text: "In Lift, bring the lift to floor 3. Choose Add, set the number to −5 and press Go.",
      found:
        "The lift went down 5 floors to basement −2: 3 + (−5) = −2. Adding a negative number moves you down the number line, just like 3 − 5.",
    },
    {
      id: "task:subneg",
      title: "Take away a negative",
      text: "Bring the lift to floor 2 and work out 2 − (−3) with Subtract and Go. Then bring it back to floor 2 and work out 2 + 3.",
      found:
        "Both trips ended on floor 5. 2 − (−3) = 2 + 3 = 5: taking away a negative number is the same as adding its opposite, so the lift went up.",
    },
    {
      id: "task:tokens",
      title: "Zero pairs",
      text: "Switch to Tokens. Make the board worth −2 in two different ways, using different numbers of + tokens.",
      found:
        "Boards like two − tokens, or one + and three − tokens, are all worth −2. A + token with a − token is a zero pair worth 0, so adding or taking away zero pairs never changes the value.",
    },
    {
      id: "task:signs",
      title: "Signs when multiplying",
      text: "Switch to Times. Make (−3) × 2, then (−3) × (−2). Watch which way the jumps go and where they land.",
      found:
        "(−3) × 2 = −6, but (−3) × (−2) = 6. Down the pattern for × (−2) the answers go −6, −4, −2, 0 and keep climbing by 2 to 2, 4, 6. So a negative times a negative is positive.",
    },
  ],
  discovery: {
    scientist: "Brahmagupta",
    years: "598–c. 668 CE",
    fact: "In 628 CE, in Bhinmal in Rajasthan, Brahmagupta wrote the Brahmasphutasiddhanta. It is one of the first books to give clear rules for zero and for negative numbers, which he called debts, while positive numbers were fortunes. One rule says: the product of two debts is a fortune.",
    formula: "(−a) × (−b) = a × b",
    formulaNote: "A negative times a negative is positive. A negative times a positive is negative.",
  },
  symbols: [
    { sym: "−", meaning: "minus: take away, or the sign of a negative number like −3" },
    { sym: "+", meaning: "plus: add, or the sign of a positive number" },
    { sym: "(−3)", meaning: "the number negative 3, in brackets so its sign is not mixed up with a minus between numbers" },
    { sym: "a, b", meaning: "any two integers" },
    { sym: "×", meaning: "times; in Times, a is the number of jumps and b is the size of each jump" },
    { sym: "°C", meaning: "degrees Celsius; water freezes at 0 °C" },
    { sym: "floor −2", meaning: "the second basement, 2 floors below the ground floor (floor 0)" },
    { sym: "+ token, − token", meaning: "counters worth +1 and −1; one of each is a zero pair worth 0" },
  ],
  ideas: [
    {
      title: "Adding on the number line",
      text: "Start at the first number. Adding a positive number moves you up (or right). Adding a negative number moves you down (or left). That is why the lift went from floor 3 to basement −2.",
      formula: "3 + (−5) = −2;   −4 + 6 = 2",
    },
    {
      title: "Subtracting is adding the opposite",
      text: "Taking away a number is the same as adding its opposite. Taking away −3 is adding 3, so the lift goes up. With tokens: to take away three − tokens from a board, you can instead add three + tokens.",
      formula: "a − b = a + (−b);   2 − (−3) = 2 + 3 = 5",
    },
    {
      title: "Zero pairs",
      text: "A + token and a − token cancel each other. Remove all the zero pairs and the tokens left over show the value. A rise of 1 °C and a fall of 1 °C also cancel.",
      formula: "(+1) + (−1) = 0",
    },
    {
      title: "Signs when multiplying",
      text: "3 × (−2) means three jumps of −2, landing on −6. A negative count means jumping the other way, so (−3) × (−2) lands on 6. Same signs give a positive answer; different signs give a negative answer.",
      formula: "(−3) × 2 = −6;   (−3) × (−2) = 6",
    },
  ],
  challenge: {
    title: "Control room",
    text: "Some buttons on the panels are broken. Send the lift to the car park, warm up Leh with only a subtract button, and rewind the cold by multiplying. One star per job.",
  },
  quiz: [
    {
      q: "At 6 am in Leh it is −7 °C. By noon the temperature rises by 12 °C. What is the temperature at noon?",
      options: ["5 °C", "−19 °C", "19 °C", "−5 °C"],
      answer: 0,
      why: "−7 + 12 = 5. Start at −7 and move 12 steps up: 7 steps reach 0, and 5 more reach 5 °C.",
    },
    {
      q: "(−4) × (−6) = ?",
      options: ["−24", "24", "−10", "10"],
      answer: 1,
      why: "4 × 6 = 24, and a negative times a negative is positive, so the answer is 24.",
    },
    {
      q: "A lift goes from floor 5 down to basement −2. How many floors does it go down?",
      options: ["3", "7", "−3", "10"],
      answer: 1,
      why: "5 − (−2) = 5 + 2 = 7. It goes 5 floors down to the ground floor and 2 more to −2.",
    },
    {
      q: "−8 − (−3) = ?",
      options: ["−11", "−5", "5", "11"],
      answer: 1,
      why: "Subtracting −3 is adding 3: −8 + 3 = −5.",
    },
    {
      q: "A board has 7 + tokens and 10 − tokens. What is it worth?",
      options: ["3", "−3", "17", "−17"],
      answer: 1,
      why: "7 zero pairs cancel, leaving 3 − tokens, so the board is worth 7 − 10 = −3.",
    },
  ],
};

/**
 * Class 7 · Ganita Prakash Part 2 · Chapter 4 "Another Peek Beyond the Point".
 * Second lab under "Working with Fractions". Covers zooming into a number line to place
 * tenths, hundredths and thousandths, comparing decimals, adding and subtracting money
 * in ₹ and paise, and multiplying and dividing by 10 and 100 on a place-value chart.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { DecRound } from "@/lib/sim/decimals";
import type { LessonDef } from "./types";

export const LESSON_ID = "c7-decimals";

/** Challenge: three sports-day jobs, one star each. */
export const JOBS: DecRound[] = [
  {
    kind: "place",
    name: "Photo finish",
    brief: "The 100 m final: Aarav ran 12.5 s, Kabir 12.47 s and Dev 12.52 s. Post the winning (fastest) time on the scoreboard line.",
    target: 12470,
  },
  {
    kind: "bill",
    name: "Relay team treat",
    brief: "The relay team won a ₹35.00 canteen coupon. Pick snacks that cost exactly ₹35.00, so not a single paisa is wasted.",
    target: 3500,
  },
  {
    kind: "shift",
    name: "Badge order",
    brief: "One sports-day badge costs ₹2.45. The school needs 1000 badges. Use the × and ÷ buttons to turn the price of one badge into the bill for 1000.",
    start: "2.45",
    target: "2450",
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "point-zoomer",
  classNum: 7,
  book: "Ganita Prakash Part 2",
  chapter: "Another Peek Beyond the Point",
  title: "Zoom beyond the point",
  intro: {
    objective:
      "Zoom into a number line until tenths, hundredths and thousandths appear, run a canteen bill in rupees and paise, and watch digits slide when you multiply or divide by 10 and 100. Then run the sports day results.",
    learn: [
      "Each place after the point is one tenth of the place before it",
      "How to compare decimals like 0.5 and 0.45 without being fooled",
      "Adding and subtracting money by lining up the decimal points",
      "Multiplying or dividing by 10 or 100 moves every digit one or two places",
    ],
    realLife:
      "Race times in athletics, prices in rupees and paise, petrol in litres, your height in metres and your temperature in a fever (like 37.8 °C) are all decimals.",
    minutes: 20,
  },
  hook: {
    title: "Who won the race?",
    text:
      "On sports day the 100 m times flash up on the board: Aarav 12.5 s, Kabir 12.47 s, Dev 12.52 s. Kabir's 47 looks bigger than Aarav's 5, so did Kabir run slower? To be sure, you need to look beyond the point, at tenths and hundredths of a second. Let's zoom in and find out.",
  },
  predict: {
    question: "Which number is bigger: 0.5 or 0.45?",
    options: ["0.45, because 45 is more than 5", "0.5", "They are the same"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:zoom",
      title: "Zoom in to 2.35",
      text: "In Zoom, put the pin exactly on 2.35. You will need to zoom in twice.",
      found:
        "2.35 sits between 2.3 and 2.4. You went from ones to tenths to hundredths: 2 ones, then 3 tenths, then 5 hundredths. So 2.35 = 2 + (3 ÷ 10) + (5 ÷ 100).",
    },
    {
      id: "task:compare",
      title: "0.5 or 0.45?",
      text: "Put the pin on 0.45, then on 0.5. Which one is further to the right?",
      found:
        "0.5 was further right, so it is bigger. 0.5 is 5 tenths, which is the same as 50 hundredths, and 0.45 is only 45 hundredths. More digits after the point does not make a number bigger.",
    },
    {
      id: "task:bill",
      title: "Pay at the canteen",
      text: "Switch to Shop. Buy one samosa and one lassi, then pay with a ₹50 note.",
      found:
        "₹12.50 + ₹22.25 = ₹34.75, and the change from ₹50 is ₹50.00 − ₹34.75 = ₹15.25. Lining up the decimal points keeps rupees under rupees and paise under paise.",
    },
    {
      id: "task:shift",
      title: "Slide the digits",
      text: "Switch to × ÷ 10. Start at 3.75 and make 375. Then start at 3.75 again and make 0.0375.",
      found:
        "3.75 × 100 = 375 (₹3.75 is 375 paise): every digit moved two places to the left. 3.75 ÷ 100 = 0.0375: every digit moved two places to the right, and zeros filled the empty places.",
    },
  ],
  discovery: {
    scientist: "Simon Stevin",
    years: "1548–1620",
    fact: "Stevin was an engineer from Bruges. In 1585 he wrote a short booklet called De Thiende (The Tenth), showing that sums with tenths, hundredths and thousandths are as easy as sums with whole numbers. He asked rulers to make coins and measures go in tens. India did that with its money in 1957, when one rupee became 100 naye paise.",
    formula: "2.35 = 2 + (3 ÷ 10) + (5 ÷ 100)",
    formulaNote: "Each digit after the point counts tenths, then hundredths, then thousandths: every place is one tenth of the place on its left.",
  },
  symbols: [
    { sym: ".", meaning: "the decimal point: whole numbers on its left, parts of one on its right" },
    { sym: "tenth", meaning: "one of 10 equal parts of 1; 0.1 = 1 ÷ 10" },
    { sym: "hundredth", meaning: "one of 100 equal parts of 1; 0.01 = 1 ÷ 100" },
    { sym: "thousandth", meaning: "one of 1000 equal parts of 1; 0.001 = 1 ÷ 1000" },
    { sym: "Th H T O", meaning: "thousands, hundreds, tens and ones columns of the place-value chart" },
    { sym: "t h th tth", meaning: "tenths, hundredths, thousandths and ten-thousandths columns" },
    { sym: "₹", meaning: "rupees; ₹1 = 100 paise, so ₹12.50 is 12 rupees and 50 paise" },
    { sym: "s", meaning: "seconds, used for race times" },
    { sym: "×, ÷", meaning: "times and divided by" },
    { sym: "<, >", meaning: "is less than, is greater than; 0.45 < 0.5" },
  ],
  ideas: [
    {
      title: "Zooming in",
      text: "Cut the gap between two whole numbers into 10 equal steps and you get tenths. Cut one tenth into 10 and you get hundredths, then thousandths. Each place after the point is one tenth of the place on its left, just like the whole-number places.",
      formula: "2.35 = 2 + (3 ÷ 10) + (5 ÷ 100)",
    },
    {
      title: "Comparing decimals",
      text: "Compare the whole parts first. If they are equal, compare tenths, then hundredths. You can add zeros at the end to give both numbers the same number of places: 0.5 = 0.50, and 50 hundredths is more than 45 hundredths. In a race, the smaller time wins.",
      formula: "0.5 = 0.50 > 0.45;   12.47 < 12.5 < 12.52",
    },
    {
      title: "Adding and subtracting",
      text: "Write the numbers so their decimal points are in one line, fill gaps with zeros, then add or subtract column by column, carrying or borrowing as usual. With money, the paise go under paise and the rupees under rupees.",
      formula: "₹12.50 + ₹22.25 = ₹34.75;   ₹50.00 − ₹34.75 = ₹15.25",
    },
    {
      title: "Multiply and divide by 10 and 100",
      text: "Multiplying by 10 moves every digit one place to the left, so the number becomes 10 times bigger. Multiplying by 100 moves it two places. Dividing moves the digits to the right. The point does not move; the digits do.",
      formula: "3.75 × 100 = 375;   3.75 ÷ 100 = 0.0375",
    },
  ],
  challenge: {
    title: "Sports day results",
    text: "Post the winning time, spend a canteen coupon to the exact paisa, and work out the bill for 1000 badges. One star per job.",
  },
  quiz: [
    {
      q: "Four girls ran 100 m. Who was the fastest?",
      options: ["Riya, 13.4 s", "Meera, 13.09 s", "Sana, 13.1 s", "Asha, 13.25 s"],
      answer: 1,
      why: "The fastest runner has the smallest time. All have 13 whole seconds, so compare tenths: 13.09 has 0 tenths, 13.1 has 1, 13.25 has 2 and 13.4 has 4. So 13.09 s is the smallest.",
    },
    {
      q: "₹45.50 + ₹27.75 = ?",
      options: ["₹72.25", "₹73.25", "₹72.125", "₹63.25"],
      answer: 1,
      why: "Line up the points: 50 paise + 75 paise = 125 paise = ₹1.25, and ₹45 + ₹27 + ₹1 = ₹73. So the total is ₹73.25.",
    },
    {
      q: "A notebook costs ₹36.40. You pay with a ₹50 note. How much change do you get?",
      options: ["₹13.60", "₹14.60", "₹13.40", "₹14.40"],
      answer: 0,
      why: "₹50.00 − ₹36.40 = ₹13.60. Write 50 as 50.00 so the paise line up.",
    },
    {
      q: "0.072 × 100 = ?",
      options: ["0.72", "7.2", "72", "0.00072"],
      answer: 1,
      why: "Multiplying by 100 moves every digit two places left: 0.072 becomes 7.2.",
    },
    {
      q: "Which number lies between 2.3 and 2.4?",
      options: ["2.04", "2.35", "2.5", "2.299"],
      answer: 1,
      why: "2.3 = 2.30 and 2.4 = 2.40, and 2.35 is between 2.30 and 2.40. 2.04 and 2.299 are less than 2.3, and 2.5 is more than 2.4.",
    },
  ],
};

/**
 * Class 8 · Ganita Prakash Part 2 · Chapter 1 "Fractions in Disguise".
 * Covers percent as a fraction of 100 on a 10 × 10 grid, discounts and GST on a shop bill
 * (and why their order does not matter), percent increase and decrease, why +20% then
 * −20% does not bring a price back, and finding a percent change.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { PriceGoal } from "@/lib/sim/percent";
import type { LessonDef } from "./types";

export const LESSON_ID = "c8-percentages";

/** Challenge: three customers, three exact bills. Pick the discount. One star each. */
export const GOALS: PriceGoal[] = [
  {
    name: "Exact change",
    brief: "Meera has exactly ₹680 for the ₹800 school bag, and there is no GST on this bill. What discount makes the bill exactly ₹680?",
    item: "bag",
    gst: 0,
    target: 680,
  },
  {
    name: "Cricket club order",
    brief: "The cricket club will pay ₹2,124 for the ₹2,000 bat. The bill adds 18% GST after the discount. Which discount makes it exactly ₹2,124?",
    item: "bat",
    gst: 18,
    target: 2124,
  },
  {
    name: "Wedding gift",
    brief: "A family wants to pay exactly ₹1,062 for the ₹1,200 mixer grinder, with 18% GST added after the discount. Find the discount.",
    item: "mixer",
    gst: 18,
    target: 1062,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "percent-pro",
  classNum: 8,
  book: "Ganita Prakash Part 2",
  chapter: "Fractions in Disguise",
  title: "The Diwali sale",
  intro: {
    objective:
      "Shade squares on a 10 × 10 grid to see that a percent is just a fraction out of 100. Then run a shop's Diwali sale: give discounts, add GST, and find out why a price that goes up 20% and then down 20% does not come back to where it started.",
    learn: [
      "A percent is a fraction with 100 at the bottom: 25% = 25/100 = 1/4",
      "Working out a discount and the GST on a bill",
      "Percent increase and decrease, and finding a percent change",
      "Why +20% then −20% leaves less than you started with",
    ],
    realLife:
      "Sale banners (\"30% off!\"), GST lines on a restaurant bill, exam marks, interest on a savings account, and news like \"petrol up 5%\" are all percents.",
    minutes: 20,
  },
  hook: {
    title: "The Diwali sale",
    text:
      "It is Diwali week and the market is full of banners: \"20% OFF\", \"Flat 25% discount\", \"Prices include 18% GST\". One shopkeeper raised his prices by 20% last month and now offers 20% off. He says that is a fair deal, because the price is back to where it was. Is he right? Let's find out.",
  },
  predict: {
    question: "A ₹100 price goes up by 20%. Then the shop gives 20% off the new price. What do you pay now?",
    options: ["₹100, back where it started", "₹96", "₹104"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:grid",
      title: "Percent on a grid",
      text: "In Grid, shade 25%, 50% and 75% of the 100 squares. Look at the fraction each time.",
      found:
        "25 squares out of 100 is a quarter of the grid, so 25% = 25/100 = 1/4. Likewise 50% = 1/2 and 75% = 3/4. A percent is a fraction in disguise: it always has 100 at the bottom.",
    },
    {
      id: "task:sale",
      title: "Make the sale price",
      text: "Switch to Shop. Choose the ₹800 school bag with no GST. Find the discount that makes it cost exactly ₹600.",
      found:
        "25% off. The discount is ₹200, and 200 out of 800 is 1/4, which is 25%. So 25% of ₹800 = (25 × 800) ÷ 100 = ₹200.",
    },
    {
      id: "task:order",
      title: "Discount first or GST first?",
      text: "Now turn on both a discount and some GST. Look at the bill, then press the order button to add the GST first. Compare what you pay.",
      found:
        "The total was exactly the same both ways. Taking d% off means multiplying by (100 − d) ÷ 100, and adding g% GST means multiplying by (100 + g) ÷ 100. You can multiply in any order and get the same answer.",
    },
    {
      id: "task:updown",
      title: "Up 20%, down 20%",
      text: "Switch to Up & down. Raise the ₹100 price by 20%, then take 20% off. Where do you end up?",
      found:
        "₹96, not ₹100. The 20% rise was 20% of ₹100, which is ₹20. The 20% cut was 20% of the bigger price ₹120, which is ₹24. So the cut took away more than the rise added.",
    },
    {
      id: "task:undo",
      title: "Undo a rise",
      text: "Now raise the price by 25%. Find the decrease that brings it back to exactly ₹100.",
      found:
        "A 20% decrease. After a 25% rise the price is ₹125, and 20% of ₹125 is ₹25, which takes it back to ₹100. To undo a rise you need a smaller percent, because it is taken from a bigger amount.",
    },
  ],
  discovery: {
    scientist: "Aryabhata",
    years: "476–550 CE",
    fact: "In his book Aryabhatiya (499 CE), Aryabhata gave the rule of three (trairashika): multiply the \"fruit\" by the \"desire\" and divide by the \"measure\". Indian merchants used it for prices, interest and shares for centuries. Every percent sum is a rule of three where the measure is 100.",
    formula: "answer = (fruit × desire) ÷ measure",
    formulaNote: "If ₹100 carries ₹18 of GST, then ₹2,000 carries (18 × 2,000) ÷ 100 = ₹360.",
  },
  symbols: [
    { sym: "%", meaning: "percent: out of 100; 18% means 18 out of every 100" },
    { sym: "p", meaning: "a percent, as a number; p% = p/100" },
    { sym: "P", meaning: "the price before any discount or GST, in rupees" },
    { sym: "d", meaning: "the discount, in % (taken off the price)" },
    { sym: "g", meaning: "the GST rate, in % (added to the bill)" },
    { sym: "₹", meaning: "rupees; 1 rupee = 100 paise" },
    { sym: "/", meaning: "a fraction bar; 1/4 means 1 divided by 4" },
    { sym: "×, ÷, −", meaning: "multiply, divide, minus" },
    { sym: "old, new", meaning: "the value before and after a change" },
  ],
  ideas: [
    {
      title: "Percent means \"per hundred\"",
      text: "p% is the fraction p/100. Shade p squares out of 100 and you see it. Many percents are simple fractions in disguise: 50% = 1/2, 25% = 1/4, 20% = 1/5, 10% = 1/10. To find p% of an amount, multiply by p and divide by 100.",
      formula: "p% = p/100;   25% = 25/100 = 1/4 = 0.25",
    },
    {
      title: "Discounts and GST",
      text: "A discount of d% leaves (100 − d)% of the price. GST of g% makes the bill (100 + g)% of the price. Both are multiplications, so the order does not change the total: ₹2,000 with 10% off and 18% GST is 2,000 × 0.9 × 1.18 = ₹2,124 either way.",
      formula: "after d% off: P × (100 − d) ÷ 100;   with g% GST: P × (100 + g) ÷ 100",
    },
    {
      title: "Up and down are not equal",
      text: "A percent is always a percent of something. After a 20% rise the price is bigger, so 20% of it is a bigger amount. That is why +20% then −20% gives 100 × 1.2 × 0.8 = 96, which is 4% less than you started with.",
      formula: "100 × 1.2 × 0.8 = 96",
    },
    {
      title: "Percent change",
      text: "To find the percent change, divide the change by the old value, then multiply by 100. Marks going from 40 to 50 is a 25% rise; going from 50 back to 40 is only a 20% fall.",
      formula: "% change = ((new − old) ÷ old) × 100;   40 → 50: (10 ÷ 40) × 100 = 25%",
    },
  ],
  challenge: {
    title: "Exact bills",
    text: "Three customers want to pay an exact amount. The bill stays hidden until you ring it up, so work out the discount first. One star per customer.",
  },
  quiz: [
    {
      q: "What fraction is 35%, in its lowest terms?",
      options: ["7/20", "35/10", "3/5", "1/35"],
      answer: 0,
      why: "35% = 35/100. Divide top and bottom by 5: 35/100 = 7/20.",
    },
    {
      q: "A ₹1,500 pressure cooker is on sale at 20% off. What is the sale price?",
      options: ["₹1,200", "₹1,300", "₹1,480", "₹300"],
      answer: 0,
      why: "The discount is (20 × 1,500) ÷ 100 = ₹300, so you pay 1,500 − 300 = ₹1,200.",
    },
    {
      q: "A restaurant bill is ₹500 before tax. 5% GST is added. What is the total?",
      options: ["₹505", "₹525", "₹550", "₹475"],
      answer: 1,
      why: "GST = (5 × 500) ÷ 100 = ₹25, so the total is 500 + 25 = ₹525.",
    },
    {
      q: "A price goes up by 10%, then down by 10%. Overall, the price is:",
      options: ["The same as before", "1% less than before", "1% more than before", "10% less than before"],
      answer: 1,
      why: "100 × 1.1 × 0.9 = 99. The 10% fall is taken from the bigger price 110, so you end 1% below where you started.",
    },
    {
      q: "Riya's marks went up from 40 to 50. What is the percent increase?",
      options: ["10%", "20%", "25%", "50%"],
      answer: 2,
      why: "The rise is 10. Percent change = (10 ÷ 40) × 100 = 25%.",
    },
  ],
};

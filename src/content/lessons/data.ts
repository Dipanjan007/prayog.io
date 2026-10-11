/**
 * Class 9 · Ganita Manjari Part 2 · Chapter 10 "How Quantities Combine: Understanding Data".
 * Second lab under "The Mathematics of Maybe" (/maths/probability).
 * Covers the mean, median, mode and range of a small data set on a dot plot, the mean as the
 * balance point, the median for an even number of values, and how an outlier (a century) pulls
 * the mean far more than the median. Challenge: make data sets with a given mean and median.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { DataTarget } from "@/lib/sim/data";
import type { LessonDef } from "./types";

export const LESSON_ID = "c9-data";

/** Challenge: three selectors' requests, one star each. The number of points is fixed in each round. */
export const REQUESTS: DataTarget[] = [
  {
    name: "Average of 30",
    brief: "The coach will pick Arjun if his last 5 scores average exactly 30 runs. Change the scores so the mean is 30.",
    set: "cricket",
    start: [10, 20, 30, 40, 60],
    mean: 30,
  },
  {
    name: "Middle of 50, average of 40",
    brief: "Make 5 scores with a median of exactly 50 runs but a mean of exactly 40 runs.",
    set: "cricket",
    start: [15, 30, 45, 55, 80],
    mean: 40,
    median: 50,
  },
  {
    name: "Six for the march-past",
    brief: "The march-past team has 6 students. Give them heights with a mean of exactly 150 cm and a median of exactly 152 cm.",
    set: "heights",
    start: [140, 144, 150, 152, 158, 162],
    mean: 150,
    median: 152,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "data-detective",
  classNum: 9,
  book: "Ganita Manjari Part 2",
  chapter: "How Quantities Combine: Understanding Data",
  title: "Mean, median and the century",
  intro: {
    objective:
      "Put a cricketer's scores and your classmates' heights on a dot plot. Drag the dots and watch the mean, median, mode and range move. Find out why one big century drags the mean but hardly moves the median.",
    learn: [
      "Mean = (sum of the values) ÷ (number of values), the balance point of the data",
      "Median: the middle value once the data is sorted",
      "Mode: the value that occurs most often",
      "Range = largest − smallest, and why an outlier pulls the mean more than the median",
    ],
    realLife:
      "A batter's average on the TV scorecard is a mean. News about \"typical\" family income usually quotes the median, because a few very rich families would pull the mean up. Shoe shops stock the most common size, the mode, in the biggest numbers.",
    minutes: 20,
  },
  hook: {
    title: "One big innings",
    text:
      "Meera opens the batting for her school. Her scores are steady but small, and the selectors are deciding about her. Then she smashes a century. Her average shoots up, but is she suddenly a different batter? Let's see which number tells the truth about a typical innings.",
  },
  predict: {
    question: "A batter scores 10, 12, 15, 18 and 20. In the next innings she scores 100. Which changes more?",
    options: ["The mean", "The median", "Both change by the same amount"],
    answer: 0,
  },
  tasks: [
    {
      id: "task:balance",
      title: "The balance point",
      text: "Pick Class heights. Make one student taller and another shorter by the same amount, so the mean stays at 151 cm.",
      found:
        "What one student gained, the other lost, so the total stayed 1359 cm and the mean stayed 1359 ÷ 9 = 151 cm. The mean is the balance point: it only moves when the total moves.",
    },
    {
      id: "task:mode",
      title: "Make a mode",
      text: "In Class heights every height is different, so there is no mode. Make three students exactly the same height.",
      found:
        "Now one height occurs three times, more than any other, so it is the mode. The mode is the most common value. A data set can have no mode, one mode or more than one.",
    },
    {
      id: "task:century",
      title: "The century",
      text: "Pick Cricket scores. Drag one of Meera's scores up to 100 or more. Compare how far the mean and the median move.",
      found:
        "The mean jumped but the median hardly moved. Moving the 40 up to 100 adds 60 runs to the total, so the mean rises by 60 ÷ 7 ≈ 8.6 runs, from 22.71 to 31.29, while the median stays 25. One outlier pulls the mean, not the middle.",
    },
    {
      id: "task:even",
      title: "No single middle",
      text: "Add or remove one innings so Meera has an even number of scores. Where is the median now?",
      found:
        "With an even number of scores there are two middle values, and the median is halfway between them: (4th + 5th) ÷ 2 for 8 scores. The median can be a value nobody actually scored.",
    },
  ],
  discovery: {
    scientist: "P. C. Mahalanobis",
    years: "1893–1972",
    fact: "Prasanta Chandra Mahalanobis founded the Indian Statistical Institute in Kolkata in 1931. He planned India's huge National Sample Survey, where trained surveyors collect data from a sample of homes all over the country, and 29 June, his birthday, is celebrated as Statistics Day in India.",
    formula: "mean = (x₁ + x₂ + … + xₙ) ÷ n",
    formulaNote: "Add up all n values and share the total equally. Statistics starts from summaries like this one.",
  },
  symbols: [
    { sym: "x₁, x₂, …, xₙ", meaning: "the data values: the 1st, the 2nd and so on up to the last" },
    { sym: "n", meaning: "how many values there are" },
    { sym: "…", meaning: "and so on, all the values in between" },
    { sym: "÷", meaning: "divided by" },
    { sym: "−", meaning: "minus" },
    { sym: "≈", meaning: "is about equal to" },
    { sym: "cm", meaning: "centimetres, for heights" },
    { sym: "₹", meaning: "rupees" },
    { sym: "°C", meaning: "degrees Celsius, for temperature" },
  ],
  ideas: [
    {
      title: "Mean: share it out equally",
      text: "Add all the values and divide by how many there are. Meera's 7 scores add up to 159 runs, so her mean is 159 ÷ 7 ≈ 22.71 runs. Think of the dots as weights on a see-saw: the mean is where it balances.",
      formula: "mean = (sum of the values) ÷ (number of values)",
    },
    {
      title: "Median: the middle one",
      text: "Sort the values from smallest to largest and take the middle one. Meera's sorted scores are 8, 12, 18, 25, 25, 31, 40, so the median is 25. With an even number of values, take the mean of the two middle values.",
      formula: "even n: median = (two middle values added) ÷ 2",
    },
    {
      title: "Mode and range",
      text: "The mode is the value that occurs most often: 25 runs, which Meera scored twice. The range shows how spread out the data is: 40 − 8 = 32 runs. A small range means steady scores.",
      formula: "range = largest value − smallest value",
    },
    {
      title: "Outliers pull the mean",
      text: "A value far from the rest, like a century among small scores, is an outlier. It changes the total a lot, so the mean moves a lot. The median only cares about which value is in the middle, so it hardly moves. When there are outliers, the median often gives a better idea of a typical value.",
    },
  ],
  challenge: {
    title: "Selectors' requests",
    text: "Three requests from the selectors and the PT teacher. Change the values until the mean and median are exactly right, then check. One star per request.",
  },
  quiz: [
    {
      q: "What is the mean of 4, 7, 7, 10 and 12?",
      options: ["7", "8", "9", "10"],
      answer: 1,
      why: "Sum = 4 + 7 + 7 + 10 + 12 = 40, and there are 5 values. Mean = 40 ÷ 5 = 8.",
    },
    {
      q: "What is the median of 12, 5, 9, 20, 7 and 15?",
      options: ["9", "10.5", "11", "12"],
      answer: 1,
      why: "Sorted: 5, 7, 9, 12, 15, 20. There are 6 values, so take the two middle ones: (9 + 12) ÷ 2 = 10.5.",
    },
    {
      q: "Shoe sizes in a group: 6, 7, 7, 8, 8, 8, 9. What is the mode?",
      options: ["7", "7.5", "8", "9"],
      answer: 2,
      why: "Size 8 occurs three times, more than any other size, so the mode is 8.",
    },
    {
      q: "The top temperatures in Nagpur over five days were 31, 35, 28, 40 and 33 °C. What is the range?",
      options: ["9 °C", "12 °C", "33 °C", "40 °C"],
      answer: 1,
      why: "Range = largest − smallest = 40 − 28 = 12 °C.",
    },
    {
      q: "Five friends get pocket money of ₹200, ₹250, ₹250, ₹300 and ₹5000 a month. Which number best describes a typical friend?",
      options: ["The mean", "The median", "The range", "The mean and the median are equally good"],
      answer: 1,
      why: "The mean is 6000 ÷ 5 = ₹1200, more than four of the five friends get, because ₹5000 is an outlier. The median is ₹250, which is typical.",
    },
  ],
};

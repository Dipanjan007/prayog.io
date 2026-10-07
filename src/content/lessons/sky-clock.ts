/**
 * Class 8 · Curiosity (NCERT 2025) · "Keeping Time with the Skies".
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c8-sky";

/**
 * Challenge: Moon match. Each round shows a Moon (by its elongation from the Sun, in degrees);
 * the student sets the day so the Moon looks the same. One star per Moon.
 */
export const MOON_ROUNDS: { elong: number; who: string; hint: string }[] = [
  { elong: 24, who: "Eid crescent", hint: "A thin crescent low in the west just after sunset, a day or two after Amavasya. Sighting it starts Eid." },
  { elong: 270, who: "Half Moon, late at night", hint: "Half lit. Look at which side is bright before you choose." },
  { elong: 215, who: "A few nights after Sharad Purnima", hint: "Almost full, but a little dark on one side." },
];
/** How close (degrees of elongation) counts as a match: about one day of the Moon's motion. */
export const MOON_TOLERANCE = 13;

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "sky-keeper",
  classNum: 8,
  book: "Curiosity",
  chapter: "Keeping Time with the Skies",
  title: "Read the clock in the sky",
  intro: {
    objective:
      "Use the Sun, the Moon and shadows as a clock and a calendar, just as people did for thousands of years.",
    learn: [
      "Day and night come from the Earth spinning on its axis",
      "The Sun's path and shadow lengths change through the day and the year",
      "Why the Moon shows phases, from Amavasya to Purnima",
      "How lunar and solar calendars differ, and why some festivals move",
    ],
    realLife:
      "Diwali on Amavasya, Eid by moon sighting, Purnima festivals and sundials at Jantar Mantar all follow the sky clock.",
    minutes: 25,
  },
  hook: {
    title: "Why does Diwali move around?",
    text:
      "Last year Diwali fell on one date. This year it falls on another. Eid comes about 11 days earlier every year. Yet your birthday stays on the same date. People in India have kept time with the Sun and the Moon for thousands of years. Learn to read that sky clock yourself.",
  },
  predict: {
    question: "Diwali is always celebrated on Amavasya. What does the Moon look like on Diwali night?",
    options: ["A bright full Moon", "A half Moon", "We cannot see the Moon at all", "A thin crescent"],
    answer: 2,
  },
  tasks: [
    {
      id: "task:daynight",
      title: "Day and night",
      text: "In the Sun, Earth and Moon view, press +6 h a few times. Watch the orange dot for India. Get India into daylight and then into night.",
      found:
        "The Earth spins on its axis once in about 24 hours. The half facing the Sun has day and the other half has night. The Sun does not go around us. We turn, so the Sun seems to rise in the east and set in the west.",
    },
    {
      id: "task:full",
      title: "Find Purnima",
      text: "Move the day slider until the Moon seen from India is full.",
      found:
        "At full Moon (Purnima) the Moon is on the far side of the Earth from the Sun. The half of the Moon that faces the Sun is always lit. At full Moon we look straight at that lit half. At new Moon (Amavasya) it faces away from us.",
    },
    {
      id: "task:year",
      title: "Twelve Moons, one year?",
      text: "Slide to day 354, the twelfth Amavasya. Has the Earth come back to where it started?",
      found:
        "Twelve lunar months take only about 354 days. The Earth needs about 365 days to go around the Sun. A calendar of 12 lunar months slips about 11 days every year against the seasons.",
    },
    {
      id: "task:noon",
      title: "Shadow through the day",
      text: "Switch to the shadow stick. Start in the morning, then drag the time to 12 noon. Watch the shadow.",
      found:
        "The Sun rises in the east, so the morning shadow points west. As the Sun climbs, the shadow gets shorter. It is shortest at local noon, when the Sun is highest. A sundial uses this to tell the time.",
    },
    {
      id: "task:seasons",
      title: "Noon in June and December",
      text: "Keep the time at 12 noon. Look at the shadow in June, then in December.",
      found:
        "In December the noon Sun is low in the south, so the shadow is long and points north. In June the noon Sun is almost overhead at 23° N, so there is almost no shadow at all. The length of the noon shadow tells the season.",
    },
  ],
  discovery: {
    scientist: "Sawai Jai Singh II",
    years: "1688–1743",
    fact: "The ruler of Amber built the Jantar Mantar observatories in Delhi and Jaipur. The giant sundial in Jaipur, the Samrat Yantra, is about 27 metres tall and tells the local time to within about 2 seconds.",
    formula: "12 × 29.5 days ≈ 354 days",
    formulaNote: "Twelve Moon cycles of about 29.5 days make a lunar year, about 11 days shorter than a solar year. That is why many festivals shift dates each year.",
  },
  ideas: [
    {
      title: "Day and night",
      text: "The Earth rotates on its axis from west to east once a day. The side facing the Sun has day. Because of this rotation, the Sun, Moon and stars all seem to rise in the east and set in the west.",
      formula: "1 day ≈ 24 hours (one rotation of the Earth)",
    },
    {
      title: "The Sun's path and shadows",
      text: "A stick's shadow points away from the Sun. It is long in the morning and evening and shortest at local noon. The noon Sun is higher in summer and lower in winter, so noon shadows are short in June and long in December.",
      formula: "Higher Sun → shorter shadow",
    },
    {
      title: "Phases of the Moon",
      text: "The Moon has no light of its own. The half facing the Sun is always lit. As the Moon goes around the Earth, we see more or less of that lit half. From Amavasya to Purnima it grows (waxing, Shukla paksha). From Purnima to Amavasya it shrinks (waning, Krishna paksha). Each paksha has 15 tithis.",
      formula: "1 lunar month ≈ 29.5 days (Amavasya to Amavasya)",
    },
    {
      title: "Lunar, solar and lunisolar calendars",
      text: "A solar year follows the seasons. A lunar calendar of 12 months is about 11 days shorter, so the Islamic Hijri calendar moves Eid about 11 days earlier each year. Indian lunisolar calendars add an extra month, the adhik maas, about once every 2.7 years. This keeps Diwali, Holi and other festivals near their seasons.",
      formula: "12 × 29.5 ≈ 354 days    365 − 354 ≈ 11 days a year",
    },
  ],
  challenge: {
    title: "Moon match",
    text: "You will see three Moons. For each one, set the day so the Moon seen from India looks the same, then lock it in. One star per Moon.",
  },
  quiz: [
    {
      q: "Why do we have day and night?",
      options: ["The Sun goes around the Earth", "The Earth rotates on its axis", "The Moon blocks the Sun at night", "The Earth goes around the Sun"],
      answer: 1,
      why: "The Earth spins once a day. The half facing the Sun has day and the other half has night.",
    },
    {
      q: "At 8 am in India, which way does a stick's shadow point?",
      options: ["East", "West", "North only", "Straight down"],
      answer: 1,
      why: "The morning Sun is in the east, and a shadow always points away from the Sun, so it points west.",
    },
    {
      q: "When is a stick's shadow the shortest during a day?",
      options: ["At sunrise", "At local noon", "At sunset", "It stays the same all day"],
      answer: 1,
      why: "The Sun is highest in the sky at local noon, and a higher Sun makes a shorter shadow.",
    },
    {
      q: "On Purnima, where is the Moon?",
      options: [
        "Between the Sun and the Earth",
        "On the opposite side of the Earth from the Sun",
        "Behind the Sun",
        "At right angles to the Sun",
      ],
      answer: 1,
      why: "At full Moon the Earth is between the Sun and the Moon, so we see the whole sunlit half.",
    },
    {
      q: "A Moon is lit on its right side and grows bigger each night. Which paksha is it?",
      options: ["Krishna paksha", "Shukla paksha", "Adhik maas", "It could be either"],
      answer: 1,
      why: "A growing (waxing) Moon goes from Amavasya to Purnima. That is the Shukla paksha, the bright half of the month.",
    },
    {
      q: "About how many days do 12 lunar months take?",
      options: ["365 days", "354 days", "300 days", "29.5 days"],
      answer: 1,
      why: "One lunar month is about 29.5 days, so 12 of them take about 12 × 29.5 ≈ 354 days.",
    },
    {
      q: "Why do Indian lunisolar calendars add an adhik maas every few years?",
      options: [
        "To match the Moon's phases",
        "To keep festivals in the same season, because 12 lunar months are about 11 days shorter than a year",
        "Because the Moon slows down",
        "To make every year 365 days long",
      ],
      answer: 1,
      why: "Without the extra month, festivals would drift about 11 days a year through the seasons, like Eid does in the purely lunar Hijri calendar.",
    },
  ],
};

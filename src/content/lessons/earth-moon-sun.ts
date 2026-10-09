/**
 * Class 7 · Curiosity (NCERT 2024) · "Earth, Moon, and the Sun".
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c7-earth-moon-sun";

/** Challenge: three jobs for the planetarium. One star each, in order. */
export const SKY_JOBS: { title: string; ask: string; hint: string }[] = [
  {
    title: "Longest day in Delhi",
    ask: "In Seasons, pick Delhi and find the date with the longest day of the year.",
    hint: "Watch the day length. It grows, stops growing, then shrinks.",
  },
  {
    title: "Blood Moon",
    ask: "In Eclipses, keep the real 5° tilt on and make a total lunar eclipse.",
    hint: "Set Purnima, then hunt for the months when the Moon stays on the line.",
  },
  {
    title: "Day turns to night",
    ask: "Keep the real tilt on and make a total solar eclipse.",
    hint: "A solar eclipse needs Amavasya, in the same eclipse season.",
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "orbit-explorer",
  classNum: 7,
  book: "Curiosity",
  chapter: "Earth, Moon, and the Sun",
  title: "Spin, orbit and shadow",
  intro: {
    objective:
      "Spin the Earth, send it round the Sun and line up the Moon, to see where day and night, the year, the seasons and eclipses come from.",
    learn: [
      "Rotation of the Earth gives day and night, and makes the Sun seem to move from east to west",
      "Revolution of the Earth round the Sun takes about 365¼ days: one year",
      "The tilted axis gives seasons, and longer summer days in north India",
      "Why solar and lunar eclipses happen, why they are rare, and how to watch them safely",
    ],
    realLife:
      "Long June evenings for cricket in Delhi, short winter days in Leh, Chennai's steady weather and the eclipse news on TV all come from this chapter.",
    minutes: 25,
  },
  hook: {
    title: "Why is a June evening so long?",
    text:
      "In June the Sun rises over Delhi before 5:30 am and sets after 7 pm, so there is time for a long cricket match after school. In December you wake up in the dark, while a cousin in Chennai hardly notices a change. And on 22 July 2009, the sky over Varanasi and Patna went dark just after sunrise as the Moon covered the Sun. All of this comes from three balls in space: the Earth, the Moon and the Sun.",
  },
  predict: {
    question: "On 21 June, which city has the longest day?",
    options: ["Chennai, the farthest south", "Delhi", "Leh, the farthest north", "All three are the same"],
    answer: 2,
  },
  tasks: [
    {
      id: "task:spin",
      title: "Spin the Earth",
      text: "In Seasons, drag the time of day from the morning to the evening. Watch where the Sun is in the sky, and where the orange city dot is on the close-up Earth.",
      found:
        "The Earth spins on its axis from west to east, once in about 24 hours. This is rotation. The half facing the Sun has day and the other half has night. Because we turn towards the east, the Sun seems to rise in the east and set in the west. The Sun is not moving across our sky. We are.",
    },
    {
      id: "task:year",
      title: "Go round the Sun",
      text: "Drag the date through a whole year. Stop in March, June, September and December, and watch the Earth's axis.",
      found:
        "The Earth goes round the Sun once in about 365¼ days. This is revolution, and it gives us the year. The axis always points the same way in space, towards the Pole Star. So in June the northern half leans towards the Sun, and in December it leans away.",
    },
    {
      id: "task:cities",
      title: "Three cities in June",
      text: "Set the date to June. Now check the day length in Chennai, Delhi and Leh.",
      found:
        "In June the north leans towards the Sun. The farther north a city is, the more of its daily circle is in sunlight. Leh gets about 14 h 26 min of daylight and Chennai only about 12 h 54 min. In December it is the other way round. The noon Sun is also higher in June, so sunlight falls more directly and heats the ground more. That is summer.",
    },
    {
      id: "task:eclipse",
      title: "Line them up",
      text: "Switch to Eclipses with the Moon's orbit flat. Make a solar eclipse and then a lunar eclipse.",
      found:
        "At Amavasya the Moon is between the Sun and the Earth, and its shadow falls on the Earth: a solar eclipse. At Purnima the Earth is between the Sun and the Moon, and the Moon moves into the Earth's shadow: a lunar eclipse. The dark middle of a shadow is the umbra. The paler outer part is the penumbra.",
    },
    {
      id: "task:tilt",
      title: "Why not every month?",
      text: "Now switch on the real 5° tilt. Keep the date in March and press Amavasya or Purnima. Look at the side view.",
      found:
        "The Moon's orbit is tilted by about 5° to the Earth's orbit. Most months the new Moon passes above or below the Sun, and the full Moon passes above or below the Earth's shadow. An eclipse can only happen when Amavasya or Purnima falls near a node, where the two orbits cross. That happens only in two short eclipse seasons each year.",
    },
  ],
  discovery: {
    scientist: "Aryabhata",
    years: "476–550 CE",
    fact: "In 499 CE, aged just 23, Aryabhata wrote that the Earth spins on its axis and that eclipses are shadows of the Earth and the Moon. India's first satellite, launched in 1975, is named after him.",
    formula: "360° ÷ 24 h = 15° per hour",
    formulaNote: "The Earth turns 15 degrees every hour, which is why the Sun seems to move across the sky.",
  },
  symbols: [
    { sym: "°", meaning: "degrees of angle; a full turn is 360°" },
    { sym: "h", meaning: "hours" },
    { sym: "¼", meaning: "one quarter" },
    { sym: "latitude", meaning: "how far north of the equator a place is, in degrees" },
  ],
  ideas: [
    {
      title: "Rotation: day and night",
      text: "The Earth rotates on its axis from west to east once in about 24 hours. The half facing the Sun has day. This rotation makes the Sun, the Moon and the stars seem to rise in the east and set in the west.",
      formula: "360° in 24 h, so the Earth turns 15° every hour",
    },
    {
      title: "Revolution: the year",
      text: "The Earth revolves around the Sun in about 365¼ days. A calendar year has 365 days, so every fourth year gets one extra day, 29 February. That year is a leap year with 366 days.",
      formula: "4 × 365¼ = 3 × 365 + 366 days",
    },
    {
      title: "The tilted axis: seasons",
      text: "The Earth's axis is tilted by about 23.5° and always points the same way. Around 21 June the northern half leans towards the Sun. The noon Sun is high and days are long, so India has summer. Around 22 December it leans away, the noon Sun is low and days are short: winter. The Earth's distance from the Sun is not the reason for seasons.",
      formula: "On 21 June, noon Sun height = 90° − (latitude − 23.5°) for places north of 23.5° N",
    },
    {
      title: "Eclipses and safe viewing",
      text: "A solar eclipse happens at Amavasya, when the Moon's shadow falls on the Earth. A lunar eclipse happens at Purnima, when the Moon passes through the Earth's shadow. The Moon's orbit is tilted by about 5°, so eclipses happen only a few times a year. Never look at the Sun directly, even during an eclipse. Use proper eclipse glasses or a pinhole projector. A lunar eclipse is safe to watch with bare eyes.",
      formula: "Sun - Moon - Earth in a line: solar eclipse.  Sun - Earth - Moon: lunar eclipse",
    },
  ],
  challenge: {
    title: "Sky planner",
    text: "The planetarium needs three dates. Find Delhi's longest day. Then, with the Moon's real 5° tilt on, plan a total lunar eclipse and a total solar eclipse. One star for each job.",
  },
  quiz: [
    {
      q: "Why do we have day and night?",
      options: [
        "The Sun goes around the Earth every day",
        "The Earth rotates on its axis",
        "The Earth revolves around the Sun",
        "The Moon blocks the Sun at night",
      ],
      answer: 1,
      why: "As the Earth spins, each place turns into the sunlit half (day) and then into the dark half (night).",
    },
    {
      q: "The Sun seems to rise in the east because…",
      options: [
        "the Earth rotates from west to east",
        "the Earth rotates from east to west",
        "the Sun moves from east to west",
        "the Earth is tilted",
      ],
      answer: 0,
      why: "We turn towards the east, so the Sun first appears on the eastern horizon and seems to move west across the sky.",
    },
    {
      q: "How long does the Earth take to go once around the Sun?",
      options: ["24 hours", "About 29½ days", "About 365¼ days", "12 years"],
      answer: 2,
      why: "One revolution takes about 365¼ days. The extra quarter day adds up to the leap day every four years.",
    },
    {
      q: "What is the main reason for seasons?",
      options: [
        "The Earth is closer to the Sun in summer",
        "The tilt of the Earth's axis",
        "The Moon's shadow",
        "Clouds in the monsoon",
      ],
      answer: 1,
      why: "The tilted axis makes each half lean towards the Sun for part of the year. The Earth is actually closest to the Sun in early January, in our winter.",
    },
    {
      q: "On 21 June, which place gets the shortest day?",
      options: ["Leh", "Delhi", "Chennai", "All get the same"],
      answer: 2,
      why: "In June the north leans towards the Sun. Chennai is the farthest south of the three, so less of its daily circle is in sunlight.",
    },
    {
      q: "A solar eclipse can happen only on…",
      options: ["Purnima (full moon)", "Amavasya (new moon)", "Any day", "The first quarter"],
      answer: 1,
      why: "The Moon must be between the Sun and the Earth, which happens at Amavasya.",
    },
    {
      q: "Why don't we get an eclipse every Amavasya and Purnima?",
      options: [
        "The Moon is too small",
        "The Moon's orbit is tilted about 5° to the Earth's orbit",
        "Clouds hide most eclipses",
        "The Sun is too bright",
      ],
      answer: 1,
      why: "Most months the Moon passes a little above or below the Sun-Earth line, so its shadow misses the Earth or it misses the Earth's shadow.",
    },
  ],
};

/**
 * Class 7 · Curiosity (NCERT 2024) · "Heat Transfer in Nature", second lab.
 * Covers the water cycle part at the end of the chapter: the Sun's heat evaporates water from seas
 * and lakes, the vapour rises, cools and condenses into clouds, it falls as rain, and some of the
 * rain seeps into the ground and is stored as groundwater (seepage on soil vs on paved ground).
 * It also revisits the Class 6 Curiosity chapter "A Journey through States of Water": what speeds
 * up evaporation (heat, wind, surface area, dry air) and condensation on a cold glass.
 * Section numbers are not cited here; check them against the NCERT chapter PDF.
 * The first lab for this chapter (heat-transfer.ts) covers conduction, convection, land and sea
 * breezes and radiation.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c7-water-cycle";

/** Rain on the hills (mm per hour) needed in the monsoon round. */
export const MONSOON_RAIN = 5;
/** Groundwater (mm) to refill in the recharge round, with almost nothing running off. */
export const RECHARGE_MM = 30;
export const RECHARGE_MAX_RUNOFF = 0.5;

/** Challenge rounds; one star each. */
export const WATER_ROUNDS = [
  {
    id: "monsoon",
    title: "Bring the monsoon",
    text: `Make it pour on the Western Ghats: at least ${MONSOON_RAIN} mm of rain an hour on the slope facing the sea.`,
  },
  {
    id: "recharge",
    title: "Fill the well",
    text: `Soak ${RECHARGE_MM} mm of rain into the ground with almost no water running off (under ${RECHARGE_MAX_RUNOFF} mm). If too much runs off, tap Reset totals and try again.`,
  },
  {
    id: "dew",
    title: "The dry tumbler",
    text: "In the Mumbai monsoon, a tumbler of fridge water (6 °C) is sweating. Do not change the drink. Change the air in the room until the tumbler stays dry.",
  },
] as const;
export type WaterRound = (typeof WATER_ROUNDS)[number]["id"];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "monsoon-maker",
  classNum: 7,
  book: "Curiosity",
  chapter: "Heat Transfer in Nature",
  title: "The water cycle",
  intro: {
    objective:
      "Turn up the Sun and the wind over the Arabian Sea, watch clouds pile up on the Western Ghats and rain soak into the ground, then dry clothes and chill a steel tumbler in the kitchen.",
    learn: [
      "The Sun's heat drives evaporation, and heat, wind, surface area and dry air all speed it up",
      "Vapour condenses when it cools: on a cold tumbler, and into clouds as air rises",
      "Why the Western Ghats get heavy monsoon rain and Pune, behind them, gets much less",
      "How rain seeps into soil to become groundwater, and why concrete makes it run off",
    ],
    realLife:
      "The monsoon over the Sahyadri hills, clothes that will not dry in a Mumbai July, a matka of cool water in a Delhi summer, a sweating glass of nimbu pani and flooded streets after a cloudburst.",
    minutes: 25,
  },
  hook: {
    title: "Where does the rain come from?",
    text:
      "Every June the monsoon blows in from the Arabian Sea. Mumbai gets drenched and the hills of Mahabaleshwar vanish into cloud, yet Pune, just behind the hills, stays much drier. At home the washing won't dry, and a cold steel tumbler is covered in drops. Is water leaking through the steel? Where does all that rain come from, and where does it go? Let's follow a drop of water.",
  },
  predict: {
    question: "A moist wind blows from the sea towards a line of tall hills, like the Western Ghats. Where does the most rain fall?",
    options: [
      "Over the sea, where the water is",
      "On the side of the hills facing the sea",
      "On the far side of the hills",
      "The same everywhere",
    ],
    answer: 1,
  },
  tasks: [
    {
      id: "task:sun",
      title: "The Sun lifts the water",
      text: "In Sea and hills, slide the Sun's heat down low, then up high, and watch the evaporation number. Then turn the wind up to 5 m/s or more.",
      found:
        "A stronger Sun warms the sea, and warm water evaporates faster. The wind carries the damp air away and brings drier air in, so evaporation speeds up even more. The Sun's heat is what drives the whole water cycle: without it, water would not rise into the sky.",
    },
    {
      id: "task:ghats",
      title: "Rain on the Ghats",
      text: "Make the wind blow the sea air onto the hills. Get at least 2 mm of rain an hour falling on the slope that faces the sea. Look at the far side too.",
      found:
        "The wind pushes the moist air up the slope. Rising air cools, about 10 °C for every kilometre. When it cools to its dew point, the vapour condenses into tiny droplets: a cloud. The droplets join up and fall as rain on the side facing the sea. On the far side the air comes down, warms up and is dry, so it hardly rains there. That is why Pune is in the rain shadow of the Ghats.",
    },
    {
      id: "task:soak",
      title: "Where does the rain go?",
      text: "With Soil chosen, let 20 mm of rain soak into the ground. Then switch to Concrete and let 20 mm run off.",
      found:
        "On soil, rain seeps in through the gaps between the grains and slowly fills the ground below. This is groundwater, which wells and handpumps draw up. But soil can soak only a few mm an hour, so a very heavy downpour runs off even here. On concrete almost nothing soaks in. All of it runs into drains and rivers, which is why city streets flood and the wells run dry.",
    },
    {
      id: "task:clothes",
      title: "Wash day: Mumbai vs Delhi",
      text: "Go to the Kitchen. Try the Delhi, May weather and the Mumbai, July weather. Then, keeping the Mumbai weather, make the shirt dry in 8 hours or less.",
      found:
        "In Delhi's hot, dry air the shirt dries in under two hours. In Mumbai's monsoon the air is already nearly full of vapour, so water leaves the shirt very slowly. A fan helps by blowing the damp air away, and spreading the shirt out gives the water more surface to escape from. Heat, wind, surface area and dry air all speed up evaporation.",
    },
    {
      id: "task:tumbler",
      title: "The sweating tumbler",
      text: "Fill the steel tumbler with ice water and watch the outside. Then fill it with water from the matka.",
      found:
        "With ice water, drops formed on the outside, but the tumbler is not leaking. Water vapour in the air touched the cold steel, cooled below its dew point and condensed into water. Matka water is not cold enough for that, so the tumbler stayed dry. Clouds form the same way, when vapour in rising air cools down.",
    },
  ],
  discovery: {
    scientist: "Edmond Halley",
    years: "1656–1742",
    fact: "In 1687 Halley heated a pan of water to the warmth of a summer day and weighed how much evaporated. Scaling up, he worked out that the Sun lifts far more water from the Mediterranean Sea each day than its rivers pour into it. So the rivers could be fed by sea water that rose as vapour and fell as rain.",
    formula: "Rain ≈ evaporation (whole Earth, in a year)",
    formulaNote: "Water is not used up: every drop the Sun lifts from seas, lakes and plants comes back down as rain or snow somewhere.",
  },
  symbols: [
    { sym: "≈", meaning: "is about equal to" },
    { sym: "dew point", meaning: "the temperature at which air is so cool that water vapour turns into drops" },
    { sym: "×", meaning: "multiply" },
  ],
  ideas: [
    {
      title: "Evaporation and the Sun",
      text: "The Sun's heat turns water from seas, lakes, soil and leaves into water vapour. Evaporation is faster when it is hotter, when the wind blows the damp air away, when the water is spread over a bigger surface and when the air is dry. That is why clothes dry fast in a Delhi summer and slowly in a Mumbai monsoon.",
      formula: "Faster drying: more heat, more wind, more surface, drier air",
    },
    {
      title: "Condensation and the dew point",
      text: "Air can hold only so much vapour, and cooler air holds less. When air cools to its dew point, the extra vapour condenses into water drops. This is why a cold steel tumbler sweats, why grass is wet with dew on a winter morning and why your breath fogs a mirror.",
      formula: "Drops form when a surface is colder than the dew point",
    },
    {
      title: "Clouds and rain over the hills",
      text: "Rising air cools, about 10 °C for every km it climbs. When it reaches its dew point, a cloud forms. The monsoon wind pushes moist sea air up the Western Ghats, so the slopes facing the sea get huge rains. Mahabaleshwar, on top of the Ghats, gets more than 5,000 mm of rain a year. Pune, about 100 km away on the far side, gets under 1,000 mm. This drier side is the rain shadow.",
      formula: "Cloud base ≈ 125 m × (air temperature − dew point)",
    },
    {
      title: "Seepage and groundwater",
      text: "Some rain runs off into streams and rivers and back to the sea. Some seeps into the soil and fills the spaces between grains and rocks below. This stored groundwater feeds wells, handpumps and borewells. Concrete and tar stop water from seeping in. Rainwater harvesting pits and open ground let it soak back in.",
    },
    {
      title: "Evaporation takes heat away",
      text: "Water needs heat to evaporate, and it takes that heat from whatever it leaves. Water seeping through the walls of a clay matka evaporates and cools the water inside. In dry air it evaporates fast, so a matka works best in a hot, dry summer. In humid air it hardly cools at all.",
    },
  ],
  challenge: {
    title: "Weather maker",
    text: "Three rounds: bring a monsoon to the Ghats, refill the groundwater without wasting rain, and keep a cold tumbler dry. One star for each round.",
  },
  quiz: [
    {
      q: "Which day will dry a wet towel the fastest?",
      options: [
        "A cool, still, humid day, towel folded",
        "A hot, windy, dry day, towel spread out",
        "A hot, humid day with no wind",
        "A cold, rainy day, towel spread out",
      ],
      answer: 1,
      why: "Heat, wind, dry air and a large surface all speed up evaporation. The second day has all four.",
    },
    {
      q: "Drops of water form on the outside of a steel tumbler of ice water. Where do they come from?",
      options: [
        "Water seeps through the steel",
        "The ice melts and climbs over the rim",
        "Water vapour in the air condenses on the cold steel",
        "The steel sweats like our skin",
      ],
      answer: 2,
      why: "The cold steel cools the air touching it below its dew point, so the vapour in that air condenses into drops.",
    },
    {
      q: "Why do the slopes of the Western Ghats facing the sea get much more rain than Pune, behind them?",
      options: [
        "Pune is farther from the Sun",
        "Moist sea air is pushed up the slopes, cools and drops its water before it reaches Pune",
        "The hills attract clouds like a magnet",
        "It is hotter in the hills",
      ],
      answer: 1,
      why: "Air forced up the hills cools to its dew point and rains on the near side. Air coming down the far side warms up and is dry: the rain shadow.",
    },
    {
      q: "After a heavy downpour, why do city roads flood more easily than open fields?",
      options: [
        "More rain falls on cities",
        "Concrete and tar do not let the water seep into the ground",
        "City drains pump water up",
        "Fields are higher than roads",
      ],
      answer: 1,
      why: "On soil much of the rain seeps in and becomes groundwater. On concrete almost all of it runs off at once.",
    },
    {
      q: "A matka keeps water much cooler in Delhi in May than in Mumbai in July. Why?",
      options: [
        "Delhi's clay is better",
        "In dry air, water evaporates fast from the matka's walls and takes heat from the water inside",
        "The Sun is weaker in Delhi",
        "Humid air is hotter",
      ],
      answer: 1,
      why: "Evaporation takes heat away. In Delhi's dry air it is fast, so the water cools a lot. Mumbai's humid air slows evaporation, so the matka hardly cools.",
    },
  ],
};

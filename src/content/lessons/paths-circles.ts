/**
 * Class 9 · Exploration · "Describing Motion Around Us" (second lab).
 * Covers §4.1.2 to §4.1.3 (distance and displacement, magnitude and direction;
 * average speed and average velocity, Activity 4.1; a ball thrown up and caught)
 * and §4.4.1 (uniform circular motion, Activity 4.5: the marble in a ring that
 * leaves along the tangent). The first lab, motion.ts, covers speed–time graphs
 * and acceleration.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";
import type { LandmarkId } from "@/lib/sim/paths";

export const LESSON_ID = "c9-paths-circles";

/**
 * Challenge: three map puzzles, one star each. Every walk starts at Home.
 * "reach500": end exactly 500 m from Home, between north and east, by the shortest street route.
 * "answer": walk the given stops by the shortest street routes, then type the average velocity (m/s).
 */
export const MAP_PUZZLES: (
  | { kind: "reach500"; title: string; text: string }
  | { kind: "answer"; title: string; text: string; stops: LandmarkId[]; tolerance: number }
)[] = [
  {
    kind: "reach500",
    title: "Exactly 500 m",
    text: "Stop at a crossing exactly 500 m from Home, somewhere between north and east, using the shortest street route. Not straight up one street!",
  },
  {
    kind: "answer",
    title: "Walk to school",
    text: "Walk from Home to the School by the shortest street route. Read the time, then work out your average velocity in m/s.",
    stops: ["school"],
    tolerance: 0.03,
  },
  {
    kind: "answer",
    title: "Park, then Metro",
    text: "Walk from Home to the Park, then on to the Metro, each by the shortest street route. What is your average velocity for the whole trip, in m/s?",
    stops: ["park", "metro"],
    tolerance: 0.02,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "path-finder",
  classNum: 9,
  book: "Exploration",
  chapter: "Describing Motion Around Us",
  title: "Distance, displacement and going round",
  intro: {
    objective:
      "Walk a city map, throw a ball up and roll a marble round a ring to see why distance and displacement are different, and why going round a circle at a steady speed still changes your velocity.",
    learn: [
      "Distance is the length of the path; displacement is the straight arrow from start to finish, with a direction",
      "Average speed uses distance, average velocity uses displacement",
      "A ball thrown up and caught travels 2h but has zero displacement",
      "In uniform circular motion the speed stays the same but the direction of velocity keeps changing",
    ],
    realLife:
      "Google Maps shows both the road distance and the straight-line distance, a runner on a 400 m track ends a lap where they began, and sparks from a grinding wheel fly off along the tangent.",
    minutes: 25,
  },
  hook: {
    title: "1.4 km walked, 1 km moved",
    text:
      "Your walk to school winds through the lanes of Kolkata for 1.4 km, but a crow flying straight from your home to the school gate covers only 1 km. A sprinter runs a full 400 m lap and ends up exactly where she started. Has she moved at all? Let's measure motion two different ways.",
  },
  predict: {
    question: "A marble is rolling round inside a ring. You lift a small part of the ring just as the marble reaches it. Which way does the marble go?",
    options: [
      "It keeps curving round in a circle",
      "It rolls straight out, away from the centre",
      "It rolls straight on along the tangent, the way it was heading",
    ],
    answer: 2,
  },
  tasks: [
    {
      id: "task:straight",
      title: "Same distance, same displacement",
      text: "In Map walk, tap a crossing at least 300 m away along the same street as Home, so you walk without turning. Compare the odometer with the displacement arrow.",
      found:
        "Walking in a straight line in one direction, the distance and the size of the displacement are equal. This is the only case where they match.",
    },
    {
      id: "task:round",
      title: "Back where you started",
      text: "Press Reset walk. Walk at least 400 m through the streets, then come back to Home.",
      found:
        "The odometer kept counting, but the displacement arrow shrank to nothing. A round trip has zero displacement, so the average velocity for the whole trip is zero too, even though the average speed is not.",
    },
    {
      id: "task:throw",
      title: "Up and down",
      text: "Switch to Throw up. Throw the ball and watch it until it lands back in your hand.",
      found:
        "The ball went up h and came back down h, so it travelled a distance of 2h. It ended where it started, so its displacement is zero. Watch the two lines on the graph split at the top.",
    },
    {
      id: "task:tangent",
      title: "Lift the ring",
      text: "Switch to Ring with the marble. Let it roll a little, then press Lift the ring and see where it goes.",
      found:
        "The ring was what kept turning the marble. Once it is lifted, the marble rolls straight on along the tangent, the way its velocity arrow was pointing at that moment.",
    },
    {
      id: "task:lap",
      title: "One lap of the track",
      text: "In Ring, choose the 400 m track and run one full lap. Watch the average speed and the average velocity.",
      found:
        "Over a full lap the average speed is 400 m divided by the time, but the average velocity is zero because the runner ends where she began. Halfway round, the displacement is the width of the track circle, about 127 m.",
    },
  ],
  discovery: {
    scientist: "Simon Stevin",
    years: "1548–1620",
    fact: "In his 1586 book on weights and balance, the Flemish engineer Stevin drew a loop of balls hanging over a triangle and showed it can never start moving by itself. From it he worked out how forces act along slopes, drawing each force as a line with a size and a direction. He was so pleased with the picture that he printed it with the motto “Wonder en is gheen wonder”: a wonder is no wonder.",
    formula: "average velocity = displacement ÷ time",
    formulaNote: "Velocity is speed with a direction, measured along the straight arrow from start to finish.",
  },
  ideas: [
    {
      title: "Distance and displacement",
      text: "Distance is the total length of the path you travel. It has only a size (magnitude). Displacement is the shortest straight line from where you started to where you finished, and it has a direction too. Distance can never be less than the size of the displacement. They are equal only for a straight-line trip in one direction. For a round trip the displacement is zero.",
      formula: "distance ≥ |displacement|",
    },
    {
      title: "Average speed and average velocity",
      text: "Average speed tells how fast you covered the path. Average velocity tells how fast your position really changed, and in which direction. Walk 1400 m by road to a school 1000 m away in 1000 s: average speed 1.4 m/s, average velocity 1 m/s towards the school.",
      formula: "average speed = distance ÷ time    average velocity = displacement ÷ time",
    },
    {
      title: "Thrown up and caught",
      text: "A ball thrown straight up at speed u rises to a height h and falls back into your hand. Distance travelled = 2h. Displacement = 0. Its velocity points up on the way up, is zero for an instant at the top, and points down on the way back.",
      formula: "h = u² ÷ 2g    (g = 9.8 m/s²)",
    },
    {
      title: "Uniform circular motion",
      text: "Moving round a circle at a steady speed is uniform circular motion. The speed stays the same, but the direction keeps changing, so the velocity keeps changing. That means it is accelerated motion. At every point the velocity is along the tangent, at right angles to the radius. If nothing pulls the object round any more, it moves off along that tangent.",
      formula: "v = 2πr ÷ T",
    },
  ],
  challenge: {
    title: "Kolkata route puzzles",
    text: "Three puzzles on the city map. Every walk starts at Home and you walk at a steady 1.4 m/s. Take the shortest street routes and use displacement, not distance, for average velocity. One star per puzzle.",
  },
  quiz: [
    {
      q: "You walk 300 m east and then 400 m north. What are your distance and displacement?",
      options: ["700 m and 700 m", "700 m and 500 m north of east", "500 m and 700 m", "100 m and 500 m"],
      answer: 1,
      why: "Distance adds the parts: 300 + 400 = 700 m. Displacement is the straight line: √(300² + 400²) = 500 m, pointing between north and east.",
    },
    {
      q: "A cricket ball is thrown straight up, rises 5 m and is caught at the same height. What are the distance and displacement?",
      options: ["5 m and 5 m", "10 m and 10 m", "10 m and 0 m", "0 m and 10 m"],
      answer: 2,
      why: "It travels 5 m up and 5 m down, a distance of 10 m. It ends where it started, so the displacement is 0.",
    },
    {
      q: "An athlete runs one lap of a 400 m track in 50 s. What are her average speed and average velocity?",
      options: ["8 m/s and 8 m/s", "8 m/s and 0 m/s", "0 m/s and 8 m/s", "20 000 m/s and 0 m/s"],
      answer: 1,
      why: "Average speed = 400 ÷ 50 = 8 m/s. She ends where she started, so displacement and average velocity are both zero.",
    },
    {
      q: "A car goes round a circular track at a steady 60 km/h. Which is true?",
      options: [
        "Its speed and velocity are both constant",
        "Its speed is constant but its velocity keeps changing",
        "Its velocity is constant but its speed changes",
        "It has no acceleration",
      ],
      answer: 1,
      why: "The speed stays 60 km/h, but the direction keeps changing. Velocity includes direction, so the velocity changes and the car is accelerating.",
    },
    {
      q: "A stone is whirled in a circle on a string, and the string snaps. Which way does the stone fly?",
      options: [
        "Straight out from the centre",
        "Straight towards the centre",
        "Along the tangent at the point where the string snapped",
        "It keeps going round in a circle",
      ],
      answer: 2,
      why: "At every moment the velocity is along the tangent. With no string to pull it round, the stone moves straight on in that direction.",
    },
  ],
};

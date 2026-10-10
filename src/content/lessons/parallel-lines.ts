/**
 * Class 7 · Ganita Prakash (Part 1) · Chapter 5 "Parallel and Intersecting Lines".
 * Covers vertically opposite angles and linear pairs, a transversal cutting two lines,
 * corresponding, alternate and co-interior angles, and using angles to test whether
 * two lines are parallel (railway rails, a level-crossing road and ladder rungs).
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { AlignRound } from "@/lib/sim/parallel";
import type { LessonDef } from "./types";

export const LESSON_ID = "c7-parallel-lines";

/** Challenge: lay a new rail or rung parallel to the first, seeing only two angles. One star each. */
export const ALIGN_ROUNDS: AlignRound[] = [
  {
    name: "New rail at the level crossing",
    brief: "The road meets the old rail at ∠b = 70°. Turn the new rail until ∠f, in the same corner at the bottom, shows the rails are parallel. Then lay it.",
    skin: "rail",
    road: 70,
    topTilt: 0,
    startTilt: 6,
    known: "b",
    see: "f",
  },
  {
    name: "Ladder rungs",
    brief: "A carpenter is fixing rungs on a bamboo ladder. The side makes ∠d = 75° with the top rung. Turn the new rung until ∠f makes the Z shape right, then fix it.",
    skin: "ladder",
    road: 75,
    topTilt: 0,
    startTilt: -5,
    known: "d",
    see: "f",
  },
  {
    name: "Track on a slope",
    brief: "This rail climbs a hill, so it is tilted. The road meets it at ∠d = 100°. Turn the new rail until ∠e, on the same side between the rails, is right for parallel rails.",
    skin: "rail",
    road: 110,
    topTilt: 10,
    startTilt: 3,
    known: "d",
    see: "e",
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "rail-ranger",
  classNum: 7,
  book: "Ganita Prakash",
  chapter: "Parallel and Intersecting Lines",
  title: "Rails, roads and parallel lines",
  intro: {
    objective:
      "Turn a road across two railway rails and watch the eight angles it makes. Find which angles always match, which add up to 180°, and how angles alone tell you if two lines are parallel.",
    learn: [
      "Vertically opposite angles are equal, and a linear pair adds up to 180°",
      "Corresponding, alternate and co-interior angles made by a transversal",
      "When two lines are parallel, corresponding and alternate angles are equal and co-interior angles add up to 180°",
      "How to test whether two lines are parallel using only angles",
    ],
    realLife:
      "Railway rails, the lines in your notebook, zebra crossings, window grills and the rungs of a ladder are all parallel lines. Carpenters and track workers check them with angles, because they cannot see where the lines would meet far away.",
    minutes: 20,
  },
  hook: {
    title: "The crooked rail",
    text:
      "Workers are laying a new railway track near a level crossing. The two rails must be parallel: if one is turned even a little, the rails would drift apart or come together a few kilometres away, and the train would come off the track. The workers cannot see that far. All they can measure are the angles where the road crosses the rails. Is that enough?",
  },
  predict: {
    question: "A straight road crosses two parallel rails. It makes a 65° angle with the first rail. What angle does it make with the second rail, in the same position?",
    options: ["Less than 65°, because the second rail is further away", "Exactly 65°", "More than 65°"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:cross",
      title: "Where two lines cross",
      text: "Pick Vertically opposite and turn the road to two different angles (drag it, or use the road buttons). Then pick Linear pair and turn the road twice more.",
      found:
        "However you turned the road, the vertically opposite angles stayed equal, and the two angles of a linear pair always added up to 180°, a straight line. Turning one angle bigger makes its neighbour smaller by the same amount.",
    },
    {
      id: "task:corr",
      title: "Line up the rails",
      text: "Rail m is crooked. Pick Corresponding and turn rail m until the two corresponding angles are equal.",
      found:
        "The moment the corresponding angles became equal, the rails became parallel: they point the same way and never meet. All four corresponding pairs (a and e, b and f, c and g, d and h) were equal at once.",
    },
    {
      id: "task:zc",
      title: "The Z and the C",
      text: "Keep the rails parallel. Slide rail m up or down, then look at the Alternate pairs and the Co-interior pairs.",
      found:
        "Sliding the rail did not change a single angle. With parallel rails, alternate angles (they make a Z shape) were equal, and co-interior angles (a C shape, on the same side between the rails) added up to exactly 180°.",
    },
    {
      id: "task:meet",
      title: "Spot a crooked rail",
      text: "Now turn rail m so the rails are not parallel any more, and pick Co-interior.",
      found:
        "Now the co-interior angles did not add up to 180°. On the side where they add up to less than 180°, the two rails lean towards each other and would meet. Angles tell you a line is crooked even when you cannot see where it ends.",
    },
  ],
  discovery: {
    scientist: "Euclid",
    years: "about 300 BCE",
    fact: "Euclid's fifth rule (postulate) says: if a line crosses two lines and the two inside angles on one side add up to less than two right angles, those two lines meet on that side. For over 2,000 years mathematicians tried to prove this rule from his other rules and failed. Their attempts led to new kinds of geometry in the 1800s.",
    formula: "∠d + ∠e = 180°",
    formulaNote: "Co-interior angles adding up to exactly 180° means the lines never meet. Less than 180° means they meet on that side.",
  },
  symbols: [
    { sym: "∠b", meaning: "the angle named b; the eight angles are a, b, c, d at the top line and e, f, g, h at the bottom line" },
    { sym: "°", meaning: "degrees; a straight line is 180° and a full turn is 360°" },
    { sym: "∥", meaning: "is parallel to; l ∥ m means lines l and m never meet" },
    { sym: "x", meaning: "an unknown angle we want to find, in degrees" },
    { sym: "<", meaning: "is less than; 170° < 180°" },
    { sym: "÷", meaning: "divided by" },
  ],
  ideas: [
    {
      title: "Two lines crossing",
      text: "When two lines cross they make four angles. Opposite angles are equal (vertically opposite angles). Neighbouring angles sit on a straight line, so they add up to 180° (a linear pair).",
      formula: "∠a = ∠c;   ∠a + ∠b = 180°",
    },
    {
      title: "Corresponding angles",
      text: "A line that crosses two other lines is a transversal, like the road across the rails. Angles in the same position at the two crossings are corresponding angles (they make an F shape). If the two lines are parallel, corresponding angles are equal, and if corresponding angles are equal, the lines are parallel.",
      formula: "l ∥ m:   ∠b = ∠f;   ∠d = ∠h",
    },
    {
      title: "Alternate and co-interior angles",
      text: "Between the two lines, angles on opposite sides of the transversal are alternate angles (a Z shape). Angles on the same side are co-interior angles (a C shape). For parallel lines, alternate angles are equal and co-interior angles add up to 180°.",
      formula: "l ∥ m:   ∠d = ∠f;   ∠d + ∠e = 180°",
    },
    {
      title: "Testing with angles",
      text: "To check if two lines are parallel, measure one pair. Equal corresponding angles, equal alternate angles, or co-interior angles adding to 180° all prove the lines are parallel. Sliding a line up or down without turning it never changes the angles; only turning it does. Once you know one angle, you can find all eight.",
      formula: "∠c = 180° − ∠b",
    },
  ],
  challenge: {
    title: "Lay it parallel",
    text: "A new rail, a ladder rung and a rail on a slope. You only see two angles, not whether the lines are parallel. Turn the new line until the angles are right, then lay it. One star for each line laid perfectly parallel.",
  },
  quiz: [
    {
      q: "A road crosses two parallel rails. The angle ∠b at the first rail is 70°. What is the corresponding angle ∠f at the second rail?",
      options: ["20°", "70°", "110°", "290°"],
      answer: 1,
      why: "Corresponding angles are equal when the lines are parallel, so ∠f = ∠b = 70°.",
    },
    {
      q: "A transversal cuts two parallel lines. One co-interior angle is 70°. What is the other co-interior angle?",
      options: ["20°", "70°", "90°", "110°"],
      answer: 3,
      why: "Co-interior angles between parallel lines add up to 180°, so the other one is 180° − 70° = 110°.",
    },
    {
      q: "Two angles form a linear pair. One of them is 48°. What is the other?",
      options: ["42°", "48°", "132°", "312°"],
      answer: 2,
      why: "A linear pair makes a straight line, 180°. So the other angle is 180° − 48° = 132°.",
    },
    {
      q: "A transversal cuts two lines. A pair of alternate angles measures 72° and 73°. What can you say about the lines?",
      options: ["They are parallel", "They are not parallel, so they meet somewhere", "They are perpendicular", "They are parallel, because 1° is too small to matter"],
      answer: 1,
      why: "For parallel lines, alternate angles are exactly equal. Even a 1° difference means the lines lean towards each other and meet, maybe far away.",
    },
    {
      q: "Two co-interior angles between parallel lines are x and 2x. What is x?",
      options: ["45°", "60°", "90°", "120°"],
      answer: 1,
      why: "Co-interior angles add up to 180°, so x + 2x = 180°. That is 3x = 180°, so x = 180° ÷ 3 = 60°. The angles are 60° and 120°.",
    },
  ],
};

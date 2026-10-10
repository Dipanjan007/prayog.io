/**
 * Class 7 · Ganita Prakash Part 2 · Chapter 6 "Constructions and Tilings".
 * Second lab under the Class 7 "Parallel and Intersecting Lines" chapter.
 * Covers tiling a floor or rangoli with regular polygons: the angles at a corner must add up
 * to 360°, the interior angle 180° − (360° ÷ n), why only triangles, squares and hexagons tile
 * on their own, and mixed floors such as octagons with squares.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { TileRound } from "@/lib/sim/tiling";
import type { LessonDef } from "./types";

export const LESSON_ID = "c7-tilings";

/** Challenge: three half-tiled corners to finish, one star each. */
export const TILE_ROUNDS: TileRound[] = [
  {
    name: "Bathroom floor",
    brief: "The tiler has laid a square and an octagon round this corner. Finish the corner with no gap and no overlap.",
    fixed: [4, 8],
  },
  {
    name: "Temple courtyard",
    brief: "A hexagon and a square are already set in stone. What fills the rest of the corner exactly?",
    fixed: [6, 4],
  },
  {
    name: "Rangoli round a diya",
    brief: "Two pentagon tiles already meet at the diya in the middle of a rangoli. Only one shape in the box fills the rest of this point exactly. Find it.",
    fixed: [5, 5],
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "rangoli-tiler",
  classNum: 7,
  book: "Ganita Prakash Part 2",
  chapter: "Constructions and Tilings",
  title: "Tiles, corners and 360°",
  intro: {
    objective:
      "Fit regular tiles round a corner and find out why some shapes cover a floor perfectly while others always leave a gap. Then mix shapes to make your own floor patterns.",
    learn: [
      "The angles of the tiles meeting at a corner must add up to exactly 360°",
      "The angle of a regular polygon with n sides is 180° − (360° ÷ n)",
      "Only triangles, squares and hexagons tile a floor on their own",
      "How two or three shapes can be mixed into one floor",
    ],
    realLife:
      "Floor tiles, bathroom walls, rangoli designs, jaali screens in old forts and the hexagons of a honeycomb all follow this rule. Tilers check that the corners fit before they buy the tiles.",
    minutes: 20,
  },
  hook: {
    title: "The pentagon tiles",
    text:
      "Your aunt runs a tile shop in Jaipur. A customer wants a new floor made only of shiny five-sided tiles, all the same size. Your aunt says it cannot be done without gaps, but the customer thinks she just doesn't want to sell them. Who is right? The answer is hiding at the corners where tiles meet.",
  },
  predict: {
    question: "Can regular pentagon tiles, all the same size, cover a floor with no gaps and no overlaps?",
    options: ["Yes, any regular shape can tile a floor", "No, they always leave gaps at the corners", "Yes, but only if the tiles are very small"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:alone",
      title: "One shape only",
      text: "In Corner, pick one shape and keep adding it round the point. Find every shape in the box that fills the corner exactly on its own.",
      found:
        "Six triangles (6 × 60° = 360°), four squares (4 × 90° = 360°) and three hexagons (3 × 120° = 360°) fill the corner exactly. They are the only shapes in the box that can.",
    },
    {
      id: "task:pentagon",
      title: "The trouble with pentagons",
      text: "Clear the corner and add pentagons, one at a time, until no more will go in.",
      found:
        "Three pentagons make 3 × 108° = 324°, leaving a 36° gap. A fourth pentagon needs 108°, so it overlaps by 72°. Pentagons can never fill a corner on their own, so the customer's floor is impossible.",
    },
    {
      id: "task:mix",
      title: "Mix and match",
      text: "Fill the corner exactly using at least two different shapes. Then find a second, different mix.",
      found:
        "Different shapes can share a corner, as long as their angles add up to 360°. For example 90° + 135° + 135° = 360° (a square and two octagons) or 60° + 60° + 60° + 90° + 90° = 360° (three triangles and two squares).",
    },
    {
      id: "task:floor",
      title: "Whole floors",
      text: "Switch to Floor and look at two mixed floors. Read the angles at the marked corner.",
      found:
        "At every corner of a mixed floor the angles add up to 360°, and every corner has the same tiles round it. That is what lets the pattern spread across the whole floor.",
    },
  ],
  discovery: {
    scientist: "Johannes Kepler",
    years: "1571–1630",
    fact: "Kepler is famous for the laws of how planets move, but in his book Harmonices Mundi (1619) he also worked out which regular polygons can tile a floor. He showed that only three shapes do it on their own, and he found the eight mixed floors in which every corner looks the same.",
    formula: "180° − (360° ÷ n)",
    formulaNote: "The angle at each corner of a regular polygon with n sides. Tiles fit round a point only when these angles add up to 360°.",
  },
  symbols: [
    { sym: "n", meaning: "the number of sides of a regular polygon (3 for a triangle, 4 for a square, 6 for a hexagon)" },
    { sym: "°", meaning: "degrees; a full turn round a point is 360°" },
    { sym: "−", meaning: "minus, take away" },
    { sym: "÷", meaning: "divided by" },
    { sym: "×", meaning: "times, multiplied by" },
    { sym: "( )", meaning: "brackets: work out what is inside first" },
  ],
  ideas: [
    {
      title: "A full turn at every corner",
      text: "Where tiles meet at a point, their corners go all the way round it, so their angles must add up to exactly 360°. Less than 360° leaves a gap; more than 360° means tiles overlap.",
      formula: "angles round a point = 360°",
    },
    {
      title: "The angle of a regular polygon",
      text: "Walk round a regular polygon and you turn 360° in all, so you turn 360° ÷ n at each corner. The inside angle is what is left of a straight line, 180°. For a pentagon: 180° − (360° ÷ 5) = 180° − 72° = 108°.",
      formula: "angle = 180° − (360° ÷ n)",
    },
    {
      title: "Only three shapes tile alone",
      text: "A shape tiles on its own when 360° divided by its angle is a whole number. Triangles: 360° ÷ 60° = 6. Squares: 360° ÷ 90° = 4. Hexagons: 360° ÷ 120° = 3. Pentagons: 360° ÷ 108° is about 3.33, and shapes with more sides have angles bigger than 120°, so fewer than three fit and two always leave a gap.",
      formula: "tiles round a point = 360° ÷ angle",
    },
    {
      title: "Mixed floors",
      text: "Different shapes can share a corner if their angles add up to 360°: a square and two octagons, or three triangles and two squares. To cover a whole floor, the pattern must also carry on at every new corner. Two pentagons and a decagon fit round one point (108° + 108° + 144° = 360°), but that mix cannot be carried across a whole floor.",
      formula: "90° + 135° + 135° = 360°",
    },
  ],
  challenge: {
    title: "Finish the corner",
    text: "A tiler has started three floors and left a corner half done. Add tiles from the box to fill each corner with no gap and no overlap. One star per corner.",
  },
  quiz: [
    {
      q: "What is the angle at each corner of a regular hexagon?",
      options: ["60°", "108°", "120°", "135°"],
      answer: 2,
      why: "180° − (360° ÷ 6) = 180° − 60° = 120°. Three of them make 360°, so hexagons tile, like a honeycomb.",
    },
    {
      q: "Each corner of a regular octagon is 135°. How many octagons fit round one point?",
      options: ["2, with no gap", "3, with no gap", "4, with no gap", "None exactly: two leave a 90° gap"],
      answer: 3,
      why: "Two octagons make 270°, leaving 360° − 270° = 90°. A third would need 135°, more than 90°, so it overlaps. A square (90°) fills the gap, which is the octagon-and-square floor.",
    },
    {
      q: "Two regular 12-gons (150° each) meet at a point. Which one tile fills the gap exactly?",
      options: ["A square", "A triangle", "A hexagon", "A pentagon"],
      answer: 1,
      why: "360° − (150° + 150°) = 360° − 300° = 60°, the angle of an equilateral triangle.",
    },
    {
      q: "What is the angle at each corner of a regular 9-sided polygon?",
      options: ["120°", "135°", "140°", "160°"],
      answer: 2,
      why: "180° − (360° ÷ 9) = 180° − 40° = 140°.",
    },
    {
      q: "On a floor, three triangles and some squares meet at every corner. How many squares?",
      options: ["1", "2", "3", "4"],
      answer: 1,
      why: "The triangles use 3 × 60° = 180°. The squares must fill 360° − 180° = 180°, and 180° ÷ 90° = 2.",
    },
  ],
};

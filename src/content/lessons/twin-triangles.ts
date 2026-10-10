/**
 * Class 7 · Ganita Prakash (Part 2) · Chapter "Geometric Twins".
 * Covers congruent triangles: which clues (SSS, SAS, ASA, RHS) always pin down exactly one
 * triangle, and why SSA (two triangles can fit) and AAA (any size fits) do not.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import { triFromSAS, type TwinRound } from "@/lib/sim/congruence";
import type { LessonDef } from "./types";

export const LESSON_ID = "c7-twin-triangles";

/** Challenge: three triangles to describe to a friend, each with a rule. One star each. */
export const TWIN_ROUNDS: TwinRound[] = [
  {
    name: "The broken ruler",
    brief: "Your friend's ruler snapped, so she can measure only one length. Pick a clue that sends just one length and still gives her exactly your flag.",
    target: triFromSAS(8, 50, 7),
    rule: "oneLength",
  },
  {
    name: "The lost protractor",
    brief: "Now her protractor is lost, so she cannot draw any angle, not even a right angle. Pick a clue with lengths only.",
    target: { A: { x: 0, y: 8 }, B: { x: 6, y: 0 }, C: { x: 0, y: 0 } },
    rule: "noAngles",
  },
  {
    name: "Two sides and one angle",
    brief: "This time you may send exactly two sides and one angle. Careful: one way of choosing them can fit two different triangles.",
    target: triFromSAS(10, 30, 12),
    rule: "twoSidesOneAngle",
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "twin-maker",
  classNum: 7,
  book: "Ganita Prakash Part 2",
  chapter: "Geometric Twins",
  title: "Twin triangles",
  intro: {
    objective:
      "Send a friend three clues about a triangle and see every triangle that fits them. Find out which clues always give an exact twin, and which ones can fool your friend.",
    learn: [
      "Congruent triangles are twins: one fits exactly on the other",
      "SSS, SAS, ASA and RHS each pin down exactly one triangle",
      "Why SSA can fit two different triangles",
      "Why AAA fixes the shape but not the size",
    ],
    realLife:
      "Factories cut thousands of identical parts, like the triangular brackets under a shelf or the panels of a roof truss. Carpenters and tailors copy a shape exactly by measuring just enough of it.",
    minutes: 20,
  },
  hook: {
    title: "A flag over the phone",
    text:
      "Meera has cut a triangular flag for her school's sports day. Her cousin in Pune wants an exact copy, a twin. Meera can send only three measurements in a message. Which three should she send so that the copy is sure to match?",
  },
  predict: {
    question: "Meera sends only the three angles: 50°, 60° and 70°. Will her cousin's flag surely match hers?",
    options: ["Yes, the angles fix the triangle", "No, it could be a different size", "No, these angles cannot make a triangle"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:sss",
      title: "Three sides",
      text: "The SSS clue starts with sides 8 cm, 3 cm and 4 cm, which cannot meet. Change the sides until a triangle appears. How many triangles fit?",
      found:
        "Once any two sides together were longer than the third, exactly one triangle fitted. You can turn it or flip it over, but every triangle with those three sides is the same. SSS is enough to make a twin.",
    },
    {
      id: "task:three",
      title: "Three more sure clues",
      text: "Try SAS, ASA and RHS. Check that each one gives exactly one triangle.",
      found:
        "Two sides with the angle between them (SAS), two angles with the side between them (ASA), and a right angle with the hypotenuse and one side (RHS) each pinned down exactly one triangle.",
    },
    {
      id: "task:ssa",
      title: "The tricky clue",
      text: "Pick SSA: sides AB and BC with ∠A, which is not between them. Change BC until two triangles fit.",
      found:
        "When BC was shorter than AB but still long enough to reach the slanted line from A, it could swing to two places, C₁ and C₂. Two different triangles fitted the same clue, so SSA does not promise a twin.",
    },
    {
      id: "task:aaa",
      title: "Angles only",
      text: "Pick AAA and change the angles. Look at the triangles that fit.",
      found:
        "All the triangles had the same shape but different sizes, like a photo and its enlargement. AAA fixes the shape, never the size. And once you chose ∠A and ∠B, ∠C was already decided, because the three angles add up to 180°.",
    },
  ],
  discovery: {
    scientist: "Thales of Miletus",
    years: "c. 624–546 BCE",
    fact: "Thales is often called the first Greek mathematician. About 1,000 years later the writer Proclus said Thales must have used the ASA rule to find how far a ship was from the shore: copy the two angles and the side between them on land, and the copy has the same distance.",
    formula: "∠B, BC and ∠C known → only one triangle (ASA)",
    formulaNote: "Two angles and the side between them pin the triangle down, so you can measure it on land instead of at sea.",
  },
  symbols: [
    { sym: "△ABC", meaning: "the triangle with corners A, B and C" },
    { sym: "≅", meaning: "is congruent to: is an exact twin of" },
    { sym: "∠A", meaning: "the angle at corner A" },
    { sym: "AB", meaning: "the side from A to B, or its length" },
    { sym: "S, A", meaning: "in a clue name, S is a side and A is an angle" },
    { sym: "R, H", meaning: "in RHS, R is a right angle (90°) and H is the hypotenuse, the side facing it" },
    { sym: "C₁, C₂", meaning: "two different places where corner C can go" },
    { sym: "°", meaning: "degrees" },
    { sym: "cm", meaning: "centimetres" },
  ],
  ideas: [
    {
      title: "Congruent means twins",
      text: "Two triangles are congruent if one fits exactly on the other, after turning or flipping it. Matching corners are written in the same order, so all six parts match.",
      formula: "△ABC ≅ △PQR:   AB = PQ,  BC = QR,  CA = RP,  ∠A = ∠P,  ∠B = ∠Q,  ∠C = ∠R",
    },
    {
      title: "Four clues that always work",
      text: "You do not need all six parts. Any one of these four clues fixes the triangle. Two angles and any one side also work, because the third angle is 180° minus the other two, which turns it into ASA.",
      formula: "SSS;   SAS (angle between the sides);   ASA (side between the angles);   RHS (right angle)",
    },
    {
      title: "Why SSA can fool you",
      text: "Fix side AB and the angle at A. Side BC is like a stick hinged at B. If it is shorter than AB but long enough to reach the line from A, it can land in two places.",
      formula: "SSA: zero, one or two triangles can fit",
    },
    {
      title: "Why AAA is not enough",
      text: "Triangles with the same angles have the same shape, but they can be any size. A small and a large set square with the same angles are not twins.",
      formula: "AAA fixes the shape, not the size",
    },
  ],
  challenge: {
    title: "Clues for a friend",
    text: "Three triangles to describe to a friend, each with a rule: a broken ruler, a lost protractor, or exactly two sides and one angle. Pick a clue that keeps the rule and lets only one triangle fit.",
  },
  quiz: [
    {
      q: "△ABC and △PQR have AB = PQ, BC = QR and CA = RP. Which clue shows they are congruent?",
      options: ["SSS", "SAS", "ASA", "AAA"],
      answer: 0,
      why: "All three pairs of sides match, so the triangles are congruent by SSS.",
    },
    {
      q: "You know AB = 5 cm, AC = 7 cm and ∠A = 40°. Which clue is this?",
      options: ["ASA", "SSA", "SAS", "RHS"],
      answer: 2,
      why: "∠A is the angle between sides AB and AC, so this is side, angle, side: SAS.",
    },
    {
      q: "Two triangles both have angles 30°, 60° and 90°. Must they be congruent?",
      options: ["Yes, by AAA", "Only if a matching side is also equal", "Yes, by RHS", "They can never be congruent"],
      answer: 1,
      why: "Equal angles give the same shape but not the same size. If one matching side is also equal, they are congruent by ASA.",
    },
    {
      q: "AB = 10 cm, ∠A = 30° and BC = 6 cm. (∠A is not between AB and BC.) How many different triangles fit?",
      options: ["None", "Exactly one", "Two", "As many as you like"],
      answer: 2,
      why: "Draw it: the 6 cm stick from B reaches the slanted line from A in two places, about 5.3 cm and 12 cm from A. Two triangles fit, which is why SSA is not a congruence rule.",
    },
    {
      q: "Two shelf brackets each have a right angle, a 30 cm slanted side (the hypotenuse) and an 18 cm side along the wall. Are they congruent?",
      options: ["Yes, by RHS", "Yes, by AAA", "No, an angle is missing", "No, we need all three sides"],
      answer: 0,
      why: "Right angle, hypotenuse and one side match, so they are congruent by RHS.",
    },
  ],
};

/**
 * Class 8 · Curiosity · "Light: Mirrors and Lenses", second lab.
 * Fills gaps the first lab (mirrors-lenses.ts) leaves: multiple images in two plane mirrors
 * at an angle (n = (360° ÷ θ) − 1) and the kaleidoscope, endless images in parallel mirrors, and
 * using a convex lens or a concave mirror to bring sunlight to a focus, which is how we find
 * the focal length and how a solar cooker works.
 * Recheck wording and activities against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c8-kaleidoscope";

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "pattern-maker",
  classNum: 8,
  book: "Curiosity",
  chapter: "Light: Mirrors and Lenses",
  title: "Kaleidoscopes and burning spots",
  intro: {
    objective:
      "Hinge two mirrors to count the images of a bangle, make a kaleidoscope and an endless barber-shop tunnel, then focus sunlight with a magnifying glass and a solar cooker dish.",
    learn: [
      "Two mirrors at an angle θ make (360° ÷ θ) − 1 images",
      "Why a kaleidoscope uses mirrors at 60°, and why parallel mirrors make endless images",
      "A convex lens and a concave mirror bring sunlight to a point: the focus",
      "The distance from the lens or mirror to that point is its focal length",
    ],
    realLife:
      "Kaleidoscopes, the mirror tunnels in barber shops and lifts, trial rooms with angled mirrors, solar cookers and solar power towers all use these tricks.",
    minutes: 25,
  },
  hook: {
    title: "One bangle, a whole shop",
    text:
      "Stand in a trial room with two mirrors at an angle and suddenly there are several of you. Look into a kaleidoscope and a few broken bangle pieces become a perfect flower. Sit in a barber's chair between two mirrors and your head repeats until it disappears into the distance. And on a sunny day a small magnifying glass can burn a hole in paper. All of these are mirrors and lenses doing what you met in the first lab, just more than once.",
  },
  predict: {
    question: "Two mirrors are hinged at 60°, like an open book. You put one bangle between them. How many images of the bangle do you see?",
    options: ["2", "5", "So many they never end"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:corner",
      title: "The corner mirror",
      text: "On Hinged mirrors, set the angle to 90°. Count the images, then move the bangle around between the mirrors.",
      found:
        "At 90° there are 3 images wherever the bangle is: one in each mirror, and one in the corner made by light bouncing off both mirrors. Look at the blue bead: each image made by one bounce is flipped, and the corner image, made by two bounces, is flipped back.",
    },
    {
      id: "task:kaleido",
      title: "Make a kaleidoscope",
      text: "Set the angle to 60°. Count the images.",
      found:
        "At 60° there are 5 images, and with the bangle they make a perfect six-part pattern. A kaleidoscope is three mirror strips joined into a triangle, so every pair of mirrors meets at 60°. That is why its patterns always have six parts.",
    },
    {
      id: "task:formula",
      title: "Find the rule",
      text: "Try at least three more angles, such as 45°, 36° and 30°. Compare the number of images with (360° ÷ θ) − 1.",
      found:
        "Smaller angles give more images, and the number of images matched (360° ÷ θ) − 1 each time: 7 at 45°, 9 at 36° and 11 at 30°. When 360° ÷ θ is odd (at 120°, 72° or 40°) the count can be one more if the bangle is not exactly in the middle.",
    },
    {
      id: "task:parallel",
      title: "The barber's tunnel",
      text: "Switch to Parallel mirrors and look at the images.",
      found:
        "When the mirrors face each other, the angle between them is 0°, and 360° ÷ 0° has no end. Light keeps bouncing back and forth, so the images go on forever, each one further away. Each bounce loses a little light, so they get dimmer until you can no longer see them.",
    },
    {
      id: "task:burn",
      title: "Burn a hole with sunlight",
      text: "Switch to Sunlight with the magnifying glass. Slide the card until the spot is as small and bright as you can make it, and hold it there until the card burns.",
      found:
        "The spot was smallest and brightest when the card was 15 cm from the lens: over 1600 times brighter than plain sunlight, so the card charred within a second. A convex lens bends sunlight to a point called the focus, and the distance from the lens to it is the focal length. The spot is not a perfect point: it is a tiny image of the Sun.",
    },
    {
      id: "task:dish",
      title: "Cook with a mirror",
      text: "Pick the Solar cooker dish and find where it burns the card.",
      found:
        "A concave mirror also brings sunlight to a focus, but in front of the mirror, because it reflects the light back. This dish has a focal length of 40 cm. Solar cookers put the cooking pot at the focus, and solar power towers use thousands of mirrors to heat one spot.",
    },
  ],
  discovery: {
    scientist: "David Brewster",
    years: "1781–1868",
    fact: "Brewster, a Scottish scientist who studied how light reflects, invented the kaleidoscope in 1816 and named it from the Greek for 'seeing beautiful shapes'. He worked out that the mirrors must meet at an angle that divides 360° exactly for the pattern to be perfect. Copies sold in huge numbers in London and Paris within months, but his patent did not stop other makers from copying it, so he earned very little from it.",
    formula: "n = (360° ÷ θ) − 1",
    formulaNote:
      "n is the number of images you see. θ (the Greek letter theta) is the angle between the two mirrors, in degrees. 360° is one full turn. ÷ means divide and − means take away. The brackets say: divide first, then take away 1. We take away 1 because one of the pieces of the full turn holds the real object, not an image. It is exact when 360° ÷ θ is even, or when the object is exactly in the middle.",
  },
  ideas: [
    {
      title: "Images of images",
      text: "Each mirror makes an image of the bangle. That image can itself be seen in the other mirror, making an image of an image, and so on. Every image sits as far from the hinge as the real bangle. An image made by an odd number of bounces is flipped left to right; one made by an even number is not.",
    },
    {
      title: "How many images?",
      text: "Close the mirrors to a smaller angle and you get more images. At 180° the two mirrors make one flat mirror and one image. At 90° there are 3, at 60° there are 5, at 45° there are 7. If 360° ÷ θ is odd and the object is off-centre, you see one more than the rule.",
      formula: "n = (360° ÷ θ) − 1",
    },
    {
      title: "Reading the rule",
      text: "n is the number of images you see. θ (the Greek letter theta) is the angle between the two mirrors, in degrees. 360° is one full turn. ÷ means divide and − means take away. The two mirrors cut the full turn into 360° ÷ θ equal slices, and one slice holds the real object, so the images are that number minus 1. Work out the bracket first, then take away 1. At 60°: (360° ÷ 60°) − 1 = 6 − 1 = 5.",
      formula: "(360° ÷ 60°) − 1 = 6 − 1 = 5",
    },
    {
      title: "Kaleidoscopes and mirror tunnels",
      text: "A kaleidoscope has three mirrors at 60° to each other, so the bits of glass inside repeat into a six-part pattern. Parallel mirrors are like an angle of 0°: light bounces back and forth without end, making a tunnel of images that slowly fade because each bounce loses a little light.",
    },
    {
      title: "Focusing sunlight",
      text: "Rays from the Sun arrive almost parallel. A convex lens bends them and a concave mirror reflects them so they meet at one point, the focus. The distance from the lens or mirror to the focus is the focal length. Holding a card there is a quick way to measure it. All the sunlight that falls on the lens is packed into a tiny spot, so it gets hot enough to burn paper.",
      formula: "Smallest, brightest spot at d = f",
    },
  ],
  challenge: {
    title: "Count the bangles",
    text: "Each round asks for an exact number of images: 7, 11 and then 4. Set the mirror angle and move the bangle, then tap Check. One star per round.",
  },
  quiz: [
    {
      q: "Two plane mirrors are placed at 45° to each other. How many images of a coin between them will you see?",
      options: ["4", "7", "8", "45"],
      answer: 1,
      why: "n = (360° ÷ 45°) − 1 = 8 − 1 = 7.",
    },
    {
      q: "You want to see 11 images of a toy between two mirrors. What angle should the mirrors make?",
      options: ["11°", "30°", "33°", "36°"],
      answer: 1,
      why: "(360° ÷ θ) − 1 = 11. Add 1 to both sides: 360° ÷ θ = 12, so θ = 360° ÷ 12 = 30°.",
    },
    {
      q: "Why do the images in two facing mirrors in a barber shop get dimmer and dimmer?",
      options: [
        "The mirrors are curved",
        "Each bounce off a mirror loses a little of the light",
        "Light slows down after many bounces",
        "The far images are made by a different mirror",
      ],
      answer: 1,
      why: "No mirror reflects all the light. After many bounces only a little is left, so the far images fade away.",
    },
    {
      q: "A convex lens makes the smallest, brightest spot of sunlight on a paper held 20 cm away. What is its focal length?",
      options: ["10 cm", "20 cm", "40 cm", "It cannot be found this way"],
      answer: 1,
      why: "Sunlight is almost parallel, so it meets at the focus. The distance to the smallest spot is the focal length: 20 cm.",
    },
    {
      q: "Which of these is used in a solar cooker to collect sunlight on the cooking pot?",
      options: ["A convex mirror", "A plane mirror", "A concave mirror", "A concave lens"],
      answer: 2,
      why: "A concave mirror reflects parallel sunlight so it meets at its focus, where the pot is placed.",
    },
  ],
};

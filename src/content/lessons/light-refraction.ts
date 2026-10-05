/**
 * Class 10 · Science · "Light: Reflection and Refraction".
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c10-light";

/** Challenge: focus a projector. Screen distances (cm right of the lens), one star each. */
export const SCREEN_ROUNDS = [30, 20, 60];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "lens-crafter",
  classNum: 10,
  book: "Science",
  chapter: "Light: Reflection and Refraction",
  title: "Bend light, build images",
  hook: {
    title: "Closer than they appear",
    text:
      "A car's side mirror warns: \"Objects in mirror are closer than they appear.\" A phone camera squeezes a whole street onto a sensor smaller than your fingernail. Both tricks come from bending and bouncing light. Bend some yourself.",
  },
  predict: {
    question: "A beam of light goes from air into a glass block at a slant. What happens to it?",
    options: ["It bends towards the normal", "It bends away from the normal", "It carries on in a straight line"],
    answer: 0,
  },
  tasks: [
    {
      id: "task:bend",
      title: "Into the glass",
      text: "On the Glass block bench, set the angle of incidence to 30° or more. Watch the ray as it enters the glass, and again as it leaves.",
      found:
        "Going from air into glass, light slows down and bends towards the normal, so r is smaller than i. Leaving the block it bends away by the same amount, so it comes out parallel to where it started, just shifted sideways.",
    },
    {
      id: "task:snell",
      title: "Find the magic number",
      text: "Try at least three different angles (say 20°, 40° and 60°) and watch sin i ÷ sin r each time. Then switch to water or diamond.",
      found:
        "sin i ÷ sin r stays the same for a material whatever the angle: 1.52 for this glass, 1.33 for water, 2.42 for diamond. That constant is the refractive index, and it is Snell's law. Diamond bends light the most.",
    },
    {
      id: "task:camera",
      title: "Shrink the street",
      text: "Switch to the Lens bench with a convex lens. Move the object beyond 2F₁ (more than twice the focal length away).",
      found:
        "The image is real, inverted and diminished, formed between F₂ and 2F₂. That is exactly how a camera puts a big scene onto a small sensor.",
    },
    {
      id: "task:magnifier",
      title: "Magnifying glass",
      text: "Keep the convex lens. Now bring the object closer than F₁ (nearer than one focal length).",
      found:
        "The rays now spread out after the lens, so no real image forms. Traced backwards they meet behind the object: a virtual, erect, enlarged image. That is a magnifying glass.",
    },
    {
      id: "task:mirror",
      title: "Rear-view mirror",
      text: "Switch to the Mirror bench and pick a convex mirror. Move the object near and far.",
      found:
        "A convex mirror always gives a virtual, erect, diminished image behind it, and shows a wide field of view. Things look smaller, so they seem further away: that is why the car mirror warns you.",
    },
  ],
  ideas: [
    {
      title: "Laws of refraction",
      text: "The incident ray, the refracted ray and the normal all lie in one plane. For a given pair of media, sin i ÷ sin r is constant (Snell's law).",
      formula: "sin i ÷ sin r = n₂₁ (constant)",
    },
    {
      title: "Refractive index",
      text: "How much a material slows light. Light travels at 3 × 10⁸ m/s in vacuum and slower in glass or water. An optically denser medium has a larger refractive index.",
      formula: "n = speed of light in vacuum ÷ speed of light in the medium",
    },
    {
      title: "Lens and mirror formulas",
      text: "Measure every distance from the lens's optical centre or the mirror's pole. Distances in the direction light travels are positive; the object is on the left, so u is negative.",
      formula: "Lens: 1/v − 1/u = 1/f    Mirror: 1/v + 1/u = 1/f",
    },
    {
      title: "Magnification and power",
      text: "Negative magnification means a real, inverted image; positive means virtual and erect. Power in dioptres is 1 ÷ f with f in metres: positive for convex, negative for concave lenses.",
      formula: "Lens: m = v/u    Mirror: m = −v/u    P = 1/f (D)",
    },
  ],
  challenge: {
    title: "Focus the projector",
    text: "A screen stands to the right of a convex lens. Move the object (and change the focal length if you like) until a sharp image lands on the screen. Three screens, one star each.",
  },
  quiz: [
    {
      q: "Light goes from air into water. Compared with the angle of incidence, the angle of refraction is…",
      options: ["Larger", "Smaller", "The same", "Always 90°"],
      answer: 1,
      why: "Water is optically denser than air, so light bends towards the normal and r < i.",
    },
    {
      q: "The refractive index of diamond is 2.42. What does this mean?",
      options: [
        "Light travels 2.42 times faster in diamond than in vacuum",
        "Light travels 2.42 times slower in diamond than in vacuum",
        "Diamond reflects 2.42 times more light",
        "Diamond is 2.42 times heavier than glass",
      ],
      answer: 1,
      why: "n = speed in vacuum ÷ speed in the medium, so light is 2.42 times slower in diamond.",
    },
    {
      q: "An object is 15 cm from a convex lens of focal length 10 cm. Where is the image?",
      options: ["6 cm on the same side", "30 cm on the other side", "25 cm on the other side", "At infinity"],
      answer: 1,
      why: "1/v = 1/f + 1/u = 1/10 − 1/15 = 1/30, so v = +30 cm: real, on the other side.",
    },
    {
      q: "Which mirror is used as a rear-view mirror in vehicles?",
      options: ["Plane", "Concave", "Convex", "Any of these"],
      answer: 2,
      why: "A convex mirror always gives an erect, diminished image and a wider field of view.",
    },
    {
      q: "What is the power of a concave lens of focal length 2 m?",
      options: ["+2 D", "−2 D", "+0.5 D", "−0.5 D"],
      answer: 3,
      why: "P = 1/f = 1/(−2 m) = −0.5 D. Concave lenses have negative power.",
    },
    {
      q: "Where should an object be placed in front of a concave mirror to get a real image the same size as the object?",
      options: ["At the focus F", "At the centre of curvature C", "Between F and P", "At infinity"],
      answer: 1,
      why: "At C, the image forms at C too: real, inverted and the same size.",
    },
    {
      q: "A lens gives a magnification of −0.5. The image is…",
      options: ["Virtual, erect, smaller", "Real, inverted, smaller", "Real, inverted, larger", "Virtual, erect, larger"],
      answer: 1,
      why: "Negative m means real and inverted; |m| = 0.5 means half the size.",
    },
  ],
};

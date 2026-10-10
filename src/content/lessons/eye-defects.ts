/**
 * Class 10 · Science · "The Human Eye and the Colourful World" (second lab).
 * Covers NCERT §10.1 (power of accommodation, near point 25 cm and far point at infinity, cataract)
 * and §10.2 (defects of vision: presbyopia, bi-focal lenses with a concave upper part and a convex
 * lower part), with the lens formula and P = 1/f from the chapter "Light: Reflection and Refraction".
 * The first lab for this chapter (human-eye.ts) covers myopia, hypermetropia and the glass prism,
 * and sky-colours.ts covers scattering, atmospheric refraction and the rainbow.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c10-eye-defects";

/**
 * Challenge: the spectacle shop. Each customer's amplitude of accommodation (dioptres) is hidden,
 * so their near point is 1/amp metres and the right reading glasses are 4 − amp dioptres.
 */
export const CUSTOMERS = [
  { name: "Ramesh ji, the tailor", complaint: "I cannot thread my needle any more.", scene: "needle", amp: 2 },
  { name: "Sunita aunty", complaint: "The messages on my phone look fuzzy unless I hold it far away.", scene: "newspaper", amp: 1.5 },
  { name: "Shanti Dadi", complaint: "Even at arm's length the newspaper is a blur.", scene: "newspaper", amp: 0.5 },
] as const;

/** A prescription counts if it is within this many dioptres of the exact answer. */
export const POWER_TOLERANCE_D = 0.25;

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "near-point-navigator",
  classNum: 10,
  book: "Science",
  chapter: "The Human Eye and the Colourful World",
  title: "Dadi's reading glasses",
  intro: {
    objective:
      "Find your near point, watch it move away as the eye gets older, then design the reading glasses and bifocals that bring the newspaper back into focus.",
    learn: [
      "Accommodation: how the eye focuses from 25 cm (near point) to infinity (far point)",
      "Presbyopia: why the near point moves away with age",
      "How to find the power of reading glasses using P = 1/f",
      "How bifocal lenses work, and what a cataract is",
    ],
    realLife:
      "Your grandparents reading the newspaper at arm's length, the tailor in your market threading a needle, the reading glasses sold at every chemist and the eye camps that do free cataract surgery.",
    minutes: 25,
  },
  hook: {
    title: "The newspaper at arm's length",
    text:
      "Every morning Dadi picks up the newspaper and slowly pushes it further and further away, squinting. You read the same paper at 25 cm with no trouble. The tailor in your market used to thread a needle in one go and now asks his grandson to do it. Nothing is wrong with their eyeballs. So what changed? Grow an eye older, year by year, and find out.",
  },
  predict: {
    question: "Dadi is 65 and has no glasses on. To read the newspaper clearly, where must she hold it?",
    options: ["Closer to her eyes than you do", "At the same 25 cm as you", "Further from her eyes than you do"],
    answer: 2,
  },
  tasks: [
    {
      id: "task:nearpoint",
      title: "Find your near point",
      text: "Keep the age at 15 or below and pick the newspaper. Bring it closer and closer until the words just go blurry. Find the closest spot where they are still sharp.",
      found:
        "The closest you can see clearly is about 25 cm. This is the near point, or least distance of distinct vision. Watch the eye lens: as the paper comes closer, the ciliary muscles squeeze it fatter for more power. At 25 cm they cannot squeeze any more. Look at the far bus and the lens relaxes thin: the far point of a normal eye is at infinity. This changing of focal length is called accommodation.",
    },
    {
      id: "task:age",
      title: "Grow old",
      text: "Take off any glasses and pick the newspaper. Slide the age to 60 or more. Hold the paper at reading distance (40 cm or closer), then move it away until it is sharp again.",
      found:
        "At 60 the near point has moved out to about 1 m, so Dadi has to hold the paper at arm's length. The ciliary muscles get weaker and the eye lens gets stiffer with age, so it cannot become fat enough for near things. This is presbyopia. Far things still look fine.",
    },
    {
      id: "task:reading",
      title: "Reading glasses for Dadi",
      text: "Keep the age at 55 or more and hold the newspaper at 25 cm. Choose Reading glasses and find a lens power that makes the words sharp.",
      found:
        "A convex lens adds the power the stiff eye lens is missing. For a near point of 1 m, a +3 D lens makes a virtual image of the paper (at 25 cm) 1 m away, right where Dadi can focus: (1 ÷ v) − (1 ÷ u) = 1 ÷ f gives 1/(−1) − 1/(−0.25) = 3, so P = +3 D.",
    },
    {
      id: "task:bifocal",
      title: "Make a bifocal",
      text: "Nana is short-sighted too. Tick Short-sighted too (far point 2 m), keep the age at 55 or more and choose Bifocal. Make the far bus sharp through the top half and the newspaper at 25 cm sharp through the bottom half.",
      found:
        "The top half is a concave lens (about −0.5 D, since f = −2 m) for far things. The bottom half is a convex lens (about +3 D) for reading. When Nana looks straight ahead he sees through the top, and when he looks down at the paper he sees through the bottom. One pair of glasses, two jobs.",
    },
    {
      id: "task:cataract",
      title: "A cloudy lens",
      text: "Tick Cataract. Now try any glasses you like on the newspaper or the bus.",
      found:
        "No spectacle lens helps, because the light is scattered by the cloudy eye lens itself. This is a cataract: in old age the eye lens can become milky and cloudy, and vision dims. It is fixed by cataract surgery, which replaces the cloudy lens with a clear artificial one. India does lakhs of these operations every year, many of them free at eye camps and government hospitals.",
    },
  ],
  discovery: {
    scientist: "Benjamin Franklin",
    years: "1706–1790",
    fact: "Franklin, the scientist who studied lightning, needed one pair of spectacles to see far and another to read. Tired of swapping them, he had the two lenses cut in half and joined in one frame: far lens on top, reading lens below. In a 1784 letter, when he was 78, he wrote about these \"double spectacles\". He is usually credited with inventing bifocals.",
    formula: "P = 1 ÷ f",
    formulaNote: "The power of a lens in dioptres is 1 divided by its focal length in metres. A convex lens has positive power, a concave lens negative.",
  },
  symbols: [
    { sym: "P", meaning: "power of the lens, in dioptres (D)" },
    { sym: "f", meaning: "focal length, in metres" },
    { sym: "u", meaning: "distance of the object from the lens (negative in front)" },
    { sym: "v", meaning: "distance of the image from the lens" },
    { sym: "d", meaning: "near point: the closest distance you can read at, in m" },
  ],
  ideas: [
    {
      title: "Accommodation",
      text: "The eye lens is soft and its shape is changed by the ciliary muscles. For far things they relax, the lens is thin and has its least power. For near things they squeeze, the lens gets thicker and its power rises. The distance from the lens to the retina never changes, so the eye changes its focal length instead. A normal eye sees clearly from its near point (about 25 cm) to its far point (infinity).",
      formula: "(1 ÷ v) − (1 ÷ u) = 1 ÷ f   with v = 2.5 cm fixed",
    },
    {
      title: "Presbyopia",
      text: "With age the ciliary muscles weaken and the eye lens loses flexibility, so the power of accommodation falls. The near point slowly moves away: about 25 cm for a teenager, about 1 m at 60. Near things blur, so people hold books and phones far away. It is corrected with a convex lens (reading glasses).",
      formula: "Reading glasses: P = (1 ÷ 0.25) − (1 ÷ d)   (d = near point in metres)",
    },
    {
      title: "Bifocal lenses",
      text: "Some people have both myopia and hypermetropia. They often need bifocal lenses. The common kind has a concave lens in the upper part for distant vision and a convex lens in the lower part for near vision. Many people today use progressive lenses, where the power changes smoothly from top to bottom.",
    },
    {
      title: "Cataract",
      text: "Sometimes, mostly in old age, the eye lens becomes milky and cloudy. This is a cataract. It causes partial or complete loss of vision, and no spectacles can fix it. Vision is restored by cataract surgery, where the cloudy lens is removed and a clear artificial lens is put in.",
    },
  ],
  challenge: {
    title: "Spectacle shop",
    text: "Three customers come to your counter. Their ages are hidden. Measure each one's near point with the sim (no glasses, move the object until it just turns sharp), work out the power with P = (1 ÷ 0.25) − (1 ÷ d), set it and hand over the glasses. One star per customer.",
  },
  quiz: [
    {
      q: "What is the near point of a normal young adult eye?",
      options: ["About 2.5 cm", "About 25 cm", "About 1 m", "Infinity"],
      answer: 1,
      why: "The least distance of distinct vision for a young adult with normal vision is about 25 cm.",
    },
    {
      q: "Presbyopia happens mainly because…",
      options: [
        "The eyeball becomes too long",
        "The ciliary muscles weaken and the eye lens becomes less flexible",
        "The retina stops working",
        "The cornea becomes cloudy",
      ],
      answer: 1,
      why: "With age the eye lens cannot become thick enough for near objects, so the near point moves away.",
    },
    {
      q: "Dadi's near point is 1 m. What power of reading glasses lets her read at 25 cm?",
      options: ["−3 D", "+1 D", "+3 D", "+4 D"],
      answer: 2,
      why: "P = (1 ÷ 0.25) − (1 ÷ 1) = 4 − 1 = +3 D. The lens forms a virtual image of the page 1 m away, where she can focus.",
    },
    {
      q: "In a common bifocal lens, the upper part is…",
      options: [
        "A concave lens, for seeing far away",
        "A convex lens, for reading",
        "Plain glass",
        "A prism, to split light",
      ],
      answer: 0,
      why: "The upper concave part helps distant vision; the lower convex part helps near vision.",
    },
    {
      q: "A cataract is treated by…",
      options: ["Wearing a concave lens", "Wearing a convex lens", "Surgery that replaces the cloudy eye lens", "Eye exercises"],
      answer: 2,
      why: "A cataract is a cloudy eye lens, so no spectacles help. Surgery replaces it with a clear artificial lens.",
    },
  ],
};

/**
 * Class 10 · Science · "The Human Eye and the Colourful World".
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { EyeCondition, TargetId } from "@/lib/sim/eye";
import type { LessonDef } from "./types";

export const LESSON_ID = "c10-human-eye";

/** Challenge: the eye clinic. Each patient's accommodation range (dioptres) is hidden; one star each. */
export const PATIENTS: { name: string; complaint: string; condition: EyeCondition; target: TargetId; min: number; max: number }[] = [
  { name: "Riya, 14", complaint: "I can't read the stars at night.", condition: "myopia", target: "stars", min: 41, max: 44 },
  { name: "Arjun, 15", complaint: "My textbook looks fuzzy.", condition: "hypermetropia", target: "book", min: 40, max: 42 },
  { name: "Dadi, 68", complaint: "I need to hold the newspaper far away to read it.", condition: "hypermetropia", target: "book", min: 40, max: 41.5 },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "eye-doctor",
  classNum: 10,
  book: "Science",
  chapter: "The Human Eye and the Colourful World",
  title: "See clearly, split the light",
  intro: {
    objective:
      "Look inside a working eye to see how it focuses, how glasses fix vision, and how a prism splits white light into colours.",
    learn: [
      "How the eye lens changes shape to focus (accommodation)",
      "Why myopia and hypermetropia happen and which lens corrects each",
      "How a prism splits white light into a spectrum (dispersion)",
      "Why stars twinkle and the sky is blue",
    ],
    realLife:
      "Eye tests at school, the glasses many of your friends wear, rainbows after the monsoon and the red sunset sky all come from this chapter.",
    minutes: 25,
  },
  hook: {
    title: "The camera in your head",
    text:
      "Your eye refocuses from a phone in your hand to a cricket ball in the sky faster than any camera, and nobody presses a button. Yet one in three Indian teenagers needs glasses. And why is a rainbow always in the same colour order? Open up an eye and a prism to find out.",
  },
  predict: {
    question: "You look up from a book to a far mountain. What does your eye lens do?",
    options: ["Gets thicker", "Gets thinner", "Stays the same and the eye moves back"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:accommodate",
      title: "Near and far",
      text: "With a normal eye, look at the book, then at the stars. Watch the eye lens change shape.",
      found:
        "The ciliary muscles squeeze the eye lens fatter for near things (more power) and let it relax thinner for far things (less power), so the image always lands on the retina. This is accommodation. A normal eye sees clearly from 25 cm (near point) to infinity (far point).",
    },
    {
      id: "task:myopia",
      title: "Fix short sight",
      text: "Pick Myopia and look at the stars. They blur because the image forms in front of the retina. Find spectacles that make them sharp.",
      found:
        "A concave (diverging) lens of the right negative power spreads the light a little before it enters the eye, pushing the image back onto the retina. Myopia comes from an eyeball that is too long or an eye lens that is too strong.",
    },
    {
      id: "task:hyper",
      title: "Fix long sight",
      text: "Pick Hypermetropia and look at the book. Now find spectacles that make the words sharp.",
      found:
        "A convex (converging) lens adds the power the eye is missing, so the image moves forward onto the retina. Hypermetropia comes from a short eyeball or a weak eye lens. With age the eye lens stiffens and the near point recedes too: that is presbyopia.",
    },
    {
      id: "task:prism",
      title: "Split white light",
      text: "Switch to the glass prism and change the angle of incidence. Watch the colours fan out.",
      found:
        "Glass bends violet light the most and red the least, so white light splits into VIBGYOR. This is dispersion. A rainbow is the same thing done by millions of raindrops.",
    },
    {
      id: "task:newton",
      title: "Newton's trick",
      text: "Add the second, upside-down prism.",
      found:
        "The second prism bends each colour back by the same amount, so they join into white light again. Isaac Newton did this to show the colours were already in the white light, not made by the glass.",
    },
  ],
  discovery: {
    scientist: "Johannes Kepler",
    years: "1571–1630",
    fact: "Smallpox damaged Kepler's eyesight when he was a child, yet in 1604 he became the first to explain that the eye's lens throws an upside-down image onto the retina at the back of the eye.",
    formula: "(1 ÷ v) − (1 ÷ u) = 1 ÷ f",
    formulaNote: "The lens formula links the object distance u, the image distance v and the focal length f. The eye changes f to keep v fixed on the retina.",
  },
  symbols: [
    { sym: "u", meaning: "distance of the object from the eye lens (negative in front)" },
    { sym: "v", meaning: "distance of the image, the retina, from the lens" },
    { sym: "f", meaning: "focal length of the lens, in metres" },
    { sym: "P", meaning: "power of the glasses, in dioptres (D)" },
  ],
  ideas: [
    {
      title: "Power of accommodation",
      text: "The eye lens changes its focal length using the ciliary muscles. The least distance of distinct vision (near point) for a young adult is about 25 cm; the far point is infinity.",
    },
    {
      title: "Correcting defects of vision",
      text: "Myopia (near-sightedness): far point closer than infinity, image forms in front of the retina, corrected by a concave lens. Hypermetropia (far-sightedness): near point further than 25 cm, image forms behind the retina, corrected by a convex lens. Presbyopia: both, with age; often bifocal lenses.",
      formula: "Myopia: f = −(far point)    Power P = 1 ÷ f (f in metres)",
    },
    {
      title: "Dispersion",
      text: "Different colours bend by different amounts in glass, so a prism splits white light into a spectrum: Violet, Indigo, Blue, Green, Yellow, Orange, Red. Red bends least, violet most.",
    },
    {
      title: "Atmospheric refraction and scattering",
      text: "Air layers of different density bend starlight, so stars twinkle and the Sun is visible about 2 minutes before sunrise. Tiny particles scatter blue light more than red: the sky is blue and the setting Sun looks red.",
    },
  ],
  challenge: {
    title: "Eye clinic",
    text: "Three patients walk in. You can't see their eyes' ranges; only what they see. Choose spectacles that make their view sharp. One star per patient.",
  },
  quiz: [
    {
      q: "A student can't see the blackboard clearly from the back bench but reads a book easily. The defect is…",
      options: ["Hypermetropia", "Myopia", "Presbyopia", "Cataract"],
      answer: 1,
      why: "Far things blur and near things are clear: that is myopia (near-sightedness).",
    },
    {
      q: "Which lens corrects myopia?",
      options: ["Convex lens", "Concave lens", "Bifocal lens only", "A glass slab"],
      answer: 1,
      why: "A concave lens diverges light so the image moves back from in front of the retina onto it.",
    },
    {
      q: "A person's far point is 2 m. What power of lens do they need?",
      options: ["+2 D", "−2 D", "+0.5 D", "−0.5 D"],
      answer: 3,
      why: "The lens must have f = −2 m (it makes far objects appear at the far point), so P = 1 ÷ (−2) = −0.5 D.",
    },
    {
      q: "The ability of the eye to change its focal length is called…",
      options: ["Dispersion", "Accommodation", "Persistence of vision", "Refraction"],
      answer: 1,
      why: "Accommodation: the ciliary muscles change the eye lens's curvature.",
    },
    {
      q: "In a prism's spectrum, which colour bends the most?",
      options: ["Red", "Yellow", "Green", "Violet"],
      answer: 3,
      why: "Glass has the highest refractive index for violet, so violet deviates the most.",
    },
    {
      q: "Why do stars twinkle?",
      options: [
        "They switch on and off",
        "Moving air layers keep bending their light by slightly different amounts",
        "Clouds keep passing in front of them",
        "They are spinning",
      ],
      answer: 1,
      why: "Atmospheric refraction: starlight's path keeps changing through moving air of varying density.",
    },
    {
      q: "Why is the sky blue?",
      options: [
        "Air molecules scatter blue light more than red",
        "It reflects the sea",
        "The Sun gives out mostly blue light",
        "Ozone is blue",
      ],
      answer: 0,
      why: "Tiny molecules scatter short (blue) wavelengths much more than long (red) ones.",
    },
  ],
};

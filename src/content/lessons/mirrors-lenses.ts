/**
 * Class 8 · Curiosity · "Light: Mirrors and Lenses".
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c8-mirrors-lenses";

/** Challenge: make each of these images with a mirror. One star each. */
export const IMAGE_TARGETS = ["Virtual, erect, same size", "Virtual, erect, enlarged", "Real, inverted, same size"];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "mirror-maze",
  classNum: 8,
  book: "Curiosity",
  chapter: "Light: Mirrors and Lenses",
  title: "Mirror, mirror, which one?",
  intro: {
    objective:
      "Explore how plane, concave and convex mirrors and lenses form different kinds of images.",
    learn: [
      "Why a plane mirror image is the same size, erect and laterally inverted",
      "How concave and convex mirrors make images bigger or smaller",
      "The difference between a real image and a virtual image",
      "How convex and concave lenses bend light",
    ],
    realLife:
      "Shaving mirrors, car side mirrors, magnifying glasses and spectacles all use these mirrors and lenses.",
    minutes: 25,
  },
  hook: {
    title: "The backwards ambulance",
    text:
      "The word AMBULANCE is painted back to front on the bonnet. Car side mirrors make things look far away, while a shaving mirror makes your face look huge. Every one of these is a different mirror doing a different trick. Try them all.",
  },
  predict: {
    question: "You stand 2 m in front of a plane mirror. How far are you from your image?",
    options: ["2 m", "4 m", "1 m"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:plane",
      title: "Flat mirror",
      text: "On the Mirror bench pick the plane mirror. Move the object closer and further and watch where the image goes.",
      found:
        "The image is always as far behind the mirror as the object is in front, the same size and the right way up (erect). It can't be caught on a screen: it is virtual. Left and right swap too, which is why AMBULANCE is written backwards.",
    },
    {
      id: "task:big",
      title: "Shaving mirror",
      text: "Pick the concave mirror and bring the object very close, nearer than F.",
      found: "Close up, a concave mirror gives a big, erect image. Dentists and shaving mirrors use this to see small details.",
    },
    {
      id: "task:real",
      title: "Catch the image",
      text: "Keep the concave mirror and move the object far away, beyond C.",
      found:
        "Now the image forms in front of the mirror, upside down and smaller. Light really meets there, so you could catch it on a screen: a real image. Torches and headlights use concave mirrors to send light out in a strong beam.",
    },
    {
      id: "task:wide",
      title: "Side mirror",
      text: "Switch to the convex mirror and move the object around.",
      found: "A convex mirror always gives a small, erect image and shows a wide area behind. Cars and sharp road bends use it.",
    },
    {
      id: "task:magnify",
      title: "Magnifying glass",
      text: "Go to the Lens bench, pick a convex lens, and bring the object closer than F₁.",
      found:
        "A convex lens, thicker in the middle, makes close things look bigger: a magnifying glass. A concave lens, thinner in the middle, always makes things look smaller.",
    },
  ],
  ideas: [
    {
      title: "Plane mirror",
      text: "The image is erect, the same size, as far behind the mirror as the object is in front, and left and right are swapped (lateral inversion).",
    },
    {
      title: "Concave and convex mirrors",
      text: "A concave mirror curves inwards like a cave. It gives big images close up and real, upside-down images far away. A convex mirror bulges out and always gives smaller, erect images.",
    },
    {
      title: "Real and virtual images",
      text: "A real image forms where light actually meets, so it can be caught on a screen. A virtual image only seems to be there: the light just looks as if it comes from it.",
    },
    {
      title: "Lenses",
      text: "A convex lens is thicker in the middle and brings light together; up close it magnifies. A concave lens is thinner in the middle, spreads light out, and makes things look smaller.",
    },
  ],
  challenge: {
    title: "Image match",
    text: "Make each of these images using the mirrors: virtual, erect and same size; virtual, erect and enlarged; real, inverted and same size. One star each.",
  },
  quiz: [
    {
      q: "Which mirror is used as a side mirror in cars?",
      options: ["Plane mirror", "Concave mirror", "Convex mirror", "Any mirror"],
      answer: 2,
      why: "A convex mirror shows a wide area behind the car with small, erect images.",
    },
    {
      q: "Why is AMBULANCE written in reverse on the front of the vehicle?",
      options: [
        "To look stylish",
        "So drivers ahead read it correctly in their mirrors",
        "Because of a printing mistake",
        "So it can be read at night",
      ],
      answer: 1,
      why: "A plane mirror swaps left and right, so reversed letters read correctly in a mirror.",
    },
    {
      q: "Which image can be caught on a screen?",
      options: ["A real image", "A virtual image", "Any image", "Only images in a plane mirror"],
      answer: 0,
      why: "A real image forms where light really meets, so a screen can catch it.",
    },
    {
      q: "A dentist's mirror gives an enlarged view of a tooth. Which mirror is it?",
      options: ["Plane", "Concave", "Convex", "None of these"],
      answer: 1,
      why: "A concave mirror held close gives a big, erect image.",
    },
    {
      q: "A lens that is thicker in the middle than at the edges is…",
      options: ["A concave lens", "A convex lens", "A plane lens", "A mirror"],
      answer: 1,
      why: "Convex lenses bulge outwards: thick in the middle, thin at the edges.",
    },
    {
      q: "You walk towards a plane mirror at 1 m/s. How fast does your image come towards you?",
      options: ["0.5 m/s", "1 m/s", "2 m/s", "It stays still"],
      answer: 2,
      why: "You get 1 m closer to the mirror each second, and so does your image, so the gap between you closes by 2 m every second.",
    },
  ],
};

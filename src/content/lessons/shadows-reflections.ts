/**
 * Class 7 · Curiosity · "Light: Shadows and Reflections".
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c7-shadows";

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "shadow-master",
  classNum: 7,
  book: "Curiosity",
  chapter: "Light: Shadows and Reflections",
  title: "Play with shadows and mirrors",
  intro: {
    objective:
      "Make shadows grow and shrink, build a pinhole camera and bounce light off mirrors to see that light travels in straight lines.",
    learn: [
      "Why light travelling in straight lines makes shadows",
      "Which materials are transparent, translucent or opaque",
      "How a pinhole camera makes an upside-down image",
      "How a plane mirror reflects light and swaps left and right",
    ],
    realLife:
      "Hand shadow animals during a power cut, round sun spots under a neem tree, the mirror in an auto-rickshaw and the back-to-front AMBULANCE sign all come from this chapter.",
    minutes: 25,
  },
  hook: {
    title: "Animals on the wall",
    text:
      "It is a power cut on a Diwali evening. Your cousin lights a candle and makes a bird with her hands. A huge bird flies across the wall! When she moves her hands closer to the candle, the bird gets even bigger. How can a small hand make such a big shadow? Let's find out with a lamp, a pinhole camera and some mirrors.",
  },
  predict: {
    question: "Riya moves a torch closer to her hand. Her hand stays where it is. What happens to the shadow on the wall?",
    options: ["It gets bigger", "It gets smaller", "It stays the same size"],
    answer: 0,
  },
  tasks: [
    {
      id: "task:grow",
      title: "Giant shadow",
      text: "Use the cardboard. Drag the lamp towards the object until the shadow is at least 3 times as tall as the object.",
      found:
        "When the lamp comes closer to the object, the light rays spread out more steeply past its edges. So the shadow on the wall gets bigger. When the lamp moves away, the shadow shrinks towards the size of the object.",
    },
    {
      id: "task:materials",
      title: "See-through or not?",
      text: "Try glass, butter paper and cardboard one by one. Look at the shadow each one makes.",
      found:
        "Glass is transparent: almost all light goes through, so it makes hardly any shadow. Butter paper is translucent: some light goes through, so its shadow is pale. Cardboard is opaque: no light goes through, so its shadow is dark.",
    },
    {
      id: "task:penumbra",
      title: "Two kinds of shadow",
      text: "Switch to the wide lamp. Look closely at the edge of the shadow on the wall.",
      found:
        "A wide lamp is like many small lamps side by side. In the middle no light reaches the wall at all: this dark part is the umbra. Near the edges only part of the lamp is hidden, so the wall is half lit: this lighter part is the penumbra.",
    },
    {
      id: "task:pinhole",
      title: "Upside-down candle",
      text: "Open the pinhole camera. Bring the candle close until its image is taller than the candle itself. Keep the hole small so the image stays sharp.",
      found:
        "Rays from the top of the flame go straight through the hole and land at the bottom of the screen. Rays from the bottom land at the top. So the image is upside down. A closer candle gives a bigger image, and a bigger hole lets in more rays from each point, which blurs it.",
    },
    {
      id: "task:periscope",
      title: "See over the wall",
      text: "Open the mirror and try the periscope puzzle. Tilt both mirrors so you can see the cricket match over the high wall.",
      found:
        "Both mirrors must face each other at 45°. Each mirror turns the light through 90°, because the angle of reflection equals the angle of incidence (45° and 45°). This is how a periscope works in a submarine.",
    },
  ],
  ideas: [
    {
      title: "Light travels in a straight line",
      text: "Objects that give out their own light, like the Sun, a candle flame or a bulb, are luminous. Objects that do not, like the Moon, a book or your hand, are non-luminous. We see non-luminous objects when light bounces off them into our eyes.",
    },
    {
      title: "Shadows",
      text: "An opaque object blocks light, so a dark shadow forms behind it. A shadow forms only when there is a source of light, an opaque object and a screen. A shadow shows only the outline of the object, not its colour. That is why hand shadow puppets work. A wide source of light makes a dark umbra with a lighter penumbra around it.",
    },
    {
      title: "Pinhole camera",
      text: "Light from each point of an object goes straight through the tiny hole, so the image on the screen is upside down. The sun spots under a tree are pinhole images of the Sun made by gaps between the leaves.",
    },
    {
      title: "Reflection from a plane mirror",
      text: "The ray falling on the mirror is the incident ray and the ray that bounces off is the reflected ray. The normal is a line at 90° to the mirror. The angle of reflection is always equal to the angle of incidence. The image in a plane mirror is erect, the same size, as far behind the mirror as the object is in front, and its left and right are swapped (lateral inversion).",
      formula: "∠i = ∠r",
    },
  ],
  challenge: {
    title: "Laser bounce",
    text: "Turn the mirrors to guide the laser beam around the walls to the target. There are three levels, one star each.",
  },
  quiz: [
    {
      q: "Which of these is a luminous object?",
      options: ["The Moon", "A mirror", "A candle flame", "A white wall"],
      answer: 2,
      why: "A candle flame gives out its own light. The Moon, a mirror and a wall only send back light that falls on them.",
    },
    {
      q: "You can see a little light through butter paper but cannot see clearly through it. Butter paper is…",
      options: ["Transparent", "Translucent", "Opaque", "Luminous"],
      answer: 1,
      why: "A translucent material lets only some light pass through, so things behind it look hazy.",
    },
    {
      q: "Which shows that light travels in a straight line?",
      options: [
        "We cannot see a candle through a bent pipe",
        "A mirror feels cold",
        "Glass is hard",
        "The Sun is hot",
      ],
      answer: 0,
      why: "Light from the candle cannot go round the bend in the pipe. It only reaches our eye through a straight pipe.",
    },
    {
      q: "A torch is moved away from a ball towards the far end of the room. The ball and the wall stay still. The shadow of the ball…",
      options: ["Gets bigger", "Gets smaller", "Disappears", "Changes colour"],
      answer: 1,
      why: "When the source moves away, the rays past the ball spread less, so the shadow becomes smaller.",
    },
    {
      q: "The image of a tree in a pinhole camera is…",
      options: ["Upright", "Upside down", "Coloured green only", "Always bigger than the tree"],
      answer: 1,
      why: "Rays from the top of the tree pass through the hole and land at the bottom of the screen, so the image is upside down.",
    },
    {
      q: "A ray hits a plane mirror at an angle of incidence of 35°. What is the angle of reflection?",
      options: ["35°", "55°", "70°", "90°"],
      answer: 0,
      why: "For any mirror, the angle of reflection equals the angle of incidence, so it is 35°.",
    },
    {
      q: "Why is AMBULANCE written the other way round on the front of an ambulance?",
      options: [
        "So it looks stylish",
        "So drivers ahead can read it the right way in their rear-view mirror",
        "Because of a printing mistake",
        "So it can be read in the dark",
      ],
      answer: 1,
      why: "A plane mirror swaps left and right (lateral inversion). The reversed word looks correct in the mirror.",
    },
  ],
};

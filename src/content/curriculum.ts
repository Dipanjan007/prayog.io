/**
 * Physics chapters for Classes 7 to 10, grouped into strands that grow from
 * basics to advanced. Book names follow the current NCERT textbooks:
 * Curiosity (Classes 7 and 8), Exploration (Class 9, 2026-27) and Science
 * (Class 10). Check titles against the NCERT PDFs when a book is revised.
 */

export type ClassNum = 7 | 8 | 9 | 10;

export const BOOKS: Record<ClassNum, string> = {
  7: "Curiosity",
  8: "Curiosity",
  9: "Exploration",
  10: "Science",
};

export interface Chapter {
  classNum: ClassNum;
  title: string;
  /** Route of the playable lesson, when it exists. */
  href?: string;
  /** The simulation the lesson is built around. */
  sim: string;
}

export interface Strand {
  id: string;
  name: string;
  colour: string;
  chapters: Chapter[];
}

export const STRANDS: Strand[] = [
  {
    id: "motion",
    name: "Motion",
    colour: "var(--c-cyan)",
    chapters: [
      { classNum: 7, title: "Measurement of Time and Motion", sim: "Pendulum timer and race track" },
      { classNum: 9, title: "Describing Motion Around Us", href: "/learn/motion", sim: "Drive a sports car, watch its graphs draw live" },
    ],
  },
  {
    id: "force",
    name: "Force",
    colour: "var(--c-violet)",
    chapters: [
      { classNum: 8, title: "Exploring Forces", sim: "Friction surfaces and magnet playground" },
      { classNum: 9, title: "How Forces Affect Motion", sim: "Newton's laws sandbox and rocket launch" },
    ],
  },
  {
    id: "fluids",
    name: "Pressure and air",
    colour: "var(--c-sky)",
    chapters: [
      {
        classNum: 8,
        title: "Pressure, Winds, Storms, and Cyclones",
        href: "/learn/pressure-winds",
        sim: "Wind tunnel with a sports car",
      },
    ],
  },
  {
    id: "energy",
    name: "Energy and heat",
    colour: "var(--c-orange)",
    chapters: [
      { classNum: 7, title: "Heat Transfer in Nature", sim: "Particle view of conduction and convection" },
      { classNum: 9, title: "Work, Energy, and Simple Machines", sim: "Roller coaster energy bars, lever builder" },
    ],
  },
  {
    id: "electricity",
    name: "Electricity and magnetism",
    colour: "var(--c-lime)",
    chapters: [
      { classNum: 7, title: "Electricity: Circuits and their Components", href: "/learn/circuits", sim: "Torch builder and conductor tester" },
      { classNum: 8, title: "Electricity: Magnetic and Heating Effects", sim: "Electromagnet crane" },
      { classNum: 10, title: "Electricity", sim: "Ohm's law circuit lab" },
      { classNum: 10, title: "Magnetic Effects of Electric Current", sim: "Field lines and motor builder" },
    ],
  },
  {
    id: "light",
    name: "Light",
    colour: "var(--c-pink)",
    chapters: [
      { classNum: 7, title: "Light: Shadows and Reflections", sim: "Shadow and mirror bench" },
      { classNum: 8, title: "Light: Mirrors and Lenses", href: "/learn/mirrors-lenses", sim: "Plane, concave and convex mirrors and lenses" },
      { classNum: 10, title: "Light: Reflection and Refraction", href: "/learn/light-refraction", sim: "Glass block, lens and mirror bench with live ray diagrams" },
      { classNum: 10, title: "The Human Eye and the Colourful World", sim: "Eye model and prism", href: "/learn/human-eye" },
    ],
  },
  {
    id: "waves",
    name: "Waves and sky",
    colour: "var(--c-yellow)",
    chapters: [
      { classNum: 7, title: "Earth, Moon, and the Sun", sim: "Orbit, phases and eclipses" },
      { classNum: 8, title: "Keeping Time with the Skies", sim: "Sky clock" },
      { classNum: 9, title: "Sound Waves: Characteristics and Applications", sim: "Slinky and sound wave visualiser" },
    ],
  },
];

export const CLASSES: ClassNum[] = [7, 8, 9, 10];

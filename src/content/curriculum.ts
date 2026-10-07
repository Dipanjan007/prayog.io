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
  /** Beyond the current NCERT books: an Outliers lab for curious students, shown on its own tab. */
  extra?: boolean;
  /** Extra NCERT labs for this chapter that fill gaps the main lesson leaves. */
  labs?: { href: string; title: string; sim: string }[];
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
      { classNum: 7, title: "Measurement of Time and Motion", href: "/learn/time-motion", sim: "Pendulum timer and race track" },
      { classNum: 9, title: "Describing Motion Around Us", href: "/learn/motion", sim: "Drive a sports car, watch its graphs draw live", labs: [{ href: "/learn/paths-circles", title: "Distance, displacement and going round", sim: "Walk a Kolkata map, throw a ball up and roll a marble round a ring" }] },
    ],
  },
  {
    id: "force",
    name: "Force",
    colour: "var(--c-violet)",
    chapters: [
      { classNum: 8, title: "Exploring Forces", href: "/learn/forces", sim: "Push a crate, spring balance and magnets", labs: [{ href: "/learn/float-sink", title: "Float or sink?", sim: "Spring balance in water, an egg in salt water, floating ring magnets" }] },
      { classNum: 9, title: "How Forces Affect Motion", href: "/learn/forces-motion", sim: "Air track collisions and recoil" },
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
        labs: [{ href: "/learn/pressure-lab", title: "Press, pour and pump", sim: "Squash sand with a brick, spurt water jets, pull a sucker off a wall" }],
      },
    ],
  },
  {
    id: "energy",
    name: "Energy and heat",
    colour: "var(--c-orange)",
    chapters: [
      { classNum: 7, title: "Heat Transfer in Nature", href: "/learn/heat-transfer", sim: "Heated rod, convection pot and sea breeze" },
      { classNum: 9, title: "Work, Energy, and Simple Machines", href: "/learn/work-energy", sim: "Roller coaster energy bars, lever builder", labs: [{ href: "/learn/simple-machines", title: "Pulleys, ramps and the work meter", sim: "Work meter, pulley systems, a ramp and a power race" }] },
    ],
  },
  {
    id: "electricity",
    name: "Electricity and magnetism",
    colour: "var(--c-lime)",
    chapters: [
      { classNum: 7, title: "Electricity: Circuits and their Components", href: "/learn/circuits", sim: "Torch builder and conductor tester" },
      { classNum: 8, title: "Electricity: Magnetic and Heating Effects", href: "/learn/magnetic-heating", sim: "Electromagnet crane and fuse", labs: [{ href: "/learn/cells-compass", title: "Lemon batteries and nervous compasses", sim: "Swing compasses round a wire, light an LED with lemon cells" }] },
      { classNum: 10, title: "Electricity", href: "/learn/electricity", sim: "Ohm's law circuit lab" },
      { classNum: 10, title: "Magnetic Effects of Electric Current", href: "/learn/magnetic-effects", sim: "Field lines, compasses and the force on a wire", labs: [{ href: "/learn/house-wiring", title: "Wire a safe home", sim: "Plug in appliances, trip the MCB, earth a faulty iron, read the bill" }] },
    ],
  },
  {
    id: "light",
    name: "Light",
    colour: "var(--c-pink)",
    chapters: [
      { classNum: 7, title: "Light: Shadows and Reflections", href: "/learn/shadows-reflections", sim: "Shadow stage, pinhole camera and laser mirrors" },
      { classNum: 8, title: "Light: Mirrors and Lenses", href: "/learn/mirrors-lenses", sim: "Plane, concave and convex mirrors and lenses" },
      { classNum: 10, title: "Light: Reflection and Refraction", href: "/learn/light-refraction", sim: "Glass block, lens and mirror bench with live ray diagrams" },
      { classNum: 10, title: "The Human Eye and the Colourful World", sim: "Eye model and prism", href: "/learn/human-eye", labs: [{ href: "/learn/sky-colours", title: "Why the sky is blue", sim: "Scatter light, paint a sunset, make stars twinkle, catch a rainbow" }] },
    ],
  },
  {
    id: "waves",
    name: "Waves and sky",
    colour: "var(--c-yellow)",
    chapters: [
      { classNum: 7, title: "Earth, Moon, and the Sun", href: "/learn/earth-moon-sun", sim: "Seasons, day length and eclipses" },
      { classNum: 8, title: "Keeping Time with the Skies", href: "/learn/sky-clock", sim: "Moon phases and a shadow stick" },
      { classNum: 9, title: "Sound Waves: Characteristics and Applications", href: "/learn/sound", sim: "Sound waves, echoes and SONAR", labs: [{ href: "/learn/sound-uses", title: "Silent bells and singing halls", sim: "Silence a bell jar, tune a hall echo, find a crack with ultrasound" }] },
    ],
  },
  {
    id: "gravity",
    name: "Gravity and space",
    colour: "var(--c-violet)",
    chapters: [
      { classNum: 9, title: "Gravitation: Mass, Weight and Gravity", href: "/outliers/gravity", sim: "Drop balls on the Moon and Jupiter, fire Newton's cannon", extra: true },
      { classNum: 9, title: "Circular Motion: Centripetal and Centrifugal Force", href: "/outliers/circular-motion", sim: "Whirl a ball, ride the spinning Earth", extra: true },
      { classNum: 10, title: "Gravity and Black Holes", href: "/outliers/black-holes", sim: "Squeeze the Earth and the Sun into black holes", extra: true },
    ],
  },
  {
    id: "relativity",
    name: "Einstein's relativity",
    colour: "var(--c-pink)",
    chapters: [
      { classNum: 10, title: "Relativity: Moving Clocks Run Slow", href: "/outliers/time-dilation", sim: "Light clock on a speeding train", extra: true },
      { classNum: 10, title: "Relativity: Shrinking Lengths and the Cosmic Speed Limit", href: "/outliers/length-contraction", sim: "Shrink a rocket, try to beat light", extra: true },
      { classNum: 10, title: "Relativity: E = mc² and Curved Space-time", href: "/outliers/mass-energy", sim: "Turn mass into energy, bend starlight", extra: true },
    ],
  },
];

/** The NCERT strands shown on the Learn map. */
export const NCERT_STRANDS: Strand[] = STRANDS.map((s) => ({ ...s, chapters: s.chapters.filter((c) => !c.extra) })).filter(
  (s) => s.chapters.length > 0,
);

/** The Outliers tab: labs beyond the NCERT books. */
export const OUTLIER_STRANDS: Strand[] = STRANDS.map((s) => ({ ...s, chapters: s.chapters.filter((c) => c.extra) })).filter(
  (s) => s.chapters.length > 0,
);

export const CLASSES: ClassNum[] = [7, 8, 9, 10];

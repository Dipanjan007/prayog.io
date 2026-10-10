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
      { classNum: 9, title: "How Forces Affect Motion", href: "/learn/forces-motion", sim: "Air track collisions and recoil", labs: [{ href: "/learn/friction-tension", title: "Grip, slip and pull", sim: "Measure grip and slip on glass, wood and sandpaper with a spring balance, then link blocks with a string" }] },
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
      { classNum: 7, title: "Heat Transfer in Nature", href: "/learn/heat-transfer", sim: "Heated rod, convection pot and sea breeze", labs: [{ href: "/learn/water-cycle", title: "The water cycle", sim: "Turn up the Sun and monsoon wind to rain on the Western Ghats, soak rain into soil, dry a shirt and chill a sweating tumbler" }] },
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
      { classNum: 10, title: "The Human Eye and the Colourful World", sim: "Eye model and prism", href: "/learn/human-eye", labs: [{ href: "/learn/eye-defects", title: "Dadi's reading glasses", sim: "Age an eye from 15 to 80, find its near point, and design reading glasses and bifocals for Dadi" }, { href: "/learn/sky-colours", title: "Why the sky is blue", sim: "Scatter light, paint a sunset, make stars twinkle, catch a rainbow" }] },
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

/** NCERT Maths books in use: Ganita Prakash (Classes 7 and 8), Ganita Manjari (Class 9, 2026-27) and Mathematics (Class 10). */
export const MATHS_BOOKS: Record<ClassNum, string> = {
  7: "Ganita Prakash",
  8: "Ganita Prakash",
  9: "Ganita Manjari",
  10: "Mathematics",
};

/** Maths chapters on the Maths map at /maths, with their second labs. */
export const MATHS_STRANDS: Strand[] = [
  {
    id: "geometry",
    name: "Geometry",
    colour: "var(--c-cyan)",
    chapters: [
      {
        classNum: 7,
        title: "Parallel and Intersecting Lines",
        href: "/maths/parallel-lines",
        sim: "Turn a road across railway rails and lay new lines parallel",
        labs: [{ href: "/maths/tilings", title: "Tiles, corners and 360°", sim: "Fit regular tiles round a corner and mix shapes into floor patterns" }],
      },
      { classNum: 7, title: "A Tale of Three Intersecting Lines", href: "/maths/triangles", sim: "Join sticks into triangles, stretch the corners and watch the angles add up" },
      { classNum: 8, title: "The Baudhayana-Pythagoras Theorem", href: "/maths/pythagoras", sim: "Grow squares on a triangle and send fire ladders to the right windows" },
    ],
  },
  {
    id: "numbers",
    name: "Numbers",
    colour: "var(--c-yellow)",
    chapters: [
      {
        classNum: 7,
        title: "Working with Fractions",
        href: "/maths/fractions",
        sim: "Cut a chocolate bar both ways, share laddoos and fill lassi glasses",
        labs: [{ href: "/maths/decimals", title: "Zoom beyond the point", sim: "Zoom into tenths and hundredths, run a canteen bill and slide digits by 10 and 100" }],
      },
      {
        classNum: 8,
        title: "A Square and A Cube",
        href: "/maths/squares-cubes",
        sim: "Lay square tiles, stack unit cubes and hunt Ramanujan's 1729",
        labs: [{ href: "/maths/powers", title: "Fold to the Moon", sim: "Fold paper until it reaches the Moon and write huge numbers with powers of 10" }],
      },
      { classNum: 8, title: "Fractions in Disguise", href: "/maths/percentages", sim: "Shade a 10 × 10 grid and run a Diwali sale with discounts and GST" },
    ],
  },
  {
    id: "algebra",
    name: "Algebra",
    colour: "var(--c-orange)",
    chapters: [
      {
        classNum: 7,
        title: "Finding the Unknown",
        href: "/maths/equations",
        sim: "Find the marbles hiding in mystery bags on a mandi balance",
        labs: [{ href: "/maths/letter-numbers", title: "Matchstick rules", sim: "Grow matchstick and tile patterns and write their rule with n" }],
      },
    ],
  },
  {
    id: "ratio",
    name: "Ratio, chance and data",
    colour: "var(--c-lime)",
    chapters: [{ classNum: 8, title: "Proportional Reasoning-1", href: "/maths/proportion", sim: "Mix Holi colours, scale a nimbu-paani recipe and read a town map" }],
  },
  {
    id: "coordinates",
    name: "Coordinate geometry",
    colour: "var(--c-violet)",
    chapters: [{ classNum: 9, title: "Orienting Yourself: The Use of Coordinates", href: "/maths/coordinates", sim: "Fly a delivery drone over a city grid with two numbers" }],
  },
  {
    id: "trigonometry",
    name: "Trigonometry",
    colour: "var(--c-pink)",
    chapters: [{ classNum: 10, title: "Some Applications of Trigonometry", href: "/maths/heights-distances", sim: "Measure the Qutub Minar with a clinometer, then look down from a lighthouse" }],
  },
];

/** Maths beyond the NCERT books, on the Maths Outliers tab at /maths/outliers. */
export const MATHS_OUTLIER_STRANDS: Strand[] = [];

/** The NCERT Physics strands shown on the Learn map. */
export const NCERT_STRANDS: Strand[] = STRANDS.map((s) => ({ ...s, chapters: s.chapters.filter((c) => !c.extra) })).filter(
  (s) => s.chapters.length > 0,
);

/** The Outliers tab: labs beyond the NCERT books. */
export const OUTLIER_STRANDS: Strand[] = STRANDS.map((s) => ({ ...s, chapters: s.chapters.filter((c) => c.extra) })).filter(
  (s) => s.chapters.length > 0,
);

export const CLASSES: ClassNum[] = [7, 8, 9, 10];

const ncert = NCERT_STRANDS.flatMap((s) => s.chapters);

/** How much is playable, for the hub pages and the plans. */
export const CATALOGUE = {
  /** NCERT chapters with a playable lesson. */
  lessons: ncert.filter((c) => c.href).length,
  /** NCERT chapters still to build. */
  planned: ncert.filter((c) => !c.href).length,
  /** Second labs under NCERT chapters. */
  labs: ncert.reduce((n, c) => n + (c.labs?.length ?? 0), 0),
  outliers: OUTLIER_STRANDS.reduce((n, s) => n + s.chapters.filter((c) => c.href).length, 0),
  /** Maths chapters with a playable lesson. */
  maths: MATHS_STRANDS.reduce((n, s) => n + s.chapters.filter((c) => c.href).length, 0),
  /** Second labs under Maths chapters. */
  mathsLabs: MATHS_STRANDS.reduce((n, s) => n + s.chapters.reduce((k, c) => k + (c.labs?.length ?? 0), 0), 0),
  mathsOutliers: MATHS_OUTLIER_STRANDS.reduce((n, s) => n + s.chapters.filter((c) => c.href).length, 0),
};

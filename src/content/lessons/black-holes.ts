/**
 * Class 10 · Outliers · "Gravity and Black Holes".
 * Goes past the NCERT gravitation chapter: g = GM/R², escape speed, the Schwarzschild radius,
 * what dead stars become, and how black holes bend light.
 */
import { M_SUN, R_SUN } from "@/lib/sim/blackhole";
import type { LessonDef } from "./types";

export const LESSON_ID = "x-black-holes";

/** Challenge: three mystery objects. The student finds the radius at which each becomes a black hole. */
export const MYSTERY_OBJECTS = [
  { name: "The Moon", mass: 7.35e22, radius: 1.737e6, unit: "mm", perMetre: 1000 },
  { name: "Jupiter", mass: 1.898e27, radius: 6.9911e7, unit: "m", perMetre: 1 },
  { name: "A blue star of 10 Suns", mass: 10 * M_SUN, radius: 5 * R_SUN, unit: "km", perMetre: 0.001 },
];

/** An answer counts if it is within this fraction of the true Schwarzschild radius. */
export const RS_TOLERANCE = 0.05;

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "black-hole-explorer",
  classNum: 10,
  book: "Outliers",
  chapter: "Gravity and Black Holes",
  title: "How mass makes a black hole",
  intro: {
    objective:
      "Squeeze Earth, the Sun and a giant star into smaller and smaller balls, watch gravity grow, and find the size at which each one becomes a black hole.",
    learn: [
      "Surface gravity g = GM/R² grows fast when the same mass is squeezed smaller",
      "Escape speed v = √(2GM/R), and why a black hole forms when it reaches the speed of light",
      "The Schwarzschild radius r_s = 2GM/c² (Earth about 9 mm, Sun about 3 km)",
      "How a dying star's core becomes a white dwarf, a neutron star or a black hole",
      "How black holes bend and trap light, and the first real pictures of them",
    ],
    realLife:
      "ISRO's AstroSat and XPoSat satellites study X-rays from hot gas swirling into black holes. In 2019 and 2022 the Event Horizon Telescope took the first pictures of black holes.",
    minutes: 25,
  },
  hook: {
    title: "A planet in your pocket",
    text:
      "To escape Earth's pull for good, a rocket has to reach about 11.2 km/s, more than 30 times the speed of sound. Now imagine a giant hand squeezing all of Earth into a smaller ball, without losing any mass. Gravity at the surface gets stronger, and escaping gets harder. Squeeze enough and even light, the fastest thing there is, cannot get out. That is a black hole. How small would Earth have to be?",
  },
  predict: {
    question: "How small would you have to squeeze the whole Earth to make it a black hole?",
    options: ["About the size of the Moon", "About the size of Mumbai", "About the size of a marble"],
    answer: 2,
  },
  tasks: [
    {
      id: "task:gravity",
      title: "Gravity grows",
      text: "In Squeeze mode, pick any body and squeeze it until its surface gravity is at least 100 times its real value. Watch the escape speed bar too.",
      found:
        "Same mass, smaller ball: g = GM/R² rises as 1/R². Squeeze to one tenth of the radius and g becomes 100 times bigger. The escape speed √(2GM/R) also rises, but more slowly: it grows about 3.2 times.",
    },
    {
      id: "task:earth",
      title: "Turn Earth into a black hole",
      text: "Choose Earth and keep squeezing (use − to go slowly) until an event horizon forms. Read the radius.",
      found:
        "Earth becomes a black hole when it is squeezed inside about 8.9 mm, the size of a marble. At that radius the escape speed is exactly the speed of light, so nothing from inside can ever get out.",
    },
    {
      id: "task:mass",
      title: "More mass, bigger horizon",
      text: "Now turn the Sun and the big star (20 Suns) into black holes too. Compare their event horizon radius r_s.",
      found:
        "The Sun's horizon is about 2.95 km and the 20-Sun star's is about 59 km, 20 times bigger. The Schwarzschild radius grows in step with mass: r_s = 2GM/c². Double the mass, double the horizon.",
    },
    {
      id: "task:fate",
      title: "The life story of a star",
      text: "In Star life mode, set different core masses and run out of fuel. Make all three endings: a white dwarf, a neutron star and a black hole.",
      found:
        "When a star runs out of fuel, gravity crushes its core. A small core (below about 1.4 Suns) becomes a white dwarf. A heavier one becomes a neutron star. Above about 3 Suns, no known force can stop it, and it becomes a black hole.",
    },
    {
      id: "task:light",
      title: "Bend and trap light",
      text: "In Light paths mode, fire one ray that escapes and one that gets trapped. Change the aim distance between shots.",
      found:
        "Rays aimed far away bend only a little. Rays aimed closer than about 2.6 r_s spiral in and are lost behind the horizon. That is why a black hole looks like a dark shadow a bit bigger than its horizon.",
    },
  ],
  discovery: {
    scientist: "Karl Schwarzschild",
    years: "1873–1916",
    fact: "In 1915, while serving as a soldier on the Russian front in World War I, Schwarzschild solved Einstein's brand new equations of gravity for a ball of mass. His answer, published in 1916, hides a special radius: the black hole's event horizon. He died a few months later.",
    formula: "r_s = (2 × G × M) ÷ c²",
    formulaNote: "Squeeze a mass M inside this radius and not even light can escape.",
  },
  symbols: [
    { sym: "r_s", meaning: "Schwarzschild radius: the size of the event horizon, in m" },
    { sym: "G", meaning: "the gravitational constant, 6.674 × 10⁻¹¹ N m²/kg²" },
    { sym: "M", meaning: "mass of the star or black hole, in kg" },
    { sym: "c", meaning: "speed of light, about 3 × 10⁸ m/s" },
    { sym: "g", meaning: "pull of gravity at the surface, in m/s²" },
    { sym: "R", meaning: "radius of the object, in m" },
    { sym: "v", meaning: "escape speed, in m/s" },
    { sym: "L", meaning: "length of the object being stretched, in m" },
    { sym: "r", meaning: "distance from the centre, in m" },
    { sym: "c², R², r³", meaning: "c × c, R × R, r × r × r" },
  ],
  ideas: [
    {
      title: "Squeezing makes gravity stronger",
      text: "Gravity at the surface of a ball of mass M and radius R is g = GM/R². Keep the mass the same and halve the radius: you are now twice as close to the centre, so g becomes 4 times bigger. Earth's g is about 9.8 m/s².",
      formula: "g = (G × M) ÷ R²",
    },
    {
      title: "Escape speed and dark stars",
      text: "Throw a cricket ball up and it falls back. Throw it at the escape speed and it never returns. For a ball of mass M and radius R this speed is √(2GM/R): 11.2 km/s for Earth and 618 km/s for the Sun. In 1783 John Michell wondered about a star so dense that its escape speed beats the speed of light, a dark star. Set v = c and you get R = 2GM/c², the same radius Schwarzschild found with Einstein's theory.",
      formula: "v = √((2 × G × M) ÷ R)",
    },
    {
      title: "Event horizon",
      text: "The event horizon is the boundary at r_s = 2GM/c². Light and anything else that crosses it can never come back out. It is not a solid surface. For Earth r_s is about 8.9 mm, for the Sun about 2.95 km, and it grows in step with mass.",
      formula: "r_s = (2 × G × M) ÷ c²",
    },
    {
      title: "How stars die",
      text: "A star shines by fusing light atoms into heavier ones in its core. That heat pushes outward and holds the star up against its own gravity. When the fuel runs out, gravity wins and the core collapses. Roughly: a core under about 1.4 Suns becomes a white dwarf, up to about 3 Suns a neutron star, and above that a black hole. Heavy stars usually blow off their outer layers in a supernova. These limits are approximate, and scientists are still measuring the upper one.",
    },
    {
      title: "An Indian student's discovery at sea",
      text: "In 1930, 19-year-old Subrahmanyan Chandrasekhar sailed from India to England to study at Cambridge. On the voyage he worked out that a white dwarf heavier than about 1.4 Suns cannot hold itself up. This is now called the Chandrasekhar limit. He won the Nobel Prize in Physics in 1983, and NASA's Chandra X-ray Observatory is named after him.",
      formula: "Chandrasekhar limit ≈ 1.4 Suns",
    },
    {
      title: "Bending light, and the first pictures",
      text: "Mass bends the path of light. Far from a black hole the bend is small. Closer than about 2.6 r_s the light is trapped, so the black hole casts a dark shadow on the glowing gas around it. In 2019 the Event Horizon Telescope, a team of radio dishes around the world, showed this shadow for M87*, a black hole of about 6.5 billion Suns. In 2022 it showed Sagittarius A*, the 4-million-Sun black hole at the centre of our Milky Way.",
    },
    {
      title: "Spaghettification (just for fun)",
      text: "Near a small black hole, gravity pulls much harder on your feet than on your head, so you would be stretched like a noodle. Around a giant black hole the stretch at the horizon is gentle. You could cross it without noticing, but you could never come back.",
      formula: "stretch ≈ (2 × G × M × L) ÷ r³",
    },
  ],
  challenge: {
    title: "Mystery black holes",
    text: "Three mystery objects with their masses. For each, find the radius at which it becomes a black hole, within 5%. Work it out with r_s = 2GM/c² (G = 6.674 × 10⁻¹¹, c = 3 × 10⁸ m/s) or squeeze it in the lab. One star per object.",
  },
  quiz: [
    {
      q: "A planet is squeezed to half its radius, with no change in mass. What happens to the gravity at its surface?",
      options: ["It halves", "It doubles", "It becomes 4 times bigger", "It stays the same"],
      answer: 2,
      why: "g = GM/R². Halving R makes R² four times smaller, so g becomes 4 times bigger.",
    },
    {
      q: "About how big is the Sun's Schwarzschild radius?",
      options: ["3 mm", "3 km", "3000 km", "As big as the Sun now"],
      answer: 1,
      why: "r_s = (2 × G × M) ÷ c² = (2 × 6.674 × 10⁻¹¹ × 1.989 × 10³⁰) ÷ (3 × 10⁸)² ≈ 2950 m, about 3 km.",
    },
    {
      q: "Black hole A has 3 times the mass of black hole B. How does A's event horizon radius compare?",
      options: ["Same size", "3 times bigger", "9 times bigger", "3 times smaller"],
      answer: 1,
      why: "r_s = 2GM/c² is proportional to M, so 3 times the mass gives 3 times the radius.",
    },
    {
      q: "A dying star leaves behind a core of about 2 Suns. What is it most likely to become?",
      options: ["A white dwarf", "A neutron star", "A black hole", "A new Sun"],
      answer: 1,
      why: "2 Suns is above the Chandrasekhar limit of about 1.4 Suns but below the roughly 3-Sun limit, so it becomes a neutron star.",
    },
    {
      q: "Why can't light escape from inside the event horizon?",
      options: [
        "Black holes are painted black",
        "The escape speed there is more than the speed of light",
        "There is no light inside a star",
        "Light is too heavy",
      ],
      answer: 1,
      why: "At r_s the escape speed equals c. Inside it, escaping would need more than the speed of light, and nothing can go faster than light.",
    },
    {
      q: "What did the Event Horizon Telescope image of M87* in 2019 show?",
      options: [
        "A bright star with planets",
        "A dark shadow surrounded by a ring of glowing gas",
        "A hole in the sky with nothing around it",
        "A white dwarf",
      ],
      answer: 1,
      why: "The black hole traps light aimed too close, so it shows up as a dark shadow inside a bright ring of hot gas bent around it.",
    },
  ],
};

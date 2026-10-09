/**
 * Class 9 · Outliers · "Gravitation: Mass, Weight and Gravity".
 * Goes past the NCERT chapter into orbits, escape speed and the road to black holes.
 */
import type { WorldId } from "@/lib/sim/gravity";
import type { LessonDef } from "./types";

export const LESSON_ID = "x-gravity";

/** Challenge: the 45 kg astronaut on a scale on three mystery worlds. One star each. */
export const ASTRONAUT_KG = 45;
export const MYSTERY_WORLDS: WorldId[] = ["mars", "jupiter", "moon"];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "gravity-guru",
  classNum: 9,
  book: "Outliers",
  chapter: "Gravitation: Mass, Weight and Gravity",
  title: "Why things fall",
  intro: {
    objective:
      "Feel the pull between two masses, weigh yourself on other worlds, fire Newton's cannon into orbit, and squeeze a planet until even light cannot escape.",
    learn: [
      "Every mass pulls every other mass: F = (G × m₁ × m₂) ÷ r²",
      "Mass stays the same everywhere, but weight W = mg changes from world to world",
      "Without air, a feather and a cricket ball fall together",
      "Orbit speed (about 7.9 km/s) and escape speed (about 11.2 km/s) for Earth",
      "Why squeezing the same mass smaller leads to a black hole",
    ],
    realLife:
      "A cricket ball dropping back to the fielder, ISRO's satellites circling Earth, Chandrayaan travelling to the Moon and the tides at Mumbai's beaches all come from gravity.",
    minutes: 25,
  },
  hook: {
    title: "The ball that never comes down",
    text:
      "Throw a cricket ball sideways and it curves down to the ground. Throw it harder and it lands further away. Now imagine a cannon on a giant mountain, firing so fast that the ground curves away as quickly as the ball falls. The ball keeps falling but never lands. That is an orbit, and it is how ISRO's satellites stay up. Fire even faster and the ball leaves Earth for good. What pulls the ball down, and why is that pull weaker on the Moon? Let's find out.",
  },
  predict: {
    question: "On the Moon there is no air. An astronaut drops a cricket ball and a feather from the same height at the same moment. What happens?",
    options: ["The ball lands first", "The feather lands first", "They land together"],
    answer: 2,
  },
  tasks: [
    {
      id: "task:law",
      title: "Pull of two masses",
      text: "In Pull mode, double one of the masses and watch the force. Then double the distance between the bodies (for example 2 to 4, or 4 to 8).",
      found:
        "Twice the mass gives twice the pull. Twice the distance gives only a quarter of the pull, because F depends on 1 ÷ r². The two arrows are always equal and opposite: the Moon pulls Earth just as hard as Earth pulls the Moon.",
    },
    {
      id: "task:weight",
      title: "Weigh it on other worlds",
      text: "Switch to Drop mode. Put the same mass on the scale and visit at least three worlds. Watch the mass and the weight.",
      found:
        "The mass in kg never changes. It is the amount of matter. The weight in newtons changes, because W = m × g and each world has its own g. A 45 kg student weighs about 441 N on Earth but only about 73 N on the Moon.",
    },
    {
      id: "task:feather",
      title: "Hammer and feather",
      text: "Drop the cricket ball and the feather together with air on Earth. Then make them land at the same moment: turn the air off, or go to the Moon.",
      found:
        "With air, the feather drifts down slowly because air pushes up on it. With no air, both fall with the same acceleration g and land together. Mass does not change how fast things fall.",
    },
    {
      id: "task:cannon",
      title: "Newton's cannon",
      text: "In Cannon mode, fire the ball sideways from the mountain. Find a speed that puts it in orbit, and a speed that makes it escape Earth.",
      found:
        "Below about 7.9 km/s the ball falls back. At about 7.9 km/s the ground curves away as fast as the ball falls, so it orbits. At about 11.2 km/s it escapes and never comes back. Escape speed is √2 times the orbit speed.",
    },
    {
      id: "task:squeeze",
      title: "Squeeze it to a black hole",
      text: "In Squeeze mode, keep the mass the same and squeeze the Earth (or the Sun) smaller and smaller. Can you make the escape speed beat the speed of light?",
      found:
        "Squeezing the same mass into a smaller ball raises the escape speed, since v = √((2 × G × M) ÷ R). Squeeze all of Earth into about 9 mm, the size of a marble, and the escape speed passes the speed of light. Nothing, not even light, can get out. That is a black hole.",
    },
  ],
  discovery: {
    scientist: "Henry Cavendish",
    years: "1731–1810",
    fact: "In 1798 Cavendish hung a rod with two small lead balls on a thin wire and brought two big lead balls close to them. The tiny pull between the balls twisted the wire by a very small angle. From that twist he worked out the density of the whole Earth, so his experiment is called \"weighing the Earth\". It was the first measurement of gravity between everyday objects, and it gives us the value of G.",
    formula: "F = (G × m₁ × m₂) ÷ r²",
    formulaNote: "Any two masses pull each other with a force that grows with each mass and falls with the square of the distance between them.",
  },
  symbols: [
    { sym: "F", meaning: "pull of gravity between two masses, in newtons (N)" },
    { sym: "G", meaning: "the gravitational constant, 6.674 × 10⁻¹¹ N m²/kg²" },
    { sym: "m₁, m₂", meaning: "the two masses, in kg" },
    { sym: "r", meaning: "distance between their centres, in m" },
    { sym: "g", meaning: "pull of gravity at the surface, in m/s²" },
    { sym: "M", meaning: "mass of the planet, in kg" },
    { sym: "R", meaning: "radius of the planet, in m" },
    { sym: "W", meaning: "weight, in N" },
    { sym: "m", meaning: "mass of the object, in kg" },
    { sym: "c", meaning: "speed of light, about 3 × 10⁸ m/s" },
    { sym: "√( )", meaning: "square root of what is inside the bracket" },
  ],
  ideas: [
    {
      title: "Universal law of gravitation",
      text: "Every object in the universe pulls every other object. The force is along the line joining their centres. It is very weak for everyday objects because G is tiny, but huge for planets and stars. The pulls on the two bodies are equal and opposite, as Newton's third law says.",
      formula: "F = (G × m₁ × m₂) ÷ r²,  G = 6.674 × 10⁻¹¹ N m²/kg²",
    },
    {
      title: "Free fall and g",
      text: "When only gravity acts, an object is in free fall. Its acceleration g does not depend on its own mass. On a planet of mass M and radius R, g = (G × M) ÷ R². That gives about 9.8 m/s² on Earth, 1.6 on the Moon, 3.7 on Mars and 24.8 on Jupiter. In 1971 Apollo 15 astronaut David Scott dropped a hammer and a falcon feather on the Moon, and they landed together.",
      formula: "g = (G × M) ÷ R²",
    },
    {
      title: "Mass and weight",
      text: "Mass is the amount of matter in an object, measured in kilograms. It is the same on Earth, the Moon or in space. Weight is the force of gravity on the object, measured in newtons. It changes with g. A spring scale measures weight. Your weight on the Moon is about one sixth of your weight on Earth.",
      formula: "W = m × g",
    },
    {
      title: "Orbits and escape",
      text: "A satellite is always falling towards Earth, but it moves sideways so fast that it keeps missing. Near Earth this needs about 7.9 km/s, which is about 28,000 km/h. To leave Earth for good, a ball fired from the ground would need about 11.2 km/s. Chandrayaan-3 did not go that fast at once: ISRO raised its orbit step by step, then sent it towards the Moon.",
      formula: "v orbit = √((G × M) ÷ r),  v escape = √((2 × G × M) ÷ R)",
    },
    {
      title: "The road to black holes",
      text: "Escape speed depends on both mass and radius. Keep the mass the same but make the radius smaller, and the escape speed goes up. If a mass is squeezed inside the radius (2 × G × M) ÷ c², escape needs more than the speed of light, so nothing can come out. For Earth this radius is about 9 mm. For the Sun it is about 3 km.",
      formula: "r = (2 × G × M) ÷ c²",
    },
  ],
  challenge: {
    title: "Planet detective",
    text: "Our 45 kg student astronaut stands on a scale on three mystery worlds. Read the weight, work out g = W ÷ m, and name the world. One star per world.",
  },
  quiz: [
    {
      q: "Two asteroids pull each other with a force F. They drift apart to twice the distance. What is the new force?",
      options: ["2F", "F ÷ 2", "F ÷ 4", "4F"],
      answer: 2,
      why: "F depends on 1 ÷ r². Twice the distance gives 1 ÷ 2² = 1 ÷ 4 of the force.",
    },
    {
      q: "A student has a mass of 60 kg on Earth. What is the student's mass on the Moon?",
      options: ["10 kg", "60 kg", "360 kg", "0 kg"],
      answer: 1,
      why: "Mass is the amount of matter and stays the same everywhere. Only the weight changes.",
    },
    {
      q: "Take g = 9.8 m/s². What does a 45 kg astronaut weigh on Earth?",
      options: ["45 N", "4.6 N", "441 N", "54.8 N"],
      answer: 2,
      why: "W = m × g = 45 × 9.8 = 441 N.",
    },
    {
      q: "On Earth a feather falls much slower than a cricket ball. Why?",
      options: [
        "Gravity pulls lighter things with a smaller acceleration",
        "Air pushes up on the feather much more for its weight",
        "The feather has no weight",
        "The ball has more mass, so g is bigger for it",
      ],
      answer: 1,
      why: "Gravity gives both the same acceleration g. Air resistance slows the light, wide feather a lot. With no air, they fall together.",
    },
    {
      q: "A planet is squeezed to a smaller radius, but its mass stays the same. What happens to the escape speed from its surface?",
      options: ["It goes down", "It stays the same", "It goes up", "It becomes zero"],
      answer: 2,
      why: "v escape = √((2 × G × M) ÷ R). A smaller R gives a bigger escape speed. Squeeze enough and it passes the speed of light: a black hole.",
    },
    {
      q: "About how fast must a satellite move sideways to orbit just above Earth's air?",
      options: ["340 m/s", "7.9 km/s", "11.2 km/s", "300,000 km/s"],
      answer: 1,
      why: "Orbit speed near Earth is √((G × M) ÷ r), about 7.9 km/s. 11.2 km/s is the escape speed.",
    },
  ],
};

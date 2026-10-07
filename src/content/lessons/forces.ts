/**
 * Class 8 · Curiosity (NCERT 2025) · "Exploring Forces".
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { SurfaceId } from "@/lib/sim/forces";
import type { LessonDef } from "./types";

export const LESSON_ID = "c8-forces";

/**
 * Challenge: slide the crate so that it stops wholly inside the target zone, with one push per try.
 * One round per floor; each round passed earns one star. Zones are in metres from the start line.
 */
// Each floor has a fixed push, set just above what static friction can hold, so the right hold lasts about a
// second and the window for landing in the zone is a human-sized quarter of a second.
export const ROUNDS: { surface: SurfaceId; zone: [number, number]; push: number }[] = [
  { surface: "wood", zone: [2, 3.6], push: 100 },
  { surface: "sand", zone: [2.5, 4.1], push: 160 },
  { surface: "ice", zone: [3.5, 5.1], push: 25 },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "force-finder",
  classNum: 8,
  book: "Curiosity",
  chapter: "Exploring Forces",
  title: "Push, pull and slide",
  intro: {
    objective:
      "Push, pull and weigh things to discover what a force is and the different kinds of force around us.",
    learn: [
      "A force is a push or a pull that can change speed, direction or shape",
      "How friction depends on the surface, and why things are hard to start moving",
      "Magnetic, electrostatic and gravitational forces act without touching",
      "Weight is a force, measured in newtons with a spring balance",
    ],
    realLife:
      "Pushing a stalled scooter, a kabaddi raid, a bowler's grip on the ball and a fridge magnet all involve the forces in this lab.",
    minutes: 25,
  },
  hook: {
    title: "The stalled scooter",
    text:
      "Papa's scooter has stalled on the way to school, and you have to push it to the mechanic. The first push is the hardest. Once it starts rolling, it suddenly feels easier. Why? And why does a kabaddi raider slip on a dusty court but not on a mat? Push a heavy crate across different floors to find out.",
  },
  predict: {
    question: "You push a heavy crate gently and it does not move at all. What is going on?",
    options: [
      "A gentle push is not a force",
      "Friction from the floor pushes back exactly as hard as you push",
      "The crate has no weight",
    ],
    answer: 1,
  },
  tasks: [
    {
      id: "task:static",
      title: "It will not budge",
      text:
        "On any floor, set a small push and hold the Push button. The crate stays still. Then raise the push, bit by bit, until the crate starts to slide.",
      found:
        "While the crate stayed still, friction grew to match your push exactly, so the forces balanced. This is static friction. It has a limit. Once your push beat that limit, the crate started sliding, and the friction became a bit smaller. That is why a stalled scooter is hardest to get going.",
    },
    {
      id: "task:surface",
      title: "Ice versus sand",
      text: "Get the crate sliding on Ice, and then on Sand. Compare how big a push each floor needs.",
      found:
        "Ice is smooth, so it gives very little friction and a small push is enough. Sand is rough, so it gives a lot of friction and you need a big push. Rough surfaces give more friction than smooth ones.",
    },
    {
      id: "task:stop",
      title: "Let go",
      text: "Get the crate sliding, then let go of the Push button. Watch it slow down and stop.",
      found:
        "With no push, the only force along the floor was friction, pointing backwards. It slowed the crate until it stopped. A force can change the speed of an object, and here friction brought the speed down to zero.",
    },
    {
      id: "task:weigh",
      title: "Weigh it",
      text: "Switch to the Spring balance. Hang three different objects and read their weight in newtons.",
      found:
        "Heavier objects stretched the spring more, and the pointer read a bigger weight. Weight is the pull of the Earth's gravity, so W = m × g, with g about 9.8 m/s². A 1 kg bottle weighs about 9.8 N. The spring changing its shape is also the work of a force.",
    },
    {
      id: "task:field",
      title: "Pull without touching",
      text: "Switch to No touch. Lift steel pins with the bar magnet, and paper bits with the rubbed comb. Do not let them touch the pieces.",
      found:
        "The magnet pulled the pins, and the rubbed comb pulled the paper, across a gap of air. These are non-contact forces: magnetic force and electrostatic force. The pull got stronger as the gap got smaller. A plain comb has no charge, so it pulled nothing.",
    },
  ],
  discovery: {
    scientist: "Isaac Newton",
    years: "1643–1727",
    fact: "When plague closed Cambridge University in 1665, 22-year-old Newton went home to his family farm. In about 18 months there he began working out his ideas on motion, gravity and light, published in his 1687 book Principia.",
    formula: "F = m × a",
    formulaNote: "Newton's second law: the force needed equals mass times acceleration. Push a heavier crate and it speeds up less for the same push.",
  },
  ideas: [
    {
      title: "A force is a push or a pull",
      text: "A force always acts between two objects. It has a size and a direction. A force can change the speed of an object, change its direction of motion, or change its shape. The SI unit of force is the newton (N).",
      formula: "unit of force: newton (N)",
    },
    {
      title: "Contact forces",
      text: "Some forces act only when objects touch. Muscular force comes from our muscles, like when you push a crate or lift a bag. Friction acts between two surfaces in contact and always opposes motion. Static friction stops an object starting to move, and it is a little bigger than sliding friction.",
    },
    {
      title: "Non-contact forces",
      text: "Some forces act across a gap. A magnet pulls iron and steel (magnetic force). A comb rubbed in dry hair pulls bits of paper (electrostatic force). The Earth pulls everything towards it (gravitational force). These pulls get stronger as the gap gets smaller.",
    },
    {
      title: "Weight",
      text: "The weight of an object is the force with which the Earth pulls it. We measure it with a spring balance, in newtons. Mass stays the same everywhere, but weight on the Moon is only about one sixth of that on the Earth.",
      formula: "W = m × g    (g ≈ 9.8 m/s² on the Earth)",
    },
  ],
  challenge: {
    title: "Slide to the zone",
    text: "One push per try, with a fixed push force on each floor. Hold to push, then let go, so that the crate slides and stops with the whole crate inside the green zone. Win on wood, sand and then ice for three stars.",
  },
  quiz: [
    {
      q: "In kabaddi, a defender grabs the raider's ankle and pulls him back. What kind of force is this?",
      options: ["Magnetic force", "Muscular force", "Electrostatic force", "Gravitational force"],
      answer: 1,
      why: "The defender uses the muscles of his body, and he must touch the raider. That is muscular force, a contact force.",
    },
    {
      q: "You press a ball of dough flat to make a roti. Here the force changes the dough's…",
      options: ["Speed", "Shape", "Mass", "Colour"],
      answer: 1,
      why: "A force can change the shape of an object. The dough's mass stays the same.",
    },
    {
      q: "A batter hits a cricket ball back past the bowler. What did the bat's force change?",
      options: ["Only the ball's mass", "The ball's direction of motion (and speed)", "Nothing", "The ball's weight"],
      answer: 1,
      why: "A force can change the direction of motion and the speed of an object. The ball turned around and flew off fast.",
    },
    {
      q: "A comb rubbed in dry hair picks up small bits of paper. Which force is this?",
      options: ["Friction", "Muscular force", "Electrostatic force", "Magnetic force"],
      answer: 2,
      why: "Rubbing gives the comb an electric charge. A charged object pulls light bits of paper without touching them. That is electrostatic force.",
    },
    {
      q: "A bag of potatoes has a mass of 2 kg. What is its weight on the Earth? (g = 9.8 m/s²)",
      options: ["2 N", "9.8 N", "19.6 N", "4.9 N"],
      answer: 2,
      why: "W = m × g = 2 × 9.8 = 19.6 N.",
    },
    {
      q: "Why is it harder to start pushing a heavy almirah than to keep it sliding?",
      options: [
        "Static friction is bigger than sliding friction",
        "The almirah gets lighter once it moves",
        "Gravity switches off when it slides",
        "Friction only acts on moving objects",
      ],
      answer: 0,
      why: "Before the almirah moves, you must beat the limit of static friction. Once it slides, sliding friction is a little smaller.",
    },
    {
      q: "Which instrument measures weight, and in which unit?",
      options: ["A thermometer, in degrees", "A spring balance, in newtons", "A ruler, in metres", "A stopwatch, in seconds"],
      answer: 1,
      why: "Weight is a force, so it is measured in newtons. A spring balance stretches more for a bigger pull.",
    },
  ],
};

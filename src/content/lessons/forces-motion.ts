/**
 * Class 9 · Exploration · "How Forces Affect Motion".
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import { ROUNDS, TOLERANCE } from "@/lib/sim/collision";
import type { LessonDef } from "./types";

export const LESSON_ID = "c9-forces-motion";

/** Challenge: knock cart B to the target speed. One star per round. */
export { ROUNDS, TOLERANCE };

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "newtons-apprentice",
  classNum: 9,
  book: "Exploration",
  chapter: "How Forces Affect Motion",
  title: "Push, crash and bounce",
  intro: {
    objective:
      "Push carts on an air track and crash them together to discover Newton's three laws and momentum.",
    learn: [
      "Inertia: things keep moving or stay still unless a force acts",
      "F = ma: the same push speeds up a light cart more than a heavy one",
      "Action and reaction forces are equal and opposite",
      "Momentum is conserved when objects collide",
    ],
    realLife:
      "A fielder pulling the hands back to catch a ball, seatbelts and airbags, and a gun's recoil all follow these laws.",
    minutes: 30,
  },
  hook: {
    title: "Catch it like a pro",
    text:
      "Watch a fielder take a hard catch at the boundary. The hands do not stay stiff. They pull back with the ball. A car has seatbelts and airbags for the same reason. Both make a stop take longer, so the force is smaller. Newton's three laws explain why. Test them on a frictionless air track with two carts.",
  },
  predict: {
    question: "A cart glides on an air track with no friction. You stop pushing it. What happens next?",
    options: ["It slows down and stops", "It keeps moving at the same speed", "It speeds up for a while"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:inertia",
      title: "Keep gliding",
      text: "Keep the air supply on and push cart A. Watch its velocity after the push ends, before it reaches cart B.",
      found:
        "Once the push stopped, cart A kept the same velocity. No net force acts on it, so nothing changes its motion. This is inertia, and it is Newton's first law. On a road, friction is the force that slows a moving object down.",
    },
    {
      id: "task:balanced",
      title: "Balanced forces",
      text: "Turn the air supply off. Push cart A with a force smaller than the friction it can feel. Does it move?",
      found:
        "The cart did not move. Friction pushed back with exactly the same force, so the forces were balanced and the net force was zero. Only an unbalanced force (bigger than the friction) changes the state of rest or motion.",
    },
    {
      id: "task:fma",
      title: "Same push, more mass",
      text: "With the air on, push cart A twice with the same force: once with a small mass and once with a larger mass. Compare the acceleration.",
      found:
        "With the same force, a cart with more mass got a smaller acceleration. Double the mass and the acceleration halves. Force, mass and acceleration are linked by F = m × a. That is Newton's second law.",
    },
    {
      id: "task:collide",
      title: "Bounce and stick",
      text: "Crash cart A into cart B once with an elastic (bouncy) collision and once with a sticky (velcro) one. Look at the momentum bars.",
      found:
        "In both crashes the total momentum after the collision was the same as before. In the sticky crash the two carts moved off together at a slower speed. Momentum is never lost in a collision. It is only shared out differently.",
    },
    {
      id: "task:recoil",
      title: "Recoil",
      text: "Switch to Recoil. Give the two carts different masses and release the spring between them.",
      found:
        "The spring pushed both carts with the same force, in opposite directions. They got equal and opposite momentum, so the total stayed zero. The lighter cart moved faster. This is Newton's third law, and it is why a gun recoils and a balloon rocket flies.",
    },
  ],
  discovery: {
    scientist: "Christiaan Huygens, John Wallis and Christopher Wren",
    years: "1668",
    fact: "In 1668 London's Royal Society asked scientists for the rules of colliding objects. Huygens, Wallis and Wren each sent in answers, and together they showed that the total momentum stays the same in a collision.",
    formula: "(m₁ × u₁) + (m₂ × u₂) = (m₁ × v₁) + (m₂ × v₂)",
    formulaNote: "Conservation of momentum: total momentum before a collision equals total momentum after it.",
  },
  symbols: [
    { sym: "F", meaning: "force, in newtons (N)" },
    { sym: "m", meaning: "mass, in kg" },
    { sym: "a", meaning: "acceleration, in m/s²" },
    { sym: "t", meaning: "time the force acts, in s" },
    { sym: "u", meaning: "speed before, in m/s" },
    { sym: "v", meaning: "speed after, in m/s" },
    { sym: "p", meaning: "momentum: mass × velocity, in kg m/s" },
    { sym: "m₁, m₂", meaning: "the masses of the two objects" },
  ],
  ideas: [
    {
      title: "First law: inertia",
      text: "An object stays at rest, or keeps moving in a straight line at a steady speed, unless an unbalanced force acts on it. This tendency is called inertia, and more mass means more inertia. Balanced forces add up to zero and do not change motion.",
    },
    {
      title: "Second law: F = ma",
      text: "The net force on an object equals its mass times its acceleration. One newton is the force that gives a 1 kg mass an acceleration of 1 m/s². A force acting for a time changes momentum: F × t = change in momentum. A fielder pulling the hands back makes t longer, so the force on the hands is smaller.",
      formula: "F = m × a    F × t = (m × v) − (m × u)",
    },
    {
      title: "Third law: action and reaction",
      text: "When object A pushes on object B, B pushes back on A with an equal force in the opposite direction. The two forces act on different objects, so they do not cancel. A gun recoils, a swimmer pushes water back to move forward, and a rocket pushes gases down to go up.",
      formula: "Force of A on B = − (force of B on A)",
    },
    {
      title: "Momentum and its conservation",
      text: "Momentum is mass times velocity, and it has a direction. When objects collide or push each other apart, the total momentum stays the same as long as no outside force acts.",
      formula: "p = m × v (kg m/s)    (m₁ × u₁) + (m₂ × u₂) = (m₁ × v₁) + (m₂ × v₂)",
    },
  ],
  challenge: {
    title: "Target practice",
    text: "Each round gives cart B a mass and a target speed. Choose cart A's mass and the push so that B leaves at the target speed, within 0.05 m/s. One star per round.",
  },
  quiz: [
    {
      q: "Passengers in a bus fall forward when the driver brakes suddenly. Why?",
      options: [
        "The bus pushes them forward",
        "Their bodies tend to keep moving because of inertia",
        "Air rushes in from the back",
        "Gravity gets stronger when the bus stops",
      ],
      answer: 1,
      why: "The bus stops, but the passengers' bodies keep moving forward because of inertia (first law). A seatbelt gives the force that stops them safely.",
    },
    {
      q: "A force of 10 N acts on a 2 kg trolley with no friction. What is its acceleration?",
      options: ["20 m/s²", "5 m/s²", "0.2 m/s²", "12 m/s²"],
      answer: 1,
      why: "a = F ÷ m = 10 ÷ 2 = 5 m/s².",
    },
    {
      q: "Why does a fielder pull the hands back while catching a fast cricket ball?",
      options: [
        "To reduce the ball's mass",
        "To make the catch take longer, so the force on the hands is smaller",
        "To increase the ball's momentum",
        "To make the ball bounce out",
      ],
      answer: 1,
      why: "The ball's momentum must drop to zero either way. Since F × t = change in momentum, a longer time means a smaller force.",
    },
    {
      q: "What is the momentum of a 0.15 kg cricket ball moving at 20 m/s?",
      options: ["3 kg m/s", "0.0075 kg m/s", "133 kg m/s", "20.15 kg m/s"],
      answer: 0,
      why: "p = m × v = 0.15 × 20 = 3 kg m/s.",
    },
    {
      q: "A 4 kg gun fires a 0.02 kg bullet at 400 m/s. What is the gun's recoil speed?",
      options: ["0.5 m/s", "2 m/s", "8 m/s", "80 m/s"],
      answer: 1,
      why: "Total momentum starts at zero. The bullet gets 0.02 × 400 = 8 kg m/s forward, so the gun gets 8 kg m/s backward: 8 ÷ 4 = 2 m/s.",
    },
    {
      q: "A horse pulls a cart. By the third law the cart pulls the horse back with an equal force. So why does the cart move?",
      options: [
        "The two forces cancel, so it cannot move",
        "The horse's pull is a bit bigger",
        "The two forces act on different objects, so they do not cancel",
        "The third law does not apply to animals",
      ],
      answer: 2,
      why: "Action and reaction act on different objects. The cart moves because the horse's pull on it is bigger than the friction on the cart.",
    },
    {
      q: "A 2 kg cart at 3 m/s hits a 1 kg cart at rest, and they stick together. How fast do they move off?",
      options: ["1 m/s", "1.5 m/s", "2 m/s", "3 m/s"],
      answer: 2,
      why: "Momentum before = 2 × 3 = 6 kg m/s. After, 3 kg moves together, so v = 6 ÷ 3 = 2 m/s.",
    },
  ],
};

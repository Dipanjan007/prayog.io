/**
 * Class 9 · Outliers · "Circular Motion: Centripetal and Centrifugal Force".
 * Goes beyond the current NCERT chapter on motion and gravitation.
 */
import type { SpinRound } from "@/lib/sim/circular";
import type { LessonDef } from "./types";

export const LESSON_ID = "x-circular-motion";

/** Challenge: one car round and two satellite rounds; one star each. */
export const ROUNDS: SpinRound[] = [
  { kind: "car", title: "Hairpin bend on a ghat road", r: 25, mu: 0.6, m: 1200 },
  { kind: "orbit", title: "Earth-watching satellite, 500 km up", altKm: 500 },
  { kind: "orbit", title: "ISRO's geostationary GSAT, 35,786 km up", altKm: 35_786 },
];

/** Car: the speed must be safe and no more than 5% under the limit. */
export const CAR_TOLERANCE = 0.05;
/** Satellite: the speed must be within 2% of the circular-orbit speed. */
export const ORBIT_TOLERANCE = 0.02;

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "spin-doctor",
  classNum: 9,
  book: "Outliers",
  chapter: "Circular Motion: Centripetal and Centrifugal Force",
  title: "Spin, swing and the spinning Earth",
  intro: {
    objective:
      "Whirl a ball, drive a car round a bend and ride along with them, then use the same idea to explain the spinning Earth, the Moon and ISRO's satellites.",
    learn: [
      "Moving in a circle needs an inward (centripetal) force F = (m × v²) ÷ r",
      "Cut the string and the ball flies off along the tangent, not outward",
      "Centrifugal force is an apparent force felt only when you ride along",
      "Why you weigh a little less at the equator, and how gravity keeps the Moon and satellites in orbit",
    ],
    realLife:
      "A car taking a sharp turn, the merry-go-round at a mela, the spin cycle of a washing machine, a hammer thrower, and the satellites that bring us TV and weather pictures.",
    minutes: 30,
  },
  hook: {
    title: "Thrown outward?",
    text:
      "Sit on a merry-go-round at a mela and you feel pulled outward. In a car taking a sharp turn, you slide towards the door. A washing machine spins water out of clothes. So is there a force pushing things outward? And here is a stranger fact: right now, sitting still, you are moving at hundreds of metres per second because the Earth spins. Why don't you fly off?",
  },
  predict: {
    question: "You whirl a ball on a string in a circle above your head, and the string snaps. Which way does the ball fly?",
    options: [
      "Straight outward, away from the centre",
      "Along the tangent, the way it was moving at that moment",
      "It keeps curving round in a circle for a while",
    ],
    answer: 1,
  },
  tasks: [
    {
      id: "task:force",
      title: "Feel the pull",
      text: "In Whirl mode with the ball, keep the mass and radius the same. Set the speed to 3 m/s or less, then to double that speed or more. Watch the pink force arrow and the string tension.",
      found:
        "Double the speed and the inward force becomes four times as big, because F = (m × v²) ÷ r has v squared. A heavier ball or a smaller circle also needs a bigger pull. This inward force is called the centripetal force.",
    },
    {
      id: "task:cut",
      title: "Cut the string",
      text: "In the From outside view, tap Cut the string. Watch which way the ball goes.",
      found:
        "With no string, there is no inward force. By Newton's first law the ball keeps going straight at the same speed, along the tangent to the circle. It does not fly straight outward.",
    },
    {
      id: "task:ride",
      title: "Ride along",
      text: "Re-attach the ball if needed, then switch the view to Riding along. You now turn with the ball, like a rider on a merry-go-round.",
      found:
        "Riding along, the ball looks still, so it seems an outward force balances the string. This is the centrifugal force. It is an apparent force: it appears only because you are turning. From outside, there is only the inward pull.",
    },
    {
      id: "task:earth",
      title: "The spinning Earth",
      text: "Switch to Spinning Earth. Visit the Equator and then the North Pole. Compare the spin speed and the weight of a 50 kg student.",
      found:
        "The equator goes round a big circle once a day, at about 465 m/s. It needs a centripetal acceleration of about 0.034 m/s², which gravity has to supply. So a scale reads about 0.3% less there. At the pole you just turn on the spot, with no circle at all.",
    },
    {
      id: "task:orbit",
      title: "Stay in orbit",
      text: "Switch to Orbits and choose Satellite. Launch it slowly first and watch it fall. Then find a speed where it goes all the way round without hitting the Earth.",
      found:
        "A satellite is always falling towards the Earth, but it moves sideways so fast that the ground curves away beneath it. Gravity is the string: it gives exactly the centripetal force when v = √((G × M) ÷ r).",
    },
  ],
  discovery: {
    scientist: "Christiaan Huygens",
    years: "1629–1695",
    fact: "Huygens gave centrifugal force its name, from the Latin for 'fleeing the centre'. In 1673, at the end of his book on pendulum clocks, Horologium Oscillatorium, he published its rules: it grows with the square of the speed and gets smaller on a bigger circle.",
    formula: "F = (m × v²) ÷ r",
    formulaNote: "The inward force needed to keep a mass m moving at speed v round a circle of radius r.",
  },
  symbols: [
    { sym: "F", meaning: "inward (centripetal) force, in newtons (N)" },
    { sym: "m", meaning: "mass of the moving object, in kg" },
    { sym: "v", meaning: "speed, in m/s" },
    { sym: "r", meaning: "radius of the circle, in m" },
    { sym: "a", meaning: "acceleration towards the centre, in m/s²" },
    { sym: "ω", meaning: "omega, how fast the Earth spins, in radians per second" },
    { sym: "R", meaning: "radius of the Earth, in m" },
    { sym: "G", meaning: "the gravitational constant" },
    { sym: "M", meaning: "mass of the Earth or Sun, in kg" },
    { sym: "cos", meaning: "cosine of the angle, a button on the calculator; cos(0°) = 1 at the equator" },
    { sym: "√( )", meaning: "square root of what is inside the bracket" },
  ],
  ideas: [
    {
      title: "Centripetal force points to the centre",
      text: "On a circle the speed may stay the same, but the direction keeps changing, so the object is accelerating towards the centre. Something must pull it in: string tension for a ball, friction from the road for a car, gravity for the Moon. Double the speed and you need four times the force.",
      formula: "F = (m × v²) ÷ r      a = v² ÷ r",
    },
    {
      title: "No pull, no circle",
      text: "Cut the string and the inward force is gone. The ball keeps the velocity it had at that instant and goes straight along the tangent. Sparks from a grinding wheel and mud from a bicycle tyre fly off the same way. A car going too fast for its tyres slides off on a wider curve, to the outside of the bend.",
    },
    {
      title: "Centrifugal force is an apparent force",
      text: "On a merry-go-round at a mela you feel thrown outward. Really your body is trying to go straight, and the seat or bar pushes you inward. Riding along, it feels like an outward force, so we call it centrifugal force. It only appears in a turning (rotating) frame. In a washing machine, the drum pushes the clothes round, but the water slips out through the holes because nothing holds it on the circle.",
    },
    {
      title: "Mapping it to the spinning Earth",
      text: "The Earth turns once a day (23 h 56 min against the stars). At the equator the ground moves at about 465 m/s; in Delhi about 409 m/s; at the poles zero. Part of gravity is used up as centripetal force, so a 50 kg student weighs about 1.7 N (0.3%) less at the equator from spin alone. The Earth also bulges at the equator, so you are farther from its centre. Together g goes from 9.832 m/s² at the poles to 9.780 m/s² at the equator.",
      formula: "v = ω × R × cos(latitude)      a = ω² × R ≈ 0.034 m/s² at the equator",
    },
    {
      title: "Gravity is the string for orbits",
      text: "The Moon goes round the Earth at about 1 km/s and the Earth goes round the Sun at about 30 km/s. In both, gravity provides exactly the centripetal force. A satellite needs v = √((G × M) ÷ r): about 7.7 km/s just above the air, and about 3.07 km/s at 35,786 km, where one orbit takes a day. ISRO's GSAT satellites sit there, so they seem to hang still over India.",
      formula: "(G × M × m) ÷ r² = (m × v²) ÷ r   so   v = √((G × M) ÷ r)",
    },
  ],
  challenge: {
    title: "Curves and orbits",
    text: "Three jobs. Find the fastest safe speed for a car on a hairpin bend (within 5% of the limit, without skidding). Then launch two satellites at the exact speed for a circular orbit (within 2%). One star per job.",
  },
  quiz: [
    {
      q: "A 0.5 kg ball is whirled at 4 m/s on a string 1 m long. What is the tension in the string?",
      options: ["2 N", "4 N", "8 N", "16 N"],
      answer: 2,
      why: "F = (m × v²) ÷ r = (0.5 × 16) ÷ 1 = 8 N. The string must supply all of the centripetal force.",
    },
    {
      q: "A car takes the same curve at double the speed. How much more sideways friction does it need?",
      options: ["The same", "Twice as much", "Four times as much", "Half as much"],
      answer: 2,
      why: "F = (m × v²) ÷ r depends on v squared, so doubling the speed needs 2² = 4 times the force. That is why speeding on bends is so dangerous.",
    },
    {
      q: "On a merry-go-round you feel pushed outward. What is really happening?",
      options: [
        "A real outward force pushes you from the centre",
        "Your body tries to go straight, and the seat pushes you inward to keep you on the circle",
        "Gravity gets weaker when you spin",
        "The air pushes you outward",
      ],
      answer: 1,
      why: "Centrifugal force is an apparent force felt in a rotating frame. From outside, the only real horizontal force on you is the inward push of the seat.",
    },
    {
      q: "Where on Earth does a 50 kg student weigh the least on a bathroom scale?",
      options: ["At the North Pole", "In Leh", "In Delhi", "At the equator"],
      answer: 3,
      why: "At the equator you move on the biggest circle, so more of gravity is used as centripetal force. You are also farther from the centre because of the bulge. g is 9.780 m/s² there against 9.832 m/s² at the poles.",
    },
    {
      q: "Why does an ISRO geostationary satellite seem to stay still over India?",
      options: [
        "There is no gravity 35,786 km up",
        "Its engines keep it hovering",
        "It orbits once a day, the same as the Earth spins, so it keeps pace with the ground",
        "It is too far away to see it move",
      ],
      answer: 2,
      why: "At 35,786 km gravity gives the centripetal force for a speed of about 3.07 km/s, which takes exactly one day per orbit. Gravity is still there; it is the string that keeps the satellite on its circle.",
    },
  ],
};

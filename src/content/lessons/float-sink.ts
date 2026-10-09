/**
 * Class 8 · Curiosity (NCERT 2025) · "Exploring Forces", second lab.
 * Covers §5.6 floating and sinking: upthrust (buoyant force), Activity 5.13 (a stone hung from a
 * spring balance reads less when it is in water) and Archimedes' principle (upthrust equals the
 * weight of liquid pushed aside). Also covers repulsion from the non-contact forces part of the
 * chapter: like poles repel (Activity 5.5, ring magnets floating on a pencil) and like charges repel (Activity 5.7, two rubbed
 * balloons), since the first lab of this chapter shows only attraction.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c8-float-sink";

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "eureka-finder",
  classNum: 8,
  book: "Curiosity",
  chapter: "Exploring Forces",
  title: "Float or sink?",
  intro: {
    objective:
      "Lower objects into water, salt water and oil on a spring balance, and catch the overflow, to find the upward push of a liquid and what makes things float.",
    learn: [
      "A liquid pushes up on anything in it: this is upthrust, or buoyant force",
      "Archimedes' principle: upthrust equals the weight of the liquid pushed aside",
      "Why an object floats or sinks, and why shape and the liquid matter",
      "Like magnetic poles repel, and like electric charges repel",
    ],
    realLife:
      "Boats on the Ganga, cargo ships at Kochi port, an egg test in the kitchen, a mug that feels lighter under water in a bucket, and floating ring magnets all use the ideas in this lab.",
    minutes: 25,
  },
  hook: {
    title: "The ship and the nail",
    text:
      "Drop an iron nail into a bucket of water and it sinks at once. Yet a cargo ship made of thousands of tonnes of steel floats on the sea at Kochi. Lift a full bucket of water out of a well and it feels much lighter while it is still under water. What is the water doing? Hang things from a spring balance and lower them into a tank to find out.",
  },
  predict: {
    question: "A stone hangs from a spring balance that reads 4.9 N. You lower it until it is fully under water. What does the balance read now?",
    options: ["More than 4.9 N", "Less than 4.9 N", "Still exactly 4.9 N"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:drop",
      title: "Lighter in water",
      text: "In Tank mode, hang the stone in water. Slide Lower the spring balance all the way, and watch the reading as the stone goes under.",
      found:
        "The reading fell from 4.90 N to 2.94 N. The stone's weight did not change, so the water must be pushing it up with 1.96 N. This upward push of a liquid is called upthrust, or buoyant force. Once the stone was fully under, the reading stopped falling.",
    },
    {
      id: "task:overflow",
      title: "Weigh the overflow",
      text: "The tank is full to the spout, so the water the object pushes aside runs into the beaker. Lower two different objects all the way (or until they float). Each time, compare the upthrust with the weight of the overflow.",
      found:
        "Each time, the weight of the liquid in the beaker was exactly equal to the upthrust. This is Archimedes' principle: the upthrust on an object equals the weight of the liquid it pushes aside. A floating object pushes aside its own weight of liquid.",
    },
    {
      id: "task:liquid",
      title: "Change the liquid",
      text: "Find one object that sinks in one liquid but floats in another. Hang it, lower it, then tap Let go to see what it does. Hint: try the egg.",
      found:
        "The egg sank in plain water but floated in salt water. Salt water is denser, so the same volume of it weighs more and pushes up harder. An object floats when the liquid can push up as much as the object weighs before it is fully under.",
    },
    {
      id: "task:shape",
      title: "Bowl and ball",
      text: "The steel bowl and the steel ball have the same mass. Let each one go in the tank and see what happens.",
      found:
        "The ball sank but the bowl floated. The bowl's shape lets it push aside much more water: its hollow holds air, so the bowl plus its air is less dense than water. That is how a steel ship floats.",
    },
    {
      id: "task:repel",
      title: "Push without touching",
      text: "Switch to Repel. Flip a ring magnet so that one floats above another on the pencil. Then rub both balloons on dry hair until they push apart.",
      found:
        "When like poles face each other (N to N, or S to S), the upper ring floats in the air. Rubbing gave both balloons the same kind of charge, so they pushed each other apart. Like poles repel and like charges repel, without touching. Unlike ones attract.",
    },
  ],
  discovery: {
    scientist: "Archimedes",
    years: "about 287–212 BCE",
    fact: "The story goes that Archimedes saw the water rise as he got into his bath and ran through Syracuse shouting \"Eureka!\" (\"I have found it!\"). That tale was written down about 200 years later. What is certain is his book On Floating Bodies, which states the law of upthrust.",
    formula: "Upthrust = weight of liquid displaced",
    formulaNote: "Archimedes' principle: a liquid pushes up on an object with a force equal to the weight of the liquid the object pushes aside.",
  },
  symbols: [
    { sym: "Upthrust", meaning: "the upward push of a liquid on an object in it, in newtons (N)" },
    { sym: "Weight", meaning: "the pull of gravity on the object, in N" },
    { sym: "density", meaning: "how much mass is packed into each unit of volume, in g/cm³ or kg/m³" },
    { sym: "÷", meaning: "divide" },
    { sym: "−", meaning: "take away" },
  ],
  ideas: [
    {
      title: "Upthrust",
      text: "A liquid pushes up on any object in it. This upward force is called upthrust, or buoyant force. That is why a stone reads less on a spring balance when it is in water, and why a bucket feels lighter until it leaves the water.",
      formula: "Reading in liquid = Weight − Upthrust",
    },
    {
      title: "Archimedes' principle",
      text: "The upthrust equals the weight of the liquid the object pushes aside (displaces). The more of the object goes under, the more liquid it pushes aside and the bigger the upthrust. A denser liquid, like salt water, gives more upthrust for the same volume.",
      formula: "Upthrust = weight of liquid displaced",
    },
    {
      title: "Float or sink",
      text: "An object floats if the upthrust can match its weight before it is fully under. Then it sinks only part way. If even fully under the upthrust is less than its weight, it sinks. In short: objects less dense than the liquid float, and denser ones sink. Ice floats in water. An egg sinks in plain water but floats in salt water.",
      formula: "density = mass ÷ volume",
    },
    {
      title: "Shape matters",
      text: "A steel ball sinks, but a steel bowl of the same mass floats, because its hollow shape pushes aside much more water. Ships are built the same way. A loaded boat sits lower in the water, and if the water reaches the top of the hull, it pours in and the boat sinks. Ships have a load line painted on the side to show how deep they may safely sit.",
    },
    {
      title: "Repulsion: like poles, like charges",
      text: "Magnets and charges can push as well as pull. Like poles (N and N, or S and S) repel, and unlike poles attract. Ring magnets on a pencil with like poles facing float one above another. Two balloons rubbed on hair get the same kind of charge and push apart, while unlike charges attract.",
    },
  ],
  challenge: {
    title: "Cargo boats",
    text: "Load each boat on the bank, then launch it. Load it as much as you can without sinking it: at least 90% of the most it can carry. Use the hull volume, the boat's mass and the water to work it out. A country boat on the Ganga, a Kerala kettuvallam and a cargo ship at sea: one star each.",
  },
  quiz: [
    {
      q: "A stone reads 10 N on a spring balance in air and 6 N when fully under water. What is the upthrust on it?",
      options: ["16 N", "6 N", "4 N", "10 N"],
      answer: 2,
      why: "Upthrust = weight in air − reading in water = 10 − 6 = 4 N.",
    },
    {
      q: "In the same experiment, how much does the water that overflows into the beaker weigh?",
      options: ["4 N", "6 N", "10 N", "It cannot be known"],
      answer: 0,
      why: "By Archimedes' principle, the upthrust equals the weight of the liquid pushed aside, so the overflow weighs 4 N.",
    },
    {
      q: "An egg sinks in a glass of water. What can you add to make it float?",
      options: ["More water", "Lots of salt, stirred in", "Cooking oil on top", "Ice cubes"],
      answer: 1,
      why: "Salt water is denser than plain water, so it gives more upthrust. With enough salt, the upthrust beats the egg's weight and it floats.",
    },
    {
      q: "Why does a steel ship float while a steel nail sinks?",
      options: [
        "Steel in ships is a lighter kind of steel",
        "The ship's hollow shape pushes aside a lot of water, so the upthrust can equal its weight",
        "The sea pulls ships up but not nails",
        "Big things always float",
      ],
      answer: 1,
      why: "The ship is hollow and holds air, so it pushes aside a huge volume of water. The weight of that water equals the ship's weight, so it floats.",
    },
    {
      q: "Two balloons are both rubbed on dry hair and hung side by side. What happens?",
      options: ["They pull together", "They push apart", "Nothing", "They lose their air"],
      answer: 1,
      why: "Both get the same kind of charge, and like charges repel. Unlike charges would attract.",
    },
    {
      q: "Ring magnets are put on a pencil and one floats above the other. Which faces are towards each other?",
      options: ["N and S", "Like poles: N and N, or S and S", "There are no poles on a ring magnet", "It depends on the pencil"],
      answer: 1,
      why: "Like poles repel. The push up on the top ring balances its weight, so it floats in the air.",
    },
  ],
};

/**
 * Class 9 · Exploration · "Sound Waves: Characteristics and Applications".
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c9-sound";

/** Challenge: three mystery spots at sea. Depth in metres; one star each. */
export const SEA_SPOTS = [
  { name: "Off the Mumbai coast", depth: 480 },
  { name: "Bay of Bengal", depth: 1350 },
  { name: "Arabian Sea, far out", depth: 2730 },
];

/** A depth answer counts if it is within this fraction of the true depth. */
export const DEPTH_TOLERANCE = 0.03;

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "sound-explorer",
  classNum: 9,
  book: "Exploration",
  chapter: "Sound Waves: Characteristics and Applications",
  title: "See sound, bounce sound",
  intro: {
    objective:
      "See sound as a wave, change its pitch and loudness, and use echoes to measure distances like a ship's SONAR.",
    learn: [
      "Sound is a longitudinal wave of compressions and rarefactions",
      "Frequency sets the pitch and amplitude sets the loudness",
      "Sound travels at different speeds in air, water and steel",
      "How echoes and SONAR measure distance, and the human hearing range",
    ],
    realLife:
      "Hearing a cricket bat's crack late in a big stadium, echoes in a hall, ultrasound scans and ships finding the sea depth all use sound waves.",
    minutes: 25,
  },
  hook: {
    title: "The late crack of the bat",
    text:
      "Sit at the far end of a big cricket stadium. You see the batter hit a six, and only a moment later you hear the crack. Shout across a valley at a hill station and your voice comes back to you. Navy ships find the depth of the sea using sound. What is sound, and how fast does it really go? Let's make it visible.",
  },
  predict: {
    question: "You raise the pitch of a sound in air. What happens to its wavelength?",
    options: ["It gets longer", "It gets shorter", "It stays the same"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:pitch",
      title: "High and low",
      text: "In Sound wave mode, set the frequency to 800 Hz or more, then to 200 Hz or less. Watch the spacing of the crowded bands.",
      found:
        "At a high frequency the compressions come closer together, so the wavelength is shorter. A higher frequency gives a higher pitch. Tap Play if you want to hear the change.",
    },
    {
      id: "task:loud",
      title: "Loud and soft",
      text: "Push the amplitude slider all the way up, then bring it down to a small value. Watch the particles and the pressure graph.",
      found:
        "A bigger amplitude makes the particles swing further and the pressure rise and fall more. A larger amplitude gives a louder sound. The wavelength does not change.",
    },
    {
      id: "task:medium",
      title: "Change the medium",
      text: "Keep the same frequency and switch the medium from air to water or steel.",
      found:
        "Sound travels about 4 times faster in water and about 17 times faster in steel than in air. The frequency stays the same, so by v = fλ the wavelength becomes longer.",
    },
    {
      id: "task:echo",
      title: "Hear a clear echo",
      text: "Switch to Echo mode. The wall starts too close. Move it back and clap until you get an echo you can hear apart from the clap.",
      found:
        "Your ear holds a sound for about 0.1 s. In 0.1 s sound in air travels about 34 m, which is there and back for a wall about 17.2 m away. A nearer wall gives an echo that blends into the clap.",
    },
    {
      id: "task:sonar",
      title: "Ping the seabed",
      text: "Switch to SONAR mode and send an ultrasound ping from the ship. Read the echo time.",
      found:
        "The ship sends ultrasound down and times the echo from the seabed. The sound goes down and back up, so depth = (v × t) ÷ 2, with v about 1500 m/s in sea water.",
    },
  ],
  discovery: {
    scientist: "Lazzaro Spallanzani",
    years: "1729–1799",
    fact: "In the 1790s Spallanzani found that blindfolded bats still flew safely through a dark room, but bats with plugged ears crashed. Bats find their way by echoes, the same idea as SONAR.",
    formula: "v = f × λ",
    formulaNote: "The speed of a wave equals its frequency times its wavelength.",
  },
  symbols: [
    { sym: "v", meaning: "speed of sound, in m/s" },
    { sym: "f", meaning: "frequency: waves each second, in hertz (Hz)" },
    { sym: "λ", meaning: "lambda, wavelength: length of one wave, in m" },
    { sym: "T", meaning: "time period of one wave, in s" },
    { sym: "d", meaning: "distance to the wall, in m" },
    { sym: "t", meaning: "time for the echo to come back, in s" },
  ],
  ideas: [
    {
      title: "Sound is a longitudinal wave",
      text: "Sound is made by vibrating objects. It needs a medium (solid, liquid or gas) and cannot travel through a vacuum. The particles of the medium vibrate back and forth along the direction the sound travels. This makes crowded regions (compressions, high pressure) and spread-out regions (rarefactions, low pressure). The particles stay near their place. Only the disturbance moves on.",
    },
    {
      title: "Frequency, pitch, amplitude, loudness",
      text: "Frequency is the number of vibrations each second, measured in hertz (Hz). A higher frequency gives a higher pitch. Amplitude is the largest change from the normal state. A larger amplitude gives a louder sound. Time period T is the time for one vibration.",
      formula: "f = 1 ÷ T",
    },
    {
      title: "Wave speed",
      text: "Wavelength (λ) is the distance between two neighbouring compressions. In one second, f waves each of length λ go past, so the speed is fλ. Sound is fastest in solids and slowest in gases: about 343 m/s in air at 20 °C, about 1500 m/s in water and about 5960 m/s in steel.",
      formula: "v = f × λ",
    },
    {
      title: "Echo, hearing range and SONAR",
      text: "An echo is sound reflected from a large surface. To hear it apart from the original sound, it must come back after at least 0.1 s, so the wall must be at least about 17.2 m away. Humans hear from 20 Hz to 20 kHz. Sound above 20 kHz is ultrasound. SONAR sends ultrasound into water and times the echo to find the depth of the sea or a submarine.",
      formula: "2 × d = v × t,  so  d = (v × t) ÷ 2",
    },
  ],
  challenge: {
    title: "Sea depth survey",
    text: "Three spots at sea, and the seabed is hidden. Ping with SONAR, read the echo time, and work out the depth using v = 1500 m/s. One star per spot.",
  },
  quiz: [
    {
      q: "In a sound wave in air, how do the air particles move?",
      options: [
        "Up and down, across the direction of travel",
        "Back and forth, along the direction of travel",
        "They travel with the sound to your ear",
        "They do not move at all",
      ],
      answer: 1,
      why: "Sound is a longitudinal wave. Particles vibrate back and forth along the direction of travel and stay near their place.",
    },
    {
      q: "Which property of a sound decides its pitch?",
      options: ["Amplitude", "Speed", "Frequency", "Loudness"],
      answer: 2,
      why: "A higher frequency gives a higher pitch. Amplitude decides loudness.",
    },
    {
      q: "A sound of frequency 686 Hz travels in air at 343 m/s. What is its wavelength?",
      options: ["2 m", "0.5 m", "1 m", "235 m"],
      answer: 1,
      why: "λ = v ÷ f = 343 ÷ 686 = 0.5 m.",
    },
    {
      q: "In which medium does sound travel fastest?",
      options: ["Air", "Water", "Steel", "A vacuum"],
      answer: 2,
      why: "Sound is fastest in solids. In steel it is about 5960 m/s. It cannot travel in a vacuum at all.",
    },
    {
      q: "Our ear keeps a sound for 0.1 s. If sound travels at 344 m/s, what is the least distance to a wall for a distinct echo?",
      options: ["34.4 m", "17.2 m", "3.44 m", "8.6 m"],
      answer: 1,
      why: "Total path = 344 × 0.1 = 34.4 m. This is there and back, so the wall is 34.4 ÷ 2 = 17.2 m away.",
    },
    {
      q: "A ship's SONAR gets an echo from the seabed after 2 s. Sound travels at 1500 m/s in sea water. How deep is the sea?",
      options: ["3000 m", "750 m", "1500 m", "6000 m"],
      answer: 2,
      why: "2 × d = v × t = 1500 × 2 = 3000 m, so d = 1500 m.",
    },
    {
      q: "A dog whistle gives a sound of 30 kHz. Why can't we hear it?",
      options: [
        "It is ultrasound, above our 20 kHz limit",
        "It is infrasound, below 20 Hz",
        "It is too loud",
        "Sound cannot travel in air",
      ],
      answer: 0,
      why: "Humans hear from 20 Hz to 20 kHz. 30 kHz is ultrasound. Dogs can hear it, but we cannot.",
    },
  ],
};

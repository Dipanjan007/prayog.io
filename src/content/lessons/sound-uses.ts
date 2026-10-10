/**
 * Class 9 · Exploration · "Sound Waves: Characteristics and Applications" (second lab).
 * Covers NCERT §10.2.1 (sound needs a medium: the bell jar), §10.7.2 (reverberation and how
 * halls reduce it), §10.8 (uses of ultrasound, infrasound) and the human hearing range.
 * The first lab (sound.ts) covers pitch, loudness, speed in media, echo and SONAR.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";
import { CHALLENGE_HALLS } from "@/lib/sim/acoustics";

export const LESSON_ID = "c9-sound-uses";

/** Challenge: three halls to tune to a target reverberation time. One star each. */
export const HALLS = CHALLENGE_HALLS;

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "hall-tuner",
  classNum: 9,
  book: "Exploration",
  chapter: "Sound Waves: Characteristics and Applications",
  title: "Silent bells and singing halls",
  intro: {
    objective:
      "Prove that sound needs a medium, tame the echoes in a hall, find a hidden crack in steel with ultrasound and compare what animals can hear.",
    learn: [
      "Sound cannot travel through a vacuum, even when the source still vibrates",
      "Reverberation, and how curtains, carpets, panels and people cut it down",
      "Sabine's formula for reverberation time: T = (0.161 × V) ÷ A",
      "Uses of ultrasound, infrasound, and hearing ranges of people and animals",
    ],
    realLife:
      "Astronauts talking by radio, a booming school hall on annual day, a cinema with padded walls, railway workers checking rails for cracks, and ultrasound scans in hospitals.",
    minutes: 25,
  },
  hook: {
    title: "The hall that ate the speech",
    text:
      "Your school's annual day is in the new auditorium. The principal speaks, but every word rings on and runs into the next one, so nobody understands a thing. Meanwhile, on the International Space Station, astronauts working outside cannot hear each other speak at all. They talk by radio. Why does sound linger in one place and vanish in another?",
  },
  predict: {
    question: "An electric bell rings inside a glass jar. You pump the air out. What happens?",
    options: ["The bell rings louder, with nothing in its way", "The ringing fades away, even though the bell keeps vibrating", "The bell stops vibrating, so the sound stops"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:silence",
      title: "Silence the bell",
      text: "In Bell jar mode, drag the pump strokes slider up until the loudness meter reads Silent. Keep an eye on the bell's hammer.",
      found:
        "With almost no air left, almost no sound gets out, but the hammer never stopped. The bell still vibrates. Sound needs a medium to travel. In a real jar a faint sound still leaks out through the bell's wires and the base, so it never goes perfectly quiet.",
    },
    {
      id: "task:return",
      title: "Bring the sound back",
      text: "Now let the air back into the jar and watch the meter.",
      found:
        "As the air returns, the ringing returns. The air particles carry the vibration from the bell to the glass and out to your ear. This is why there is no sound in space, and astronauts use radio, which needs no medium.",
    },
    {
      id: "task:hall",
      title: "Tame the hall",
      text: "Switch to Hall mode. The bare auditorium rings for over 8 s. Add carpet, curtains, panels or an audience until the reverberation time is below 1.5 s. Clap to hear and see the difference.",
      found:
        "Every bounce off a soft surface soaks up some sound. More absorption A means a shorter reverberation time, T = (0.161 × V) ÷ A. For speech, 1 to 1.5 s is good. Too long and words blur, too short and the hall sounds dead.",
    },
    {
      id: "task:crack",
      title: "Find the hidden crack",
      text: "Switch to Ultrasound mode. Slide the probe along the steel block and send pulses until an echo comes back early.",
      found:
        "Normally the pulse bounces off the bottom of the block. Over a crack it bounces off the crack instead, so the echo returns sooner. Depth = (v × t) ÷ 2. Railway rails and bridge parts are checked this way without cutting them open.",
    },
    {
      id: "task:hearing",
      title: "Who hears what?",
      text: "Switch to Hearing mode. Find a pitch that only the elephant can hear, and one that only the dolphin can hear.",
      found:
        "Elephants hear infrasound, below 20 Hz, which we cannot. Dolphins and bats hear ultrasound far above our 20 kHz limit. People hear only from about 20 Hz to 20 kHz.",
    },
  ],
  discovery: {
    scientist: "Wallace Clement Sabine",
    years: "1868–1919",
    fact: "In 1895 Harvard asked young physics teacher Sabine to fix the Fogg lecture hall, where every word rang on for over 5 seconds. Working at night, he and helpers carried seat cushions in from a nearby theatre and timed how long a sound lasted. This began the science of architectural acoustics.",
    formula: "T = (0.161 × V) ÷ A",
    formulaNote: "Reverberation time (s) is 0.161 times the room's volume (m³) divided by its total absorption (m²).",
  },
  symbols: [
    { sym: "T", meaning: "reverberation time: how long a sound keeps echoing, in s" },
    { sym: "V", meaning: "volume of the hall, in m³" },
    { sym: "A", meaning: "total sound absorption of the surfaces, in m²" },
    { sym: "0.161", meaning: "a fixed number from Sabine's experiments" },
    { sym: "v", meaning: "speed of sound in the material, in m/s" },
    { sym: "t", meaning: "time for the echo to come back, in s" },
  ],
  ideas: [
    {
      title: "Sound needs a medium",
      text: "Sound travels by making the particles of a medium vibrate, so it cannot cross a vacuum. In 1660 Robert Boyle hung a ticking watch inside a glass jar and pumped the air out. The ticking grew fainter. Light still crosses the vacuum, which is why we see the Sun but do not hear it.",
    },
    {
      title: "Reverberation",
      text: "In a big hall, sound bounces off the walls, ceiling and floor many times, so it lingers. This lasting sound is reverberation. Halls cut it with soft materials that absorb sound: curtains, carpets, panels of fibreboard, cushioned seats, and the audience itself. Ceilings are often curved so sound spreads evenly.",
      formula: "T = (0.161 × V) ÷ A",
    },
    {
      title: "Uses of ultrasound",
      text: "Ultrasound is sound above 20 kHz. It cleans hard-to-reach parts like spiral tubes and electronic parts in a bath of liquid. It finds cracks and flaws inside metal blocks by their echoes. Doctors use ultrasound scans to see organs and a baby in the womb. Bats and dolphins find their way and their food with ultrasound echoes.",
      formula: "depth = (v × t) ÷ 2",
    },
    {
      title: "Infrasound and hearing ranges",
      text: "Sound below 20 Hz is infrasound. Elephants and whales call to each other with it, and earthquakes give off infrasound before the main shock, which some animals may sense. Humans hear 20 Hz to 20 kHz, and the upper limit drops as we grow older. Dogs hear up to about 45 kHz, so a dog whistle is silent to us.",
    },
  ],
  challenge: {
    title: "Tune three halls",
    text: "A classroom, a temple mandapam and a cinema each need their own reverberation time. Use carpet, curtains and acoustic panels (within the panel budget) to hit the target, then press Check. One star per hall.",
  },
  quiz: [
    {
      q: "Why can't astronauts on a spacewalk hear each other talk directly?",
      options: ["Space is too cold for sound", "There is no air to carry the sound", "Their helmets block light", "Sound is too slow in space"],
      answer: 1,
      why: "Sound needs a medium. Space is nearly a vacuum, so there are no particles to pass the vibration on. Astronauts use radio waves, which can cross a vacuum.",
    },
    {
      q: "In the bell jar, the ringing fades as the air is pumped out. What about the bell itself?",
      options: ["It stops vibrating", "It keeps vibrating", "It vibrates faster", "It melts"],
      answer: 1,
      why: "The bell is still switched on and still vibrates. The sound fades because there is less and less air to carry the vibration to the glass and out.",
    },
    {
      q: "A hall has volume 1610 m³ and total absorption 230 m². What is its reverberation time?",
      options: ["0.7 s", "1.13 s", "7 s", "37 s"],
      answer: 1,
      why: "T = (0.161 × V) ÷ A = (0.161 × 1610) ÷ 230 = 259.2 ÷ 230 ≈ 1.13 s.",
    },
    {
      q: "Which change would make the reverberation in a school hall LONGER?",
      options: ["Hanging heavy curtains", "Filling the seats with people", "Removing the carpet", "Adding acoustic panels"],
      answer: 2,
      why: "A bare floor reflects more sound than carpet, so the total absorption A falls and T = (0.161 × V) ÷ A rises.",
    },
    {
      q: "An ultrasound pulse in a steel block (v = 6000 m/s) returns after 20 µs, while the block is 12 cm thick. What does this mean?",
      options: ["There is a crack 6 cm down", "There is a crack 12 cm down", "The block is fine", "There is a crack 24 cm down"],
      answer: 0,
      why: "depth = (v × t) ÷ 2 = (6000 × 0.000020) ÷ 2 = 0.06 m = 6 cm. That is less than the 12 cm thickness, so the pulse hit a flaw inside.",
    },
  ],
};

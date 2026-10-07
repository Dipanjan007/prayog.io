/**
 * Class 10 · Science · "The Human Eye and the Colourful World" (second lab).
 * Covers NCERT §10.4 (the rainbow: dispersion and internal reflection in raindrops),
 * §10.5 (atmospheric refraction: twinkling stars, steady planets, advance sunrise and delayed sunset,
 * the flattened Sun) and §10.6 (scattering of light: Tyndall effect, the blue sky, the red sunrise
 * and sunset, red danger signals, the black sky above the atmosphere).
 * The first lab for this chapter (human-eye.ts) covers the eye, its defects and the glass prism.
 * Recheck wording against the NCERT chapter PDF whenever the book is revised.
 */
import type { LessonDef } from "./types";

export const LESSON_ID = "c10-sky-colours";

/** Challenge rounds; one star each. */
export const SKY_ROUNDS = [
  {
    id: "rainbow",
    title: "Catch the morning rainbow",
    text: "It is 8 am. The Sun is low in the east (on the left) and a shower is falling. Drag the person to where they can see the rainbow.",
  },
  {
    id: "cloud",
    title: "Make a cloud",
    text: "Tiny particles made the sky blue. Clouds are white. Change the particle size until the side glow is white, like a cloud.",
  },
  {
    id: "sunrise",
    title: "Time the early sunrise",
    text: "The clock reads 0 when the Sun would rise if Earth had no air. Move the time to the first moment you can see the top of the Sun, then lock it in.",
  },
] as const;

/** The sunrise answer counts if it is within this many minutes of the true moment. */
export const SUNRISE_TOLERANCE_MIN = 0.3;

export const lesson: LessonDef = {
  id: LESSON_ID,
  completionBadge: "sky-painter",
  classNum: 10,
  book: "Science",
  chapter: "The Human Eye and the Colourful World",
  title: "Why the sky is blue",
  intro: {
    objective:
      "Find out how air scatters and bends sunlight: why the sky is blue, sunsets are red, stars twinkle and rainbows appear opposite the Sun.",
    learn: [
      "Scattering of light and the Tyndall effect",
      "Why the sky is blue and the rising and setting Sun is red",
      "Atmospheric refraction: twinkling stars, steady planets and the early sunrise",
      "How raindrops make a rainbow at about 42° with the Sun behind you",
    ],
    realLife:
      "Sunsets at Marine Drive, sunbeams through a dusty classroom, red traffic and danger lights, twinkling stars from your terrace and rainbows after a monsoon shower.",
    minutes: 25,
  },
  hook: {
    title: "The colours of the sky",
    text:
      "Sit on Marine Drive in Mumbai at noon and the sky is bright blue. Wait till 7 pm and the same Sun turns orange-red. When Rakesh Sharma went to space in 1984, the sky around him was black, even with the Sun shining. The light is the same white sunlight every time. So what is the air doing to it? Let us shine some light and find out.",
  },
  predict: {
    question: "You shine a white torch through water with a few drops of milk in it. Looking at the beam from the side, what colour does it look?",
    options: ["Bluish", "Reddish", "Exactly white"],
    answer: 0,
  },
  tasks: [
    {
      id: "task:tank",
      title: "Blue side, red end",
      text: "In Scatter tank, keep the particles tiny. Make the beam look blue from the side and orange-red at the far end. Hint: a longer tank gives the light a longer path.",
      found:
        "Tiny particles scatter blue light much more than red. So blue light leaks out sideways and the beam looks blue from the side. Over a long path most of the blue is lost, so the light that reaches the far end is orange-red. The scattering of light by tiny particles in a beam is called the Tyndall effect.",
    },
    {
      id: "task:sunset",
      title: "Noon to sunset",
      text: "Switch to Sky. Start with the Sun high (60° or more), then lower it to the horizon until the Sun looks red.",
      found:
        "At noon sunlight crosses only about 8 km of air (squeezed to sea-level density), so only a little blue is scattered away and the Sun looks white. Near the horizon the path is about 40 times longer. Almost all the blue is scattered out on the way, and mostly red and orange light reaches you.",
    },
    {
      id: "task:space",
      title: "Make the sky black",
      text: "Keep the Sun up and remove the atmosphere.",
      found:
        "With no air there is nothing to scatter sunlight, so no light reaches your eye from the empty sky. It looks black even in the day. That is what astronauts see high above the atmosphere, and what Chandrayaan-3 saw from the Moon.",
    },
    {
      id: "task:twinkle",
      title: "Star and planet",
      text: "Switch to Twinkle. Turn the air turbulence up to hot and windy and watch the star and the planet.",
      found:
        "Moving pockets of warm and cool air keep bending starlight by slightly different amounts. A star is so far away it is a point, so its light flickers and wobbles: it twinkles. A planet is close enough to look like a tiny disc. Its many points flicker in different ways and average out, so it shines steadily.",
    },
    {
      id: "task:rainbow",
      title: "Catch a rainbow",
      text: "In Rainbow, look at one raindrop first. Then open Sun, rain and you and drag the Sun and the person until a rainbow appears.",
      found:
        "Each raindrop refracts sunlight, splits it into colours, reflects it off the back and refracts it out again. Red comes out at about 42° and violet at about 40° from the line opposite the Sun. So you only see a rainbow with the Sun behind you, rain in front and the Sun lower than about 42°.",
    },
  ],
  discovery: {
    scientist: "C. V. Raman",
    years: "1888–1970",
    fact: "On a ship to Europe in 1921, Raman wondered why the Mediterranean Sea was such a deep blue. Back in Kolkata his study of how light scatters led to the Raman effect in 1928 and the 1930 Nobel Prize in Physics. India celebrates National Science Day on 28 February, the day he announced it.",
    formula: "Scattering ∝ 1 ÷ λ⁴",
    formulaNote:
      "This is Lord Rayleigh's law (1871), which Raman built on: tiny particles scatter light more strongly the shorter its wavelength, so blue scatters about 5 to 6 times more than red.",
  },
  ideas: [
    {
      title: "Tyndall effect",
      text: "When a beam of light passes through a mix with tiny particles (smoke, dust, milky water, mist), the particles scatter some light sideways and the beam becomes visible. You see this when sunlight comes through a gap into a dusty room or through the trees in a misty forest. The colour of scattered light depends on the size of the particles. Very fine particles scatter mostly blue. Big particles, like cloud droplets, scatter all colours alike, so clouds look white.",
    },
    {
      title: "Blue sky, red sunrise and sunset",
      text: "Air molecules are much smaller than the wavelength of light, so they scatter short wavelengths (blue) much more than long ones (red). Scattered blue light reaches us from all over the sky, so the sky looks blue. (Violet is scattered even more, but sunlight has less of it and our eyes are more sensitive to blue.) Near the horizon sunlight travels through much more air, most blue is scattered away, and the Sun looks reddish. Without air the sky would look dark.",
      formula: "Scattering ∝ 1 ÷ λ⁴",
    },
    {
      title: "Why danger signals are red",
      text: "Red light has the longest wavelength we can see, so it is scattered the least by fog, smoke and dust. A red light travels further through haze and is seen from far away. That is why stop signals, brake lights and danger signs are red.",
    },
    {
      title: "Atmospheric refraction",
      text: "Air gets denser closer to the ground, and hot and cold air have different refractive indices. Light bends as it passes through them. Stars twinkle because they are point sources and moving air keeps changing their light's path. Planets are nearer, look like small discs and do not twinkle. The air bends sunlight over the horizon, so we see the Sun about 2 minutes before it really rises and about 2 minutes after it really sets. The lower edge of the Sun is lifted more than the top, so it looks flattened near the horizon.",
    },
    {
      title: "Rainbow",
      text: "A rainbow is a natural spectrum seen after rain. Each tiny raindrop acts like a small prism: it refracts and disperses sunlight, reflects it once inside and refracts it again as it comes out. The colours come out at about 40° (violet) to 42° (red), so a rainbow always forms on the side opposite the Sun, with red on the outside.",
    },
  ],
  challenge: {
    title: "Sky detective",
    text: "Three rounds: catch a morning rainbow, turn the blue scattering tank into a white cloud, and time the early sunrise. One star per round.",
  },
  quiz: [
    {
      q: "Why does the sky look blue on a clear day?",
      options: [
        "Air molecules scatter blue light more than red",
        "The sky reflects the colour of the sea",
        "Sunlight is mostly blue",
        "Blue light is absorbed by dust",
      ],
      answer: 0,
      why: "Air molecules are tiny compared with the wavelength of light. Scattering ∝ 1/λ⁴, so short blue wavelengths are scattered far more than red.",
    },
    {
      q: "Why does the Sun look reddish at sunrise and sunset?",
      options: [
        "The Sun is cooler in the morning and evening",
        "Its light travels through much more air, so most blue is scattered away",
        "Red light travels faster than blue light",
        "Clouds near the horizon are red",
      ],
      answer: 1,
      why: "Near the horizon sunlight crosses a much longer path through the air. Blue is scattered out on the way and mostly longer wavelengths reach us.",
    },
    {
      q: "Stars twinkle but planets do not. This is because…",
      options: [
        "Planets give out their own steady light",
        "Stars are point sources, while planets look like tiny discs whose flickers average out",
        "Starlight is not refracted by air",
        "Planets are hotter than stars",
      ],
      answer: 1,
      why: "Moving air bends light by changing amounts. A point source flickers, but a disc is many points whose changes cancel out on average.",
    },
    {
      q: "To see a rainbow in the sky you should stand with…",
      options: ["The Sun in front of you", "The Sun behind you", "The Sun directly overhead", "Your back to the rain"],
      answer: 1,
      why: "Raindrops send the colours back at about 40° to 42° from the line opposite the Sun. So the Sun must be behind you and the rain in front.",
    },
    {
      q: "Why are danger signal lights red?",
      options: [
        "Red is the brightest colour",
        "Red light is scattered the least by fog and smoke, so it is seen from far away",
        "Red light bends the most",
        "Our eyes cannot see other colours at night",
      ],
      answer: 1,
      why: "Red has the longest wavelength of visible light, so it is scattered least and travels furthest through haze.",
    },
  ],
};

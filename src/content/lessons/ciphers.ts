/**
 * Class 8 level · Outliers (Maths) · "Secret codes".
 * Goes past the NCERT book into cryptography: the Caesar shift on a cipher wheel,
 * clock (modular) arithmetic, cracking a shift by counting letters (Al-Kindi's
 * frequency analysis), and a simple, honest taste of why public-key codes use big primes.
 */
import type { SecretRound } from "@/lib/sim/ciphers";
import type { LessonDef } from "./types";

export const LESSON_ID = "xm-ciphers";

/** Crack mode's practice message and its shift. */
export const PRACTICE: SecretRound = {
  name: "Practice",
  brief: "A practice message",
  plain: "EVERY SECRET MESSAGE HAS A WEAK SPOT WHEN THE SAME LETTERS KEEP COMING BACK AGAIN AND AGAIN",
  k: 5,
};

/** Challenge: decode three secret messages. One star each. */
export const SECRETS: SecretRound[] = [
  {
    name: "Caesar's own key",
    brief: "Julius Caesar shifted every letter by 3. Turn the dial back to decode this note from a friend.",
    plain: "MEET ME AT THE CHAI STALL",
    k: 3,
  },
  {
    name: "The cricket fan",
    brief: "Nobody told you the shift this time. The most common secret letter probably stands for E.",
    plain: "SEE THE MATCH AT THREE",
    k: 7,
  },
  {
    name: "The treasure map",
    brief: "A long message with an unknown shift. Find the tallest bar, count how far it is from E, and decode.",
    plain: "THE TREASURE IS UNDER THE OLD NEEM TREE NEAR THE TEMPLE GATE",
    k: 10,
  },
];

export const lesson: LessonDef = {
  id: LESSON_ID,
  subject: "maths",
  completionBadge: "code-cracker",
  classNum: 8,
  book: "Outliers",
  chapter: "Secret codes",
  title: "Crack the code",
  intro: {
    objective:
      "Spin a cipher wheel to write secret messages, do sums on a clock, crack a code by counting letters, and see why big prime numbers keep messages on the internet safe.",
    learn: [
      "The Caesar shift: move every letter k places along the alphabet",
      "Clock arithmetic: (9 + 5) mod 12 = 2, and why the alphabet works like a 26-hour clock",
      "How to crack a shift code by counting which letter appears most",
      "Multiplying two primes is quick, but splitting the answer back is slow",
    ],
    realLife:
      "The padlock in your browser, bank logins and online payments all depend on codes. The simple shift code is still in puzzles and escape rooms, and clock arithmetic is how a computer works out the day of the week.",
    minutes: 20,
  },
  hook: {
    title: "The note in class",
    text:
      "Riya passes a note to her friend. It says PHHW DIWHU VFKRRO. If the teacher picks it up, it looks like nonsense. But her friend knows the secret: move every letter back 3 places, and it says MEET AFTER SCHOOL. Julius Caesar sent army messages this way over 2,000 years ago. How do you make a code like this, and how would a spy break it without the key? Let's find out.",
  },
  predict: {
    question: "Caesar's code moves every letter 3 places along the alphabet: A becomes D, B becomes E. What does Y become?",
    options: ["Nothing: Y falls off the end of the alphabet", "B: it goes round to the start again", "V: it moves back instead"],
    answer: 1,
  },
  tasks: [
    {
      id: "task:wheel",
      title: "Caesar's wheel",
      text: "In Wheel, set the shift to 3 and type a message with an X, Y or Z in it, like ZEBRA.",
      found:
        "Every letter moved 3 places: A became D and B became E. When a letter ran past Z it went round to the start, so X became A, Y became B and Z became C. ZEBRA became CHEUD.",
    },
    {
      id: "task:clock",
      title: "Clock arithmetic",
      text: "In Clock, keep the start the same and find two different numbers to add that land on the same place.",
      found:
        "Going once round the clock changes nothing, so from 9 o'clock adding 5 hours or 17 hours both land on 2, because 17 = 12 + 5. We write (9 + 17) mod 12 = 2. The cipher wheel is just a clock with 26 letters.",
    },
    {
      id: "task:crack",
      title: "Crack it by counting",
      text: "In Crack, the bars count each letter of a secret message. Turn the dial until the message is English again. Hint: the tallest bar is probably E.",
      found:
        "The tallest bar was the code for E, the most common letter in English. Counting how far it sits from E gave the shift, 5, and the message came back. This trick is called frequency analysis.",
    },
    {
      id: "task:primes",
      title: "Easy one way, slow the other",
      text: "In Primes, pick two primes p and q so that n = p × q is more than 10,000. Then split n the slow way.",
      found:
        "Multiplying took one step. Going back meant dividing n by 2, 3, 4, 5 and so on until one worked, which took many tries. For numbers hundreds of digits long, nobody knows a fast way to do this, and that keeps public-key codes safe.",
    },
  ],
  discovery: {
    scientist: "Al-Kindi",
    years: "about 801–873",
    fact: "Al-Kindi was a scholar in Baghdad. His book on secret messages has the oldest known description of breaking codes by counting letters. He counted how often each letter appears in ordinary writing, then matched the most common letters of a secret message to them. This frequency analysis breaks any code that always swaps a letter for the same other letter.",
    formula: "k = (top letter − E) mod 26",
    formulaNote: "Find the most common letter in a shift code. How far it is from E is probably the shift.",
  },
  symbols: [
    { sym: "k", meaning: "the key: how many places each letter moves" },
    { sym: "A = 0, ..., Z = 25", meaning: "each letter as a number, so we can do sums with letters" },
    { sym: "mod", meaning: "the remainder after dividing; 26 mod 12 = 2, because 26 = (2 × 12) + 2" },
    { sym: "E", meaning: "the letter E, number 4, the most common letter in English" },
    { sym: "p, q", meaning: "two prime numbers: numbers with no factors except 1 and themselves" },
    { sym: "n", meaning: "the product p × q" },
    { sym: "+, −, ×", meaning: "add, take away, multiply" },
  ],
  ideas: [
    {
      title: "The Caesar shift",
      text: "Number the letters A = 0, B = 1, up to Z = 25. To make the code, add the key k to each letter. To read it, take k away. There are only 25 useful keys, so a patient spy could even try them all.",
      formula: "secret = (plain + k) mod 26,   plain = (secret − k) mod 26",
    },
    {
      title: "Clock arithmetic",
      text: "On a clock, 9 + 5 is 2, not 14, because the hand goes past 12 and starts again. a mod n is the remainder when a is divided by n. Going round a full 12 (or 26 on the cipher wheel) brings you back to where you were.",
      formula: "(9 + 5) mod 12 = 2,   (9 + 17) mod 12 = 2",
    },
    {
      title: "Cracking by counting",
      text: "In English, E is the most common letter, then T and A. A shift code moves every E to the same secret letter, so the tallest bar in a long secret message is probably E in disguise. Short messages can fool you, so check that the result makes sense.",
      formula: "k = (top letter − E) mod 26",
    },
    {
      title: "Locks made of big primes",
      text: "Anyone can multiply two primes in a flash. Going back from n to p and q is slow: you try divisor after divisor. The RSA code (1977) uses this. Everyone can see n and use it to lock a message, but unlocking needs p and q. With primes hundreds of digits long, nobody knows a fast way to find them. Real RSA uses more clock arithmetic than this lab shows.",
      formula: "n = p × q   (quick)   but   n → p, q   (very slow)",
    },
  ],
  challenge: {
    title: "Three secret messages",
    text: "Decode three intercepted messages. Turn the dial to the right shift and send your answer. One star per message.",
  },
  quiz: [
    {
      q: "Use Caesar's shift of 3 to write CAT in code.",
      options: ["FDW", "DBU", "ZXQ", "FCW"],
      answer: 0,
      why: "Move each letter 3 places on: C → F, A → D, T → W. So CAT becomes FDW.",
    },
    {
      q: "On a 12-hour clock it is 10 o'clock. What time will it be 27 hours later?",
      options: ["3 o'clock", "37 o'clock", "1 o'clock", "5 o'clock"],
      answer: 2,
      why: "(10 + 27) mod 12 = 37 mod 12 = 1, because 37 = (3 × 12) + 1. So it is 1 o'clock.",
    },
    {
      q: "In a long secret message made with a shift code, the most common letter is H. What is the shift most likely to be?",
      options: ["7", "3", "8", "4"],
      answer: 1,
      why: "H is letter 7 and E is letter 4. k = (7 − 4) mod 26 = 3.",
    },
    {
      q: "The secret word KHOOR was made with a shift of 3. What does it say?",
      options: ["NKRRU", "JGNNQ", "HELLO", "HOLLA"],
      answer: 2,
      why: "Move each letter 3 places back: K → H, H → E, O → L, O → L, R → O. It says HELLO.",
    },
    {
      q: "Why do public-key codes like RSA use two very big prime numbers?",
      options: [
        "Big primes are secret numbers that nobody can find",
        "Computers cannot multiply big numbers",
        "Every letter is shifted by a prime number of places",
        "Multiplying them is quick, but splitting the answer back into them would take far too long",
      ],
      answer: 3,
      why: "n = p × q takes a moment. Finding p and q from a huge n means trying divisor after divisor, and nobody knows a fast way. That one-way difficulty is what keeps the lock safe.",
    },
  ],
};

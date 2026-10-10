export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

/** Everything a lesson needs apart from its simulation. */
export interface LessonDef {
  id: string;
  classNum: number;
  book: string;
  chapter: string;
  title: string;
  /** Shown before the lesson: what the lab is for and what students take away. */
  intro: {
    objective: string;
    learn: string[];
    /** Where students meet this outside the classroom. */
    realLife: string;
    /** Rough time to finish every step. */
    minutes: number;
  };
  /** Badge awarded when every step is done. */
  completionBadge: string;
  hook: { title: string; text: string };
  predict: { question: string; options: string[]; answer: number };
  tasks: { id: string; title: string; text: string; found: string }[];
  /** What each symbol in the lesson's formulas means, in plain words for students. */
  symbols: { sym: string; meaning: string }[];
  ideas: { title: string; text: string; formula?: string }[];
  /** The person behind the big idea: a fact students remember, and the formula they gave us. */
  discovery: {
    scientist: string;
    /** Lifespan or date, e.g. "1643–1727". */
    years: string;
    fact: string;
    formula: string;
    /** One line saying what the formula means. */
    formulaNote: string;
  };
  challenge: { title: string; text: string };
  quiz: QuizQuestion[];
}

export const XP = {
  hook: 10,
  predict: 10,
  predictCorrect: 10,
  task: 20,
  ideas: 10,
  challenge: 30,
  perStar: 10,
  perQuizPoint: 10,
};

export function stepOrder(lesson: LessonDef) {
  return ["hook", "predict", ...lesson.tasks.map((t) => t.id), "ideas", "challenge", "quiz"];
}

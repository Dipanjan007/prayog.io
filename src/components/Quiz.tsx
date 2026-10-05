"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/content/lessons/types";

export default function Quiz({ questions, onFinish }: { questions: QuizQuestion[]; onFinish: (score: number) => void }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="animate-pop text-center">
        <div className="font-display text-4xl">
          {score}/{questions.length}
        </div>
        <p className="mt-1 text-muted">
          {score === questions.length ? "Perfect score!" : "Nice work. Try again to beat your best."}
        </p>
        <button
          className="btn-ghost mt-4"
          onClick={() => {
            setIndex(0);
            setPicked(null);
            setScore(0);
            setDone(false);
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  const q = questions[index];
  const answered = picked !== null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-faint">
        <span>
          Question {index + 1} of {questions.length}
        </span>
        <span className="tabular-nums">Score {score}</span>
      </div>
      <p className="font-medium">{q.q}</p>
      <div className="mt-3 grid gap-2">
        {q.options.map((opt, i) => {
          const isRight = i === q.answer;
          const style = !answered
            ? "border-line hover:border-line-strong hover:bg-cream/[0.03]"
            : isRight
              ? "border-sage-300 bg-sage-300/15"
              : i === picked
                ? "border-brick-400 bg-brick-400/10"
                : "border-line opacity-50";
          return (
            <button
              key={opt}
              disabled={answered}
              onClick={() => {
                setPicked(i);
                if (isRight) setScore((s) => s + 1);
              }}
              className={`rounded-xl border px-4 py-3 text-left text-[0.95rem] transition-colors ${style}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="animate-pop mt-3 flex items-center justify-between gap-3">
          <p className="text-sm leading-relaxed text-muted">
            <span className={`font-semibold ${picked === q.answer ? "text-sage-300" : "text-ochre-300"}`}>
              {picked === q.answer ? "Right. " : "Not quite. "}
            </span>
            {q.why}
          </p>
          <button
            className="btn-primary shrink-0 !px-5 text-sm"
            onClick={() => {
              if (index + 1 < questions.length) {
                setIndex(index + 1);
                setPicked(null);
              } else {
                setDone(true);
                onFinish(score);
              }
            }}
          >
            {index + 1 < questions.length ? "Next" : "Finish"}
          </button>
        </div>
      )}
    </div>
  );
}

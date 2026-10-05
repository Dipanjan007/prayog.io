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
        <p className="mt-1 text-white/60">
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
      <div className="mb-3 flex items-center justify-between text-xs text-white/50">
        <span>
          Question {index + 1} of {questions.length}
        </span>
        <span>Score {score}</span>
      </div>
      <p className="font-medium">{q.q}</p>
      <div className="mt-3 grid gap-2">
        {q.options.map((opt, i) => {
          const isRight = i === q.answer;
          const style = !answered
            ? "border-white/10 hover:border-white/40"
            : isRight
              ? "border-lime-300 bg-lime-300/15"
              : i === picked
                ? "border-rose-400 bg-rose-400/10"
                : "border-white/5 opacity-50";
          return (
            <button
              key={opt}
              disabled={answered}
              onClick={() => {
                setPicked(i);
                if (isRight) setScore((s) => s + 1);
              }}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${style}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="animate-pop mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-white/70">
            {picked === q.answer ? "✅ " : "💡 "}
            {q.why}
          </p>
          <button
            className="btn-primary shrink-0 !px-4 !py-2 text-sm"
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

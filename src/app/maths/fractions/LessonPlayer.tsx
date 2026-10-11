"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import FractionLab, { type FracReading } from "@/components/sim/FractionLab";
import { ORDERS, lesson } from "@/content/lessons/fractions";
import { equal, frac, fmtFrac } from "@/lib/sim/fractions";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  // For task:smaller: which first fraction was kept, and what its second fractions showed.
  const [shrink, setShrink] = useState<{ first: string; less: boolean; same: boolean }>({ first: "", less: false, same: false });
  const [round, setRound] = useState<number | null>(null);
  const [served, setServed] = useState(0);

  const lastReading = useRef<FracReading | null>(null);
  const onReading = useCallback(
    (r: FracReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (r.mode === "order" && r.ok) {
          const done = round + 1;
          setServed((s) => Math.max(s, done));
          if (isDone("ideas")) {
            challengeStars(done);
            if (done === ORDERS.length) badge("mithai-master");
          }
          // Leave the success on screen for a moment before the next order.
          setTimeout(() => setRound(done < ORDERS.length ? done : null), 1400);
        }
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "bar") {
        if (!isDone("task:area") && r.first.n === 2 && r.first.d === 3 && r.second.n === 3 && r.second.d === 4) finishTask("task:area");
        const key = `${r.first.n}/${r.first.d}`;
        const proper = r.second.n < r.second.d;
        setShrink((s) => {
          const base = s.first === key ? s : { first: key, less: false, same: false };
          const next = { first: key, less: base.less || (proper && r.vsFirst < 0), same: base.same || (!proper && r.vsFirst === 0) };
          if (next.first === s.first && next.less === s.less && next.same === s.same) return s;
          if (next.less && next.same) queueMicrotask(() => !isDone("task:smaller") && finishTask("task:smaller"));
          return next;
        });
      } else if (r.mode === "share") {
        if (!isDone("task:share") && r.N === 24 && equal(r.f, frac(3, 4))) finishTask("task:share");
      } else if (r.mode === "fit") {
        if (!isDone("task:fit") && equal(r.whole, frac(3)) && equal(r.piece, frac(1, 4))) finishTask("task:fit");
      }
    },
    [round, isDone, finishTask, challengeStars, badge],
  );

  // The sim only reports changes, so replay what it shows now once the prediction is locked in
  // and again once the ideas are done, so a state set earlier still counts.
  const replay = useRef(onReading);
  useEffect(() => {
    replay.current = onReading;
  }, [onReading]);
  const predicted = api.done.has("predict");
  const ideasDone = api.done.has("ideas");
  useEffect(() => {
    if (predicted && lastReading.current) replay.current(lastReading.current);
  }, [predicted, ideasDone]);

  const order = round !== null ? ORDERS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<FractionLab key={round ?? "free"} onReading={onReading} order={order} />}
      simNote="The bar is cut into equal strips both ways, so every small piece is the same size. In Fit, the strip is the drink laid out in a line, measured in litres."
      taskExtras={{
        "task:smaller": (
          <div className="mt-2 text-xs text-white/50">
            {shrink.first ? `First cut ${shrink.first}: ` : ""}
            {shrink.less ? "✓" : "○"} second cut less than 1 · {shrink.same ? "✓" : "○"} second cut a whole
          </div>
        ),
      }}
      challengeBody={
        <div className="text-sm text-white/60">
          {order ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Order {round! + 1} of {ORDERS.length}: {order.name}
              </div>
              <div className="mt-1 text-xs">{order.brief}</div>
              {order.kind === "bar" && <div className="mt-1 text-xs text-violet-200">Target: {fmtFrac(order.target)} of the bar</div>}
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => setRound(0)}>
              {served ? "Serve the orders again" : "Open the mithai shop"}
            </button>
          )}
          {served > 0 && (
            <div className="mt-1 text-xs">
              Orders served: {served} of {ORDERS.length}
            </div>
          )}
        </div>
      }
    />
  );
}

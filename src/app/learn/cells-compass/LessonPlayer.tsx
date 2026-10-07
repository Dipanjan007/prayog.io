"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import CellBench, { type CellReading } from "@/components/sim/CellBench";
import { GADGET_ORDERS, lesson } from "@/content/lessons/cells-compass";
import { LED, fewestCells } from "@/lib/sim/cells";
import { useLesson } from "@/lib/useLesson";

/** A needle must swing at least this far (degrees) to count. */
const SWING = 15;

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [seen, setSeen] = useState({ normal: false, reversed: false });
  const [round, setRound] = useState<number | null>(null);
  const [powered, setPowered] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const lastReading = useRef<CellReading | null>(null);
  const onReading = useCallback(
    (r: CellReading) => {
      lastReading.current = r;
      if (round !== null) {
        if (!r.works) {
          setFeedback((f) => (f?.startsWith("It works") ? null : f));
          return;
        }
        const g = GADGET_ORDERS[round];
        const best = fewestCells(g.id);
        if (best !== null && r.cells > best) {
          setFeedback(`It works with ${r.cells} fruits. Can you do it with fewer? Try a different fruit or metals.`);
          return;
        }
        const done = round + 1;
        setPowered((p) => Math.max(p, done));
        if (isDone("ideas")) {
          challengeStars(done);
          if (done === GADGET_ORDERS.length) badge("fruit-power");
        }
        setFeedback(`${g.name[0].toUpperCase()}${g.name.slice(1)} runs on just ${r.cells} fruit${r.cells > 1 ? "s" : ""}!`);
        setRound(done < GADGET_ORDERS.length ? done : null);
        return;
      }
      if (!isDone("predict")) return;
      if (r.mode === "compass") {
        if (r.on && Math.abs(r.maxDefl) >= SWING) {
          setSeen((s) => {
            const next = { normal: s.normal || r.polarity > 0, reversed: s.reversed || r.polarity < 0 };
            if (next.normal === s.normal && next.reversed === s.reversed) return s;
            if (next.normal && next.reversed) queueMicrotask(() => !isDone("task:swing") && finishTask("task:swing"));
            return next;
          });
        }
        if (!isDone("task:north") && r.setup === "coil" && r.on && r.northLabel !== null && r.northLabel === r.coilNorth) finishTask("task:north");
      } else {
        if (!isDone("task:zero") && r.pair === "cu-cu" && Math.abs(r.volts) < 0.005) finishTask("task:zero");
        if (!isDone("task:led") && r.fruit === "lemon" && r.load === "led" && !r.ledFlipped && r.works) finishTask("task:led");
        if (!isDone("task:flip") && isDone("task:led") && r.load === "led" && r.ledFlipped && r.emf >= LED.vf && !r.works) finishTask("task:flip");
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

  const start = (n: number | null) => {
    setRound(n);
    setFeedback(null);
  };

  const g = round !== null ? GADGET_ORDERS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<CellBench key={round ?? "free"} onReading={onReading} gadget={g ? g.id : null} />}
      simNote="Compass fields are worked out from the real rules for a wire and a short coil, with Earth's field taken as 35 µT. In the wire set-up the current is about 1.5 A, as with a torch cell and a short wire. Fruit-cell voltages and currents are typical school values; real fruits vary with ripeness, the size of the strips and how deep they go. The needles swing a little more freely than real ones so you can see them settle."
      taskExtras={{
        "task:swing": (
          <div className="mt-2 text-xs text-white/50">
            {seen.normal ? "✓" : "○"} Needle swings · {seen.reversed ? "✓" : "○"} Swings again with the cell reversed
          </div>
        ),
      }}
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {g ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Gadget {round! + 1} of {GADGET_ORDERS.length}: power {g.name} ({g.need})
              </div>
              <div className="mt-1 text-xs">Use the fewest fruits you can. Watch the voltmeter as you change things.</div>
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => start(0)}>
              {powered ? "Power the gadgets again" : "Open the fruit power station"}
            </button>
          )}
          {feedback && <div className={`mt-2 text-xs ${feedback.startsWith("It works") ? "text-amber-200" : "text-lime-300"}`}>{feedback}</div>}
          {powered > 0 && (
            <div className="mt-1 text-xs">
              Gadgets powered: {powered} of {GADGET_ORDERS.length}
            </div>
          )}
        </div>
      }
    />
  );
}

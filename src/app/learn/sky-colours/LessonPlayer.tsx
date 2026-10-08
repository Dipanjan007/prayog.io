"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import SkyLab, { type SkyReading } from "@/components/sim/SkyLab";
import { SKY_ROUNDS, SUNRISE_TOLERANCE_MIN, lesson } from "@/content/lessons/sky-colours";
import { MUMBAI_LAT, sunriseAdvanceMinutes } from "@/lib/sim/sky-optics";
import { useLesson } from "@/lib/useLesson";

const ADVANCE = sunriseAdvanceMinutes(MUMBAI_LAT);

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [seen, setSeen] = useState({ noon: false, red: false });
  const [round, setRound] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const lastReading = useRef<SkyReading | null>(null);

  const win = useCallback(
    (r: number, message: string) => {
      const done = r + 1;
      setSolved((s) => Math.max(s, done));
      if (isDone("ideas")) {
        challengeStars(done);
        if (done === SKY_ROUNDS.length) badge("rainbow-catcher");
      }
      setFeedback(message);
      setRound(done < SKY_ROUNDS.length ? done : null);
    },
    [isDone, challengeStars, badge],
  );

  const onReading = useCallback(
    (r: SkyReading) => {
      lastReading.current = r;
      if (round !== null) {
        const id = SKY_ROUNDS[round].id;
        if (id === "rainbow" && r.mode === "rainbow" && r.rainbow.visible)
          win(round, "Rainbow caught! With the Sun in the east, the bow is in the west, so you stand with your back to the Sun.");
        if (id === "cloud" && r.mode === "tank" && r.tank.sideHue === "white")
          win(round, `White! Particles of about ${r.tank.size >= 1000 ? `${(r.tank.size / 1000).toFixed(1)} µm` : `${r.tank.size} nm`} are bigger than a light wave, so they scatter all colours alike, like cloud droplets.`);
        return;
      }
      if (!isDone("predict")) return;
      if (!isDone("task:tank") && r.mode === "tank" && r.tank.sideHue === "blue" && r.tank.endHue === "red") finishTask("task:tank");
      if (r.mode === "sky" && r.sky.air) {
        setSeen((s) => {
          const next = { noon: s.noon || r.sky.alt >= 60, red: s.red || r.sky.sunHue === "red" };
          if (next.noon === s.noon && next.red === s.red) return s;
          if (next.noon && next.red) queueMicrotask(() => !isDone("task:sunset") && finishTask("task:sunset"));
          return next;
        });
      }
      if (!isDone("task:space") && r.mode === "sky" && !r.sky.air && r.sky.alt >= 5) finishTask("task:space");
      if (!isDone("task:twinkle") && r.mode === "twinkle" && r.twinkle.view === "stars" && r.twinkle.turbulence >= 0.5) finishTask("task:twinkle");
      if (!isDone("task:rainbow") && r.mode === "rainbow" && r.rainbow.view === "sky" && r.rainbow.visible) finishTask("task:rainbow");
    },
    [round, isDone, finishTask, win],
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

  const startRound = (n: number) => {
    setRound(n);
    setFeedback(null);
  };

  const lockSunrise = () => {
    const r = lastReading.current;
    if (round === null || !r || r.mode !== "twinkle") return;
    const t = r.twinkle.t;
    if (Math.abs(t + ADVANCE) <= SUNRISE_TOLERANCE_MIN)
      win(round, `Spot on! In Mumbai you see the top of the Sun about ${ADVANCE.toFixed(1)} minutes before it really rises, because the air bends its light over the horizon.`);
    else if (t > -ADVANCE)
      setFeedback("Too late. The Sun was already peeking out before this. Move the time earlier and watch the horizon.");
    else setFeedback("Too early. At that moment no part of the Sun could be seen yet. Move the time a little later.");
  };

  const current = round !== null ? SKY_ROUNDS[round] : null;

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<SkyLab key={round ?? "free"} onReading={onReading} round={current?.id ?? null} />}
      simNote="Colours come from real scattering numbers (Rayleigh's 1/λ⁴ law and the measured thickness of the air), shown with just three colours: red, green and blue. The particle-size effect uses a smooth curve between the tiny and big particle limits; real particles add small wiggles. Twinkling is sped up and the air pockets are drawn huge. The sunrise view is to scale, at an equinox in Mumbai. In the rainbow scene the Sun is drawn close, but its rays arrive parallel as if from far away."
      taskExtras={{
        "task:sunset": (
          <div className="mt-2 text-xs text-white/50">
            {seen.noon ? "✓" : "○"} Noon Sun (60° or more) · {seen.red ? "✓" : "○"} Red Sun at the horizon
          </div>
        ),
      }}
      challengeBody={
        <div className="min-w-0 flex-1 text-sm text-white/60">
          {current ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-white">
                Round {round! + 1} of {SKY_ROUNDS.length}: {current.title}
              </div>
              <div className="mt-1 text-xs">{current.text}</div>
              {current.id === "sunrise" && (
                <button className="btn-primary mt-2 !px-3 !py-1.5 text-sm" onClick={lockSunrise}>
                  Lock in this time
                </button>
              )}
            </div>
          ) : (
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => startRound(0)}>
              {solved ? "Play the rounds again" : "Start the rounds"}
            </button>
          )}
          {feedback && <div className={`mt-2 text-xs ${feedback.startsWith("Too") ? "text-amber-200" : "text-lime-300"}`}>{feedback}</div>}
          {solved > 0 && (
            <div className="mt-1 text-xs">
              Rounds solved: {solved} of {SKY_ROUNDS.length}
            </div>
          )}
        </div>
      }
    />
  );
}

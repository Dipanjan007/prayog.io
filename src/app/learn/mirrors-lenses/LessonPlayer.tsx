"use client";

import { useCallback, useState } from "react";
import LessonShell from "@/components/lesson/LessonShell";
import OpticsBench, { type OpticsReading } from "@/components/sim/OpticsBench";
import { IMAGE_TARGETS, lesson } from "@/content/lessons/mirrors-lenses";
import { useLesson } from "@/lib/useLesson";

export default function LessonPlayer() {
  const api = useLesson(lesson);
  const { isDone, finishTask, badge, challengeStars } = api;
  const [matched, setMatched] = useState<string[]>([]);

  const onReading = useCallback(
    (r: OpticsReading) => {
      const M = r.mirror;
      if (r.mode === "mirror" && isDone("ideas") && IMAGE_TARGETS.includes(M.image.nature)) {
        setMatched((prev) => {
          if (prev.includes(M.image.nature)) return prev;
          const next = [...prev, M.image.nature];
          // Stars and badges are side effects of the new match, so run them after this update.
          queueMicrotask(() => {
            challengeStars(next.length);
            if (next.length === IMAGE_TARGETS.length) badge("image-matcher");
          });
          return next;
        });
      }
      if (!isDone("predict")) return;
      if (r.mode === "mirror") {
        if (!isDone("task:plane") && M.kind === "plane") finishTask("task:plane");
        if (!isDone("task:big") && M.kind === "concave" && M.u > M.f) finishTask("task:big");
        if (!isDone("task:real") && M.kind === "concave" && M.u < 2 * M.f) finishTask("task:real");
        if (!isDone("task:wide") && M.kind === "convex") finishTask("task:wide");
      }
      if (!isDone("task:magnify") && r.mode === "lens" && r.lens.kind === "convex" && r.lens.u > -r.lens.f) finishTask("task:magnify");
    },
    [isDone, finishTask, challengeStars, badge],
  );

  return (
    <LessonShell
      lesson={lesson}
      api={api}
      sim={<OpticsBench onReading={onReading} modes={["mirror", "lens"]} />}
      simNote="Drag the object or use the sliders. Dashed lines show where light only seems to come from (a virtual image)."
      challengeBody={
        <ul className="space-y-1 text-sm">
          {IMAGE_TARGETS.map((t) => (
            <li key={t} className={matched.includes(t) ? "text-lime-300" : "text-white/60"}>
              {matched.includes(t) ? "★" : "☆"} {t}
            </li>
          ))}
        </ul>
      }
    />
  );
}

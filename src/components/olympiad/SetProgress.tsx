"use client";

import Link from "next/link";
import { OLY_PROBLEMS, OLY_SETS, problemsInSet } from "@/content/olympiad";
import { LEVEL_LABEL } from "@/lib/olympiad/score";
import { olyStore, totals } from "@/lib/olympiad/store";
import { Stars } from "./Stars";

/** Hub cards: one per set, with solved count and stars from this device. */
export function SetCards() {
  const state = olyStore.use();
  const all = totals(
    state,
    OLY_PROBLEMS.map((p) => p.id),
  );
  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted" data-testid="oly-totals">
        <span>
          Solved <b className="text-cream">{all.solved}</b> of {OLY_PROBLEMS.length}
        </span>
        <span>
          <b className="text-ochre-300">★ {all.stars}</b> of {OLY_PROBLEMS.length * 3}
        </span>
        <span>
          <b className="text-saffron-300">{all.xp}</b> XP
        </span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {OLY_SETS.map((s) => {
          const probs = problemsInSet(s.id);
          const t = totals(
            state,
            probs.map((p) => p.id),
          );
          const pct = Math.round((100 * t.solved) / probs.length);
          return (
            <Link key={s.id} href={`/olympiad/${s.id}`} className="glass group rounded-3xl p-4 transition hover:-translate-y-0.5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: s.colour }} />
                <h2 className="font-display text-lg font-semibold">
                  {s.emoji} {s.title}
                </h2>
              </div>
              <p className="mt-1 text-sm text-muted">{s.blurb}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream/10">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.colour }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-faint">
                <span>
                  {t.solved}/{probs.length} solved · <span className="text-ochre-300">★ {t.stars}</span>/{probs.length * 3}
                </span>
                <span className="font-semibold" style={{ color: s.colour }}>
                  {t.solved === probs.length ? "Review →" : t.solved ? "Continue →" : "Start →"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

/** Problem list inside one set. */
export function ProblemList({ setId }: { setId: string }) {
  const state = olyStore.use();
  const probs = problemsInSet(setId);
  return (
    <ol className="mt-4 flex flex-col gap-3">
      {probs.map((p, i) => {
        const r = state.problems[p.id];
        return (
          <li key={p.id}>
            <Link href={`/olympiad/${setId}/${p.id}`} className="glass flex items-center gap-3 rounded-3xl p-4 transition hover:-translate-y-0.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cream/5 text-xl">{p.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wider text-faint">
                  {i + 1}. {LEVEL_LABEL[p.level]}
                </div>
                <div className="font-semibold">{p.title}</div>
              </div>
              <div className="shrink-0 text-right text-xs text-faint">
                {r?.solved ? (
                  <>
                    <Stars n={r.stars} />
                    <div>{r.xp} XP</div>
                  </>
                ) : r?.tries ? (
                  <span>{r.tries} {r.tries === 1 ? "try" : "tries"}</span>
                ) : (
                  <span>New</span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

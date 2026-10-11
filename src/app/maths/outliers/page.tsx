import type { Metadata } from "next";
import { FreeNote } from "@/components/access/FreeNote";
import { LockableLink } from "@/components/access/LockableLink";
import { MATHS_OUTLIER_STRANDS } from "@/content/curriculum";
import { LESSONS } from "@/content/lessons";

export const metadata: Metadata = {
  title: "Maths Outliers",
  description: "Maths beyond the NCERT book: the golden ratio, fractals, chasing π, infinite sums, secret codes and the chessboard legend.",
};

const bySlug = new Map(LESSONS.map((l) => [l.id.replace(/^xm-/, ""), l]));

export default function MathsOutliersPage() {
  return (
    <div className="pt-4">
      <h1 className="font-display text-4xl font-bold">
        <span className="text-gradient">Maths Outliers</span>
      </h1>
      <p className="mt-2 max-w-2xl text-white/60">
        Maths that goes beyond the NCERT book, for the curious ones. Grow a sunflower with the golden angle, build a
        snowflake with an endless edge, chase π and crack a secret code.
      </p>
      <FreeNote />

      <div className="mt-8 flex flex-col gap-8">
        {MATHS_OUTLIER_STRANDS.map((strand) => (
          <section key={strand.id}>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: strand.colour, boxShadow: `0 0 12px ${strand.colour}` }} />
              <h2 className="font-display text-xl font-semibold">{strand.name}</h2>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {strand.chapters.map((ch) => {
                const lesson = ch.href ? bySlug.get(ch.href.split("/").pop()!) : undefined;
                return (
                  <LockableLink
                    key={ch.title}
                    href={ch.href ?? "/maths/outliers"}
                    title={lesson?.title ?? ch.title}
                    className="group flex flex-col rounded-2xl border p-4 transition hover:-translate-y-0.5"
                    style={{ borderColor: strand.colour, background: "rgba(56,189,248,0.06)" }}
                  >
                    <div className="text-[11px] uppercase tracking-wider text-white/50">Class {ch.classNum} level</div>
                    <div className="font-display mt-1 font-semibold">{lesson?.title ?? ch.title}</div>
                    <div className="mt-1 text-xs text-white/60">{ch.title}</div>
                    <div className="mt-2 text-sm text-white/70">🎮 {ch.sim}</div>
                    {lesson && (
                      <div className="mt-3 text-xs text-white/50">
                        Meet {lesson.discovery.scientist} · <span className="font-mono text-cyan-200">{lesson.discovery.formula}</span>
                      </div>
                    )}
                    <div className="mt-auto pt-3 text-xs font-semibold" style={{ color: strand.colour }}>
                      Play now →
                    </div>
                  </LockableLink>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

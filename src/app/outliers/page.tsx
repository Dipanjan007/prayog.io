import type { Metadata } from "next";
import Link from "next/link";
import { OUTLIER_STRANDS } from "@/content/curriculum";
import { LESSONS } from "@/content/lessons";

export const metadata: Metadata = {
  title: "Outliers",
  description: "Labs beyond the NCERT book: gravity, black holes, spinning Earth and Einstein's relativity.",
};

const bySlug = new Map(LESSONS.map((l) => [l.id.replace(/^x-/, ""), l]));

export default function OutliersPage() {
  return (
    <div className="pt-4">
      <h1 className="font-display text-4xl font-bold">
        <span className="text-gradient">Outliers</span>
      </h1>
      <p className="mt-2 max-w-2xl text-white/60">
        Labs that go beyond the NCERT book, for the curious ones. Squeeze Earth into a black hole, ride a light clock at
        nearly the speed of light, and turn a grain of rice into energy.
      </p>

      <div className="mt-8 flex flex-col gap-8">
        {OUTLIER_STRANDS.map((strand) => (
          <section key={strand.id}>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: strand.colour, boxShadow: `0 0 12px ${strand.colour}` }} />
              <h2 className="font-display text-xl font-semibold">{strand.name}</h2>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {strand.chapters.map((ch) => {
                const lesson = ch.href ? bySlug.get(ch.href.split("/").pop()!) : undefined;
                return (
                  <Link
                    key={ch.title}
                    href={ch.href ?? "/outliers"}
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
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

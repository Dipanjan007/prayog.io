import type { Metadata } from "next";
import Link from "next/link";
import { BOOKS, CLASSES, STRANDS } from "@/content/curriculum";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  const total = STRANDS.reduce((n, s) => n + s.chapters.length, 0);
  const live = STRANDS.reduce((n, s) => n + s.chapters.filter((c) => c.href).length, 0);

  return (
    <div className="pt-4">
      <h1 className="font-display text-4xl font-bold">Your physics map</h1>
      <p className="mt-2 max-w-2xl text-white/60">
        Seven strands that grow from Class 7 to Class 10, following the NCERT books. {live} of {total} chapters are
        playable now{live < total ? "; the rest are on the way" : ""}.
      </p>

      {/* Header row: classes */}
      <div className="mt-8 hidden grid-cols-[10rem_repeat(4,minmax(0,1fr))] gap-3 text-sm text-white/50 md:grid">
        <div />
        {CLASSES.map((c) => (
          <div key={c}>
            Class {c} <span className="text-white/30">· {BOOKS[c]}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {STRANDS.map((strand) => (
          <section key={strand.id} className="glass grid gap-3 rounded-3xl p-4 md:grid-cols-[10rem_repeat(4,minmax(0,1fr))] md:p-3">
            <div className="flex items-center gap-2 md:px-2">
              <span className="h-3 w-3 rounded-full" style={{ background: strand.colour, boxShadow: `0 0 12px ${strand.colour}` }} />
              <h2 className="font-display font-semibold">{strand.name}</h2>
            </div>
            {CLASSES.map((c) => {
              const chapters = strand.chapters.filter((ch) => ch.classNum === c);
              return (
                <div key={c} className={`flex flex-col gap-2 ${chapters.length ? "" : "hidden md:flex"}`}>
                  {chapters.map((ch) =>
                    ch.href ? (
                      <Link
                        key={ch.title}
                        href={ch.href}
                        className="group rounded-2xl border p-3 transition hover:-translate-y-0.5"
                        style={{ borderColor: strand.colour, background: "rgba(56,189,248,0.08)" }}
                      >
                        <div className="text-[11px] uppercase tracking-wider text-white/50 md:hidden">Class {c}</div>
                        <div className="text-sm font-semibold">{ch.title}</div>
                        <div className="mt-1 text-xs text-white/60">🎮 {ch.sim}</div>
                        <div className="mt-2 text-xs font-semibold" style={{ color: strand.colour }}>
                          Play now →
                        </div>
                      </Link>
                    ) : (
                      <div key={ch.title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
                        <div className="text-[11px] uppercase tracking-wider text-white/40 md:hidden">Class {c}</div>
                        <div className="text-sm text-white/70">{ch.title}</div>
                        <div className="mt-1 text-xs text-white/40">{ch.sim} · coming soon</div>
                      </div>
                    ),
                  )}
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}

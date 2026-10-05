import type { Metadata } from "next";
import Link from "next/link";
import { BOOKS, CLASSES, STRANDS } from "@/content/curriculum";
import { StrandIcon } from "@/components/Ink";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  const total = STRANDS.reduce((n, s) => n + s.chapters.length, 0);
  const live = STRANDS.reduce((n, s) => n + s.chapters.filter((c) => c.href).length, 0);

  return (
    <div className="pt-4 sm:pt-8">
      <div className="eyebrow">Classes 7 to 10</div>
      <h1 className="font-display mt-2 text-4xl sm:text-5xl">Your physics map</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">
        Seven strands that grow from Class 7 to Class 10, following the NCERT books. {live} of {total} chapters are
        playable now; the rest are on the way.
      </p>

      {/* Header row: classes */}
      <div className="sticky top-14 z-10 mt-10 hidden grid-cols-[11rem_repeat(4,minmax(0,1fr))] gap-3 border-b border-line bg-base/95 px-4 py-3 text-sm md:grid">
        <div />
        {CLASSES.map((c) => (
          <div key={c}>
            <span className="font-display text-base text-cream">Class {c}</span> <span className="text-faint">· {BOOKS[c]}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4 md:mt-4 md:gap-3">
        {STRANDS.map((strand) => (
          <section key={strand.id} className="glass grid gap-3 rounded-3xl p-4 md:grid-cols-[11rem_repeat(4,minmax(0,1fr))] md:p-3">
            <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-2 md:px-2 md:py-1">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-well" style={{ color: strand.colour }}>
                <StrandIcon id={strand.id} className="h-6 w-6" />
              </span>
              <h2 className="font-display text-xl">{strand.name}</h2>
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
                        className="group relative overflow-hidden rounded-2xl border border-line bg-raised p-3.5 pl-4 transition-colors hover:border-line-strong hover:bg-[#332d27]"
                      >
                        <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full" style={{ background: strand.colour }} aria-hidden />
                        <div className="eyebrow md:hidden">Class {c}</div>
                        <div className="text-[0.95rem] font-semibold leading-snug">{ch.title}</div>
                        <div className="mt-1 text-sm leading-snug text-muted">{ch.sim}</div>
                        <div className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-saffron-300">
                          Play now <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>→</span>
                        </div>
                      </Link>
                    ) : (
                      <div key={ch.title} className="rounded-2xl border border-dashed border-line p-3.5">
                        <div className="eyebrow md:hidden">Class {c}</div>
                        <div className="text-[0.95rem] leading-snug text-muted">{ch.title}</div>
                        <div className="mt-1 text-sm leading-snug text-faint">{ch.sim} · coming soon</div>
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

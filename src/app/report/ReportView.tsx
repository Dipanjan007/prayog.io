"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError, useMe } from "@/lib/account";
import type { ChildReport, LessonRef } from "@/lib/report";

interface Summary {
  xpWeek: number;
  xpTotal: number;
  streak: number;
  finishedCount: number;
  workingCount: number;
}

interface ChildRow {
  id: string;
  nickname: string;
  avatar: string;
  classNum: number;
  report?: ChildReport;
  summary?: Summary;
}

interface Data {
  full: boolean;
  emails: boolean;
  children: ChildRow[];
}

function Lesson({ l, extra }: { l: LessonRef; extra?: string }) {
  return (
    <li>
      <Link href={l.href} className="text-cyan-200 hover:underline">
        {l.title}
      </Link>
      <span className="text-white/45"> · {l.chapter}</span>
      {extra && <span className="text-white/60"> · {extra}</span>}
    </li>
  );
}

function Stat({ n, label }: { n: number | string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] px-3 py-2">
      <div className="font-display text-2xl font-bold">{n}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}

function FullReport({ r }: { r: ChildReport }) {
  const quiet = !r.finished.length && !r.working.length;
  return (
    <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
      <div>
        <h3 className="text-[11px] uppercase tracking-wider text-cyan-200/80">This week</h3>
        {quiet ? (
          <p className="mt-1 text-white/60">No lessons played this week. A good one to start: {r.next ? r.next.title : "any lab on the Learn page"}.</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {r.finished.map((l) => (
              <Lesson key={l.id} l={l} extra="finished ✓" />
            ))}
            {r.working.map((l) => (
              <Lesson key={l.id} l={l} extra={`${l.percent}% done`} />
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className="text-[11px] uppercase tracking-wider text-amber-200/80">Could use a hand</h3>
        {r.stuck.length ? (
          <ul className="mt-1 space-y-1">
            {r.stuck.map((l) => (
              <Lesson key={l.id} l={l} extra={l.why} />
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-white/60">Nothing stuck. 👍</p>
        )}
      </div>
      {r.talk.length > 0 && (
        <div className="sm:col-span-2">
          <h3 className="text-[11px] uppercase tracking-wider text-lime-200/80">Ask them at dinner</h3>
          <ul className="mt-1 space-y-1 text-white/80">
            {r.talk.map((t) => (
              <li key={t.question}>
                “{t.question}” <span className="text-white/45">· they guessed wrong at first in {t.title}, then found out in the lab</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {r.next && (
        <div className="sm:col-span-2">
          <h3 className="text-[11px] uppercase tracking-wider text-violet-200/80">Up next</h3>
          <ul className="mt-1">
            <Lesson l={r.next} />
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ReportView() {
  const me = useMe();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const parent = me?.account?.role === "parent";

  useEffect(() => {
    if (!parent) return;
    api<Data>("/api/report")
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't load the report."));
  }, [parent]);

  async function toggleEmails() {
    if (!data) return;
    const emails = !data.emails;
    setData({ ...data, emails });
    try {
      await api("/api/account", "PATCH", { reportEmails: emails });
    } catch {
      setData({ ...data });
    }
  }

  if (!me) return null;
  if (!parent)
    return (
      <section className="glass mx-auto mt-6 max-w-md rounded-3xl p-6 text-center">
        <h1 className="font-display text-2xl font-bold">The weekly report is for parents</h1>
        <p className="mt-2 text-sm text-white/65">Sign in with the parent email you used to sign up to see what your child did this week.</p>
        <Link href="/signin" className="btn-primary mt-5">
          Parent sign-in
        </Link>
      </section>
    );

  return (
    <div className="pt-4">
      <h1 className="font-display text-4xl font-bold">
        This week on <span className="text-gradient">Prayog</span>
      </h1>
      <p className="mt-2 max-w-2xl text-white/60">The week runs Monday to Sunday. Progress shows here once your child&apos;s device has synced.</p>
      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
      {data && !data.children.length && (
        <p className="mt-6 text-white/60">
          No children yet.{" "}
          <Link href="/join" className="text-cyan-300 hover:underline">
            Add one
          </Link>
          .
        </p>
      )}
      <div className="mt-6 flex flex-col gap-4">
        {data?.children.map((c) => {
          const s = c.report ?? c.summary!;
          const finished = c.report ? c.report.finished.length : c.summary!.finishedCount;
          return (
            <section key={c.id} className="glass rounded-3xl p-5" data-testid="child-report">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{c.avatar}</span>
                <div>
                  <h2 className="font-display text-xl font-semibold">{c.nickname}</h2>
                  <div className="text-xs text-white/50">Class {c.classNum}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Stat n={`⚡ ${s.xpWeek}`} label="XP this week" />
                <Stat n={finished} label="lessons finished" />
                <Stat n={`🔥 ${s.streak}`} label="day streak" />
              </div>
              {c.report ? (
                <FullReport r={c.report} />
              ) : (
                <div className="relative mt-4 overflow-hidden rounded-2xl" data-testid="report-locked">
                  <div className="pointer-events-none select-none p-4 text-sm opacity-40 blur-[4px]" aria-hidden>
                    <p>Finished: Spin, orbit and shadow · Earth, Moon, and the Sun</p>
                    <p>Could use a hand: Build a torch that works · 2 of 5 right in the quiz</p>
                    <p>Ask them at dinner: “Why does the Moon change shape through the month?”</p>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#070a14]/40 p-4 text-center">
                    <p className="text-sm text-white/85">See which lessons, where they&apos;re stuck and what to ask them, every week by email.</p>
                    <Link href="/plans" className="btn-primary !py-2 text-sm">
                      Get the full report with Family
                    </Link>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
      {data?.full && (
        <label className="mt-6 flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" checked={data.emails} onChange={toggleEmails} />
          Email me this report every Sunday evening
        </label>
      )}
    </div>
  );
}

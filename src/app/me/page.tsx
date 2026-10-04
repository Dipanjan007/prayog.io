"use client";

import Link from "next/link";
import { BADGES, levelFor, progressStore, useProgress } from "@/lib/progress";
import { profileStore, useProfile } from "@/lib/profile";

export default function MePage() {
  const progress = useProgress();
  const profile = useProfile();
  const { level, start, next, fraction } = levelFor(progress.xp);

  return (
    <div className="grid gap-4 pt-4 md:grid-cols-3">
      <section className="glass rounded-3xl p-6 md:col-span-2">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/30 to-violet-400/30 text-4xl">
            {profile.child?.avatar ?? "🙂"}
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">{profile.child?.nickname ?? "Guest explorer"}</h1>
            <p className="text-white/60">
              {profile.child ? `Class ${profile.child.classNum}` : "Progress is saved on this device"} · Level {level}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex justify-between text-sm text-white/60">
            <span>⚡ {progress.xp} XP</span>
            <span>
              {next - progress.xp} XP to level {level + 1}
            </span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400"
              style={{ width: `${Math.max(fraction * 100, 2)}%` }}
              aria-label={`${progress.xp - start} of ${next - start} XP in this level`}
            />
          </div>
        </div>
        {!profile.child && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-300/30 bg-violet-300/10 p-4">
            <p className="text-sm">Ask a parent to set up your profile to pick a nickname and avatar.</p>
            <Link href="/join" className="btn-primary !py-2 text-sm">
              Set up profile
            </Link>
          </div>
        )}
      </section>

      <section className="glass rounded-3xl p-6">
        <h2 className="font-display text-xl font-semibold">Streak</h2>
        <div className="font-display mt-3 text-5xl">🔥 {progress.streak.count}</div>
        <p className="mt-2 text-sm text-white/60">
          {progress.streak.count === 1 ? "day" : "days"} in a row. You have {progress.streak.freezes} streak freeze
          {progress.streak.freezes === 1 ? "" : "s"}, so one missed day won&apos;t break it.
        </p>
      </section>

      <section className="glass rounded-3xl p-6 md:col-span-2">
        <h2 className="font-display text-xl font-semibold">Badges</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BADGES.map((b) => {
            const has = progress.badges.includes(b.id);
            return (
              <div key={b.id} className={`rounded-2xl border p-4 ${has ? "border-amber-300/40 bg-amber-300/10" : "border-white/5 opacity-50"}`}>
                <div className={`text-3xl ${has ? "" : "grayscale"}`}>{b.emoji}</div>
                <div className="mt-2 font-semibold">{b.name}</div>
                <div className="text-xs text-white/60">{b.how}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <h2 className="font-display text-xl font-semibold">Class leaderboard</h2>
        <p className="mt-2 text-sm text-white/60">
          When your teacher creates a class, you can choose to appear on its weekly leaderboard. It ranks XP earned this
          week, so everyone starts fresh every Monday.
        </p>
        <p className="mt-3 text-sm text-white/40">
          {profile.child?.showOnLeaderboard ? "You've said yes to showing up." : "You're hidden for now."}
        </p>
      </section>

      {(profile.parent || progress.xp > 0) && (
        <section className="md:col-span-3">
          <button
            className="text-sm text-white/40 underline hover:text-rose-300"
            onClick={() => {
              if (window.confirm("Delete the profile and all progress from this device? This can't be undone.")) {
                progressStore.clear();
                profileStore.clear();
              }
            }}
          >
            Delete all data on this device
          </button>
        </section>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { BADGES, levelFor, progressStore, useProgress } from "@/lib/progress";
import { profileStore, useProfile } from "@/lib/profile";
import { api, refreshMe, useMe } from "@/lib/account";
import ClassLeaderboard from "@/components/account/ClassLeaderboard";

export default function MePage() {
  const progress = useProgress();
  const profile = useProfile();
  const me = useMe();
  const synced = Boolean(me?.server && me.child);
  const { level, start, next, fraction } = levelFor(progress.xp);

  return (
    <div className="grid gap-4 pt-4 md:grid-cols-3">
      <section className="glass rounded-3xl p-6 md:col-span-2">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-raised text-4xl">
            {profile.child?.avatar ?? "🙂"}
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">{profile.child?.nickname ?? "Guest explorer"}</h1>
            <p className="text-muted">
              {profile.child ? `Class ${profile.child.classNum}` : "Progress is saved on this device"} · Level {level}
              {synced && " · Saved to your account"}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex justify-between text-sm text-muted">
            <span>⚡ {progress.xp} XP</span>
            <span>
              {next - progress.xp} XP to level {level + 1}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream/10">
            <div
              className="h-full rounded-full bg-saffron-400"
              style={{ width: `${Math.max(fraction * 100, 2)}%` }}
              aria-label={`${progress.xp - start} of ${next - start} XP in this level`}
            />
          </div>
        </div>
        {!profile.child?.id && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-heather-300/30 bg-heather-300/10 p-4">
            <p className="text-sm">
              {me?.server
                ? "Save your progress to an account so it's safe and works on any device."
                : "Ask a parent to set up your profile to pick a nickname and avatar."}
            </p>
            <div className="flex gap-2">
              {me?.server && (
                <Link href="/join/class" className="btn-ghost !py-2 text-sm">
                  Join a class
                </Link>
              )}
              <Link href="/join" className="btn-primary !py-2 text-sm">
                {me?.server ? "Parent sign-up" : "Set up profile"}
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="glass rounded-3xl p-6">
        <h2 className="font-display text-xl font-semibold">Streak</h2>
        <div className="font-display mt-3 text-5xl">🔥 {progress.streak.count}</div>
        <p className="mt-2 text-sm text-muted">
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
              <div key={b.id} className={`rounded-2xl border p-4 ${has ? "border-ochre-300/40 bg-ochre-300/10" : "border-dashed border-line opacity-70"}`}>
                <div className={`text-3xl ${has ? "" : "grayscale"}`}>{b.emoji}</div>
                <div className="mt-2 font-semibold">{b.name}</div>
                <div className="text-xs text-muted">{b.how}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <h2 className="font-display text-xl font-semibold">Class leaderboard</h2>
        <ClassLeaderboard />
      </section>

      <Link
        href="/suggest?from=/me"
        className="glass flex items-center gap-4 rounded-3xl p-5 transition-colors hover:border-line-strong hover:bg-raised md:col-span-3"
      >
        <span className="text-3xl">💡</span>
        <span>
          <span className="font-display block text-lg font-semibold">Got an idea for Prayog?</span>
          <span className="text-sm text-muted">Tell us what to build next. The best ideas become new lessons and games.</span>
        </span>
      </Link>

      {synced ? (
        <section className="flex flex-wrap gap-4 text-sm text-faint md:col-span-3">
          <button
            className="underline hover:text-muted"
            onClick={async () => {
              if (!window.confirm("Sign out on this device? Your progress is saved to your account.")) return;
              await api("/api/auth/signout", "POST", { who: "child" }).catch(() => {});
              progressStore.clear();
              profileStore.clear();
              await refreshMe();
            }}
          >
            Sign out on this device
          </button>
          <span>To delete this profile, a parent or teacher can do it from their account.</span>
        </section>
      ) : (profile.parent || progress.xp > 0) && (
        <section className="md:col-span-3">
          <button
            className="text-sm text-faint underline hover:text-brick-300"
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

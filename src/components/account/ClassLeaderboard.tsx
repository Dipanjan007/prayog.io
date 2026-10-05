"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, refreshMe, useMe } from "@/lib/account";
import { profileStore } from "@/lib/profile";

interface Board {
  id: string;
  name: string;
  you: number;
  rows: { nickname: string; avatar: string; weekXp: number; you: boolean }[];
}

/** This week's class leaderboard, and the child's own choice to appear on it. */
export default function ClassLeaderboard() {
  const me = useMe();
  const child = me?.child;
  const [boards, setBoards] = useState<Board[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!child?.classes.length) return;
    api<{ classes: Board[] }>("/api/leaderboard")
      .then((r) => setBoards(r.classes))
      .catch(() => setBoards([]));
  }, [child?.id, child?.classes.length, child?.showOnLeaderboard]);

  if (!me?.server || !child) {
    return (
      <p className="mt-2 text-sm text-white/60">
        When your teacher creates a class, you can choose to appear on its weekly leaderboard. It ranks XP earned this
        week, so everyone starts fresh every Monday.
      </p>
    );
  }

  const toggle = async () => {
    setBusy(true);
    try {
      const { showOnLeaderboard } = await api<{ showOnLeaderboard: boolean }>("/api/child", "PATCH", { showOnLeaderboard: !child.showOnLeaderboard });
      profileStore.update((p) => (p.child ? { ...p, child: { ...p.child, showOnLeaderboard } } : p));
      await refreshMe();
    } catch {
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {child.classes.length === 0 ? (
        <p className="mt-2 text-sm text-white/60">
          You&apos;re not in a class yet.{" "}
          <Link href="/join/class" className="underline">
            Join with your teacher&apos;s code
          </Link>
          .
        </p>
      ) : (
        boards?.map((b) => (
          <div key={b.id} className="mt-3">
            <div className="text-sm font-semibold">{b.name} · this week</div>
            {b.rows.length === 0 ? (
              <p className="mt-1 text-sm text-white/50">No one is showing yet.</p>
            ) : (
              <ol className="mt-2 space-y-1 text-sm">
                {b.rows.map((r, i) => (
                  <li key={r.nickname} className={`flex items-center gap-2 rounded-xl px-2 py-1 ${r.you ? "bg-cyan-300/15" : ""}`}>
                    <span className="w-5 text-white/40">{i + 1}</span>
                    <span>{r.avatar}</span>
                    <span className="flex-1 truncate">{r.nickname}</span>
                    <span className="text-white/70">{r.weekXp}</span>
                  </li>
                ))}
              </ol>
            )}
            {!child.showOnLeaderboard && <p className="mt-2 text-xs text-white/50">You&apos;re hidden. This week you&apos;ve earned {b.you} XP.</p>}
          </div>
        ))
      )}
      <button className="mt-3 text-sm text-white/50 underline" disabled={busy} onClick={toggle}>
        {child.showOnLeaderboard ? "Hide me from the leaderboard" : "Show me on the leaderboard"}
      </button>
    </>
  );
}

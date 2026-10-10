"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { levelFor, useProgress } from "@/lib/progress";
import { useProfile } from "@/lib/profile";
import { subjectFor, tabActive } from "@/lib/subjects";

export default function NavBar() {
  const path = usePathname();
  const progress = useProgress();
  const profile = useProfile();
  const { level } = levelFor(progress.xp);
  // The tabs of the subject this page belongs to; pages like Home and Me have none.
  const tabs = subjectFor(path)?.tabs ?? [];

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#070a14]/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center gap-1.5 px-3 py-3 sm:gap-4 sm:px-6">
        <Link href="/" className="shrink-0 font-display text-lg font-bold sm:text-xl">
          <span className="text-gradient">prayog</span>
        </Link>
        {/* On narrow phones the tabs scroll sideways instead of pushing the page wider. */}
        <div className="no-scrollbar flex min-w-0 gap-0.5 overflow-x-auto sm:ml-2 sm:gap-1">
          {tabs.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`shrink-0 rounded-full px-2 py-1.5 text-[13px] transition sm:px-3 sm:text-sm ${
                tabActive(path, l.href) ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 text-sm sm:gap-2">
          {progress.streak.count > 0 && (
            <span className="hidden rounded-full bg-orange-400/15 px-2.5 py-1 text-orange-200 sm:inline" title="Day streak">
              🔥 {progress.streak.count}
            </span>
          )}
          <span className="whitespace-nowrap rounded-full bg-cyan-400/10 px-2 py-1 text-cyan-100 sm:px-2.5" title="Your XP">
            ⚡ {progress.xp}<span className="hidden sm:inline"> XP</span>
          </span>
          <Link
            href={profile.child ? "/me" : "/join"}
            className="flex h-8 min-w-8 items-center justify-center rounded-full bg-white/10 px-2"
            title={profile.child ? `Level ${level}` : "Set up a profile"}
          >
            {profile.child ? profile.child.avatar : "＋"}
          </Link>
        </div>
      </nav>
    </header>
  );
}

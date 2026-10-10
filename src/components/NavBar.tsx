"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { levelFor, useProgress } from "@/lib/progress";
import { useProfile } from "@/lib/profile";

const LINKS = [
  { href: "/learn", label: "Learn" },
  { href: "/outliers", label: "Outliers" },
  { href: "/olympiad", label: "Olympiad" },
  { href: "/me", label: "Me" },
];

export default function NavBar() {
  const path = usePathname();
  const progress = useProgress();
  const profile = useProfile();
  const { level } = levelFor(progress.xp);

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#070a14]/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center gap-1.5 px-3 py-3 sm:gap-4 sm:px-6">
        <Link href="/" className="font-display text-lg font-bold sm:text-xl">
          <span className="text-gradient">prayog</span>
        </Link>
        <div className="flex gap-0.5 sm:ml-2 sm:gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-1 py-1.5 text-[13px] transition sm:px-3 sm:text-sm ${
                path.startsWith(l.href) || (l.href === "/learn" && path.startsWith("/maths")) ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-sm sm:gap-2">
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

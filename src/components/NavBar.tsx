"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { levelFor, useProgress } from "@/lib/progress";
import { useProfile } from "@/lib/profile";

const LINKS = [
  { href: "/learn", label: "Learn" },
  { href: "/lab", label: "Lab" },
  { href: "/olympiad", label: "Olympiad" },
  { href: "/me", label: "Me" },
];

export default function NavBar() {
  const path = usePathname();
  const progress = useProgress();
  const profile = useProfile();
  const { level } = levelFor(progress.xp);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-base/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 px-3 py-1.5 sm:gap-4 sm:px-6">
        <Link href="/" className="font-display flex min-h-11 items-center gap-1 rounded-lg px-1 text-[1.3rem] leading-none sm:text-[1.45rem]" aria-label="Prayog home">
          <span className="italic">prayog</span>
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-saffron-400" aria-hidden />
        </Link>
        <div className="flex sm:ml-3 sm:gap-1">
          {LINKS.map((l) => {
            const active = path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-11 items-center rounded-full px-1.5 text-[0.95rem] transition-colors sm:px-3.5 ${
                  active ? "text-cream" : "text-muted hover:text-cream"
                }`}
              >
                {l.label}
                {active && <span className="absolute inset-x-3 bottom-1.5 h-px bg-saffron-400" aria-hidden />}
              </Link>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-sm">
          {progress.streak.count > 0 && (
            <span className="hidden items-center gap-1 rounded-full border border-line px-3 py-1.5 text-muted sm:inline-flex" title="Day streak">
              🔥 <span className="tabular-nums text-cream">{progress.streak.count}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-2.5 py-1.5 sm:px-3 text-muted" title="Your XP">
            <span className="h-1.5 w-1.5 rounded-full bg-saffron-400" aria-hidden />
            <span className="tabular-nums text-cream">{progress.xp}</span>
            <span className="hidden sm:inline">XP</span>
          </span>
          <Link
            href={profile.child ? "/me" : "/join"}
            className="flex h-11 min-w-11 items-center justify-center rounded-full border border-line bg-surface px-2 text-lg hover:border-line-strong"
            title={profile.child ? `Level ${level}` : "Set up a profile"}
            aria-label={profile.child ? `Your profile, level ${level}` : "Set up a profile"}
          >
            {profile.child ? profile.child.avatar : <span className="text-xl leading-none text-muted">+</span>}
          </Link>
        </div>
      </nav>
    </header>
  );
}

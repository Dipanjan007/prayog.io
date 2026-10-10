"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/lib/profile";
import { SUBJECTS, subjectFor } from "@/lib/subjects";

/**
 * The subjects: a panel down the left on laptops, and a row of pills under
 * the top bar on phones, where a side panel would leave no room for the labs.
 */
export default function SubjectPanel() {
  const path = usePathname();
  const profile = useProfile();
  const current = subjectFor(path)?.id;
  const meActive = path.startsWith("/me");

  return (
    <>
      <aside className="hidden w-52 shrink-0 lg:block">
        <nav className="glass sticky top-20 flex flex-col gap-1 rounded-3xl p-3" aria-label="Subjects">
          <div className="px-3 pb-1 pt-1 text-[11px] uppercase tracking-wider text-white/40">Subjects</div>
          {SUBJECTS.map((s) => (
            <Link
              key={s.id}
              href={s.tabs[0].href}
              aria-current={current === s.id ? "page" : undefined}
              className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition ${
                current === s.id ? "border-cyan-300/40 bg-white/10 text-white" : "border-transparent text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-lg">{s.icon}</span>
              <span className="font-display font-semibold">{s.label}</span>
            </Link>
          ))}
          <div className="my-2 border-t border-white/5" />
          <Link
            href={profile.child ? "/me" : "/join"}
            className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition ${
              meActive ? "border-cyan-300/40 bg-white/10 text-white" : "border-transparent text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="text-lg">{profile.child ? profile.child.avatar : "👤"}</span>
            <span>{profile.child ? "Me" : "Set up a profile"}</span>
          </Link>
        </nav>
      </aside>

      <nav className="-mx-1 mb-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden" aria-label="Subjects">
        {SUBJECTS.map((s) => (
          <Link
            key={s.id}
            href={s.tabs[0].href}
            aria-current={current === s.id ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition ${
              current === s.id ? "border-cyan-300/50 bg-white/10 text-white" : "border-white/10 text-white/60"
            }`}
          >
            <span>{s.icon}</span>
            {s.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "For schools" };

const STEPS = [
  { title: "Teacher signs up", text: "The school takes on the consent and data duties, so parents don't each need to sign up." },
  { title: "Create a class", text: "Each class gets a short join code. Students join with a nickname and a picture password, no email." },
  { title: "Weekly leaderboard", text: "A class-only leaderboard ranks this week's XP, so effort counts, not exam marks." },
  { title: "See who needs help", text: "Your dashboard shows each student's XP and the chapters they have finished." },
];

export default function SchoolPage() {
  return (
    <div className="max-w-3xl pt-4">
      <span className="rounded-full bg-violet-300/15 px-3 py-1 text-xs text-violet-200">Pilot</span>
      <h1 className="font-display mt-4 text-4xl font-bold">Prayog for schools</h1>
      <p className="mt-2 text-white/60">During the pilot, schools join by invitation. Here is how it works.</p>
      <ol className="mt-6 grid gap-3 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <li key={s.title} className="glass rounded-3xl p-5">
            <div className="font-display text-sm text-violet-300">0{i + 1}</div>
            <div className="font-display mt-3 text-xl font-semibold">{s.title}</div>
            <p className="mt-1 text-sm text-white/60">{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/teach" className="btn-primary">
          Teacher sign-up →
        </Link>
        <Link href="/join/class" className="btn-ghost">
          Student: join a class
        </Link>
      </div>
    </div>
  );
}

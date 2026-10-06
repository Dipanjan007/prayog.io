import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "For schools" };

const STEPS = [
  { title: "Teacher signs up", text: "The school licenses Prayog and acts as the data fiduciary, so students don't need separate parent sign-ups." },
  { title: "Create a class", text: "Each class gets a short join code. Students join with a nickname only." },
  { title: "Weekly class challenges", text: "Set a lab challenge for the week. The class-only leaderboard ranks effort, not exam marks." },
  { title: "See who needs help", text: "A dashboard shows which chapters each student has mastered, without tracking anything else." },
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

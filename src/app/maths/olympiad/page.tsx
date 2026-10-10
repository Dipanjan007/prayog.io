import type { Metadata } from "next";
import Link from "next/link";
import { FreeNote } from "@/components/access/FreeNote";
import { SetCards } from "@/components/olympiad/SetProgress";
import { XP_PER_STAR } from "@/lib/olympiad/score";

export const metadata: Metadata = {
  title: "Maths Olympiad track",
  description: "Original multi-step maths problems for strong Class 7 to 10 students preparing for IOQM, NMTC and RMO. Solve on paper, then test your answer in a live sim.",
};

export default function MathsOlympiadHub() {
  return (
    <div className="pt-4">
      <nav className="text-sm text-white/45" aria-label="Breadcrumb">
        <Link href="/maths" className="hover:text-white">
          Maths
        </Link>
      </nav>
      <h1 className="font-display mt-1 text-4xl font-bold">
        Maths Olympiad <span className="text-gradient">track</span>
      </h1>
      <p className="mt-2 max-w-2xl text-white/60">
        Harder, multi-step problems for strong Class 7 to 10 students. Solve each one on paper, type in your answer, and the sim builds it: the tiles close up, the ladder reaches the sill, or
        you see exactly where it goes wrong.
      </p>
      <FreeNote />

      <div className="glass mt-4 grid gap-4 rounded-2xl px-4 py-3 text-sm sm:grid-cols-2">
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-cyan-200/80">What are the Maths Olympiads?</h2>
          <p className="mt-1 text-white/80">
            In India the path starts with <b>IOQM</b> (Indian Olympiad Qualifier in Mathematics), open from Class 8. Top scorers sit the <b>RMO</b> and then the <b>INMO</b>, and the best few
            train to represent India at the <b>IMO</b>. Contests like <b>NMTC</b> also have junior papers for Classes 7 and 8. These problems are at the junior level.
          </p>
        </div>
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-cyan-200/80">How to use this page</h2>
          <ol className="mt-1 space-y-1 text-white/80">
            <li>1. Read the setup and draw a picture.</li>
            <li>2. Solve it on paper. A calculator is fine.</li>
            <li>3. Type your answer and test it in the sim. Within ±2% counts.</li>
            <li>4. Stuck? There are two hints (each costs a star), then a worked solution.</li>
          </ol>
          <p className="mt-2 text-xs text-white/45">
            Each star is worth {XP_PER_STAR["warm-up"]} XP on a warm-up, {XP_PER_STAR.standard} XP on a standard problem and {XP_PER_STAR.olympiad} XP on an Olympiad problem. Your progress stays on this device.
          </p>
        </div>
      </div>

      <SetCards subject="maths" />
    </div>
  );
}

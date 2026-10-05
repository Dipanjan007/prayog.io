import type { Metadata } from "next";
import { SetCards } from "@/components/olympiad/SetProgress";
import { XP_PER_STAR } from "@/lib/olympiad/score";

export const metadata: Metadata = {
  title: "Olympiad track",
  description: "Tougher, multi-step physics problems for strong Class 9 and 10 students preparing for NSEJS, IJSO and NSEP. Solve on paper, then test your answer in a live sim.",
};

export default function OlympiadHub() {
  return (
    <div className="pt-4">
      <h1 className="font-display text-4xl font-bold">
        Olympiad <span className="text-gradient">track</span>
      </h1>
      <p className="mt-2 max-w-2xl text-muted">
        Harder, multi-step problems for strong Class 9 and 10 students. Every problem is a small sim puzzle: your answer drives the sim, so you see straight away if the ball lands in the basket.
      </p>

      <div className="glass mt-4 grid gap-4 rounded-2xl px-4 py-3 text-sm sm:grid-cols-2">
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-saffron-200/80">What are the Olympiads?</h2>
          <p className="mt-1 text-cream/85">
            In India the path starts with <b>NSEJS</b>, the National Standard Examination in Junior Science, for students up to Class 10. Top scorers move on to the INJSO, then a training camp, and the best few represent India at
            the <b>IJSO</b>, the International Junior Science Olympiad. In Class 11 and 12 the physics path runs through <b>NSEP</b>. These problems match the junior level.
          </p>
        </div>
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-saffron-200/80">How to use this page</h2>
          <ol className="mt-1 space-y-1 text-cream/85">
            <li>1. Read the setup. Draw a diagram on paper.</li>
            <li>2. Solve it with pencil and paper first. A calculator is fine.</li>
            <li>3. Type your number and test it in the sim. Within ±2% counts.</li>
            <li>4. Stuck? Two hints, each costs a star. Then a full worked solution.</li>
          </ol>
          <p className="mt-2 text-xs text-faint">
            Each star is worth {XP_PER_STAR["warm-up"]} XP on a warm-up, {XP_PER_STAR.standard} XP on a standard problem and {XP_PER_STAR.olympiad} XP on an Olympiad problem. Your progress stays on this device.
          </p>
        </div>
      </div>

      <SetCards />
    </div>
  );
}

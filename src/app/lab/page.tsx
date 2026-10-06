import type { Metadata } from "next";
import LabTunnel from "./LabTunnel";

export const metadata: Metadata = { title: "Lab", description: "Free play in the Prayog wind tunnel." };

export default function LabPage() {
  return (
    <div className="pt-4">
      <h1 className="font-display text-4xl font-bold">Wind tunnel lab</h1>
      <p className="mt-2 max-w-2xl text-white/60">
        No missions, no timer. Try a real-world example, or pick a shape or draw your own, crank up the wind, and see how air flows and pushes.
      </p>
      <div className="glass mt-4 grid gap-4 rounded-2xl px-4 py-3 text-sm sm:grid-cols-3">
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-cyan-200/80">Objective</h2>
          <p className="mt-1 text-white/80">Experiment freely with air flow around any shape, and test your own ideas without a lesson to follow.</p>
        </div>
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-cyan-200/80">You will learn</h2>
          <ul className="mt-1 space-y-1 text-white/80">
            <li>✓ How shape changes drag and lift</li>
            <li>✓ Where air speeds up and its pressure drops</li>
            <li>✓ How engineers test designs before building them</li>
          </ul>
        </div>
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-cyan-200/80">Where you will see it</h2>
          <p className="mt-1 text-white/80">Car and bike makers, aircraft designers and cricket ball makers all use wind tunnels like this one.</p>
        </div>
      </div>
      <LabTunnel />
    </div>
  );
}

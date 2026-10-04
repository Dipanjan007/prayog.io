import type { Metadata } from "next";
import WindTunnel from "@/components/sim/WindTunnel";

export const metadata: Metadata = { title: "Lab", description: "Free play in the Prayog wind tunnel." };

export default function LabPage() {
  return (
    <div className="pt-4">
      <h1 className="font-display text-4xl font-bold">Wind tunnel lab</h1>
      <p className="mt-2 max-w-2xl text-white/60">
        No missions, no timer. Pick a shape or draw your own, crank up the wind, and see how air flows and pushes.
      </p>
      <div className="mt-6">
        <WindTunnel initialShape="wing" initialSpeed={80} initialView="speed" />
      </div>
    </div>
  );
}

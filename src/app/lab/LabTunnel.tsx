"use client";

import { useState } from "react";
import WindTunnel, { type ViewMode } from "@/components/sim/WindTunnel";
import type { ShapeId } from "@/lib/sim/shapes";

type Example = { id: string; emoji: string; title: string; text: string; shape: ShapeId; speed: number; angle: number; view: ViewMode };

const EXAMPLES: Example[] = [
  {
    id: "car",
    emoji: "🏎️",
    title: "Sports car downforce",
    text: "The rear wing is an upside-down aeroplane wing. Low pressure under it sucks the car onto the road, so it can corner faster without skidding.",
    shape: "car",
    speed: 120,
    angle: -20,
    view: "pressure",
  },
  {
    id: "plane",
    emoji: "✈️",
    title: "Aeroplane wing",
    text: "Tilt the wing up a little. Air speeds over the curved top, the pressure there drops, and the wing is lifted.",
    shape: "wing",
    speed: 90,
    angle: 8,
    view: "speed",
  },
  {
    id: "cyclone",
    emoji: "🌀",
    title: "Roof in a cyclone",
    text: "Storm winds race over the roof. The low pressure above can lift a roof right off, which is why cyclone shelters tie roofs down.",
    shape: "house",
    speed: 150,
    angle: 0,
    view: "pressure",
  },
  {
    id: "drop",
    emoji: "💧",
    title: "Raindrop vs ball",
    text: "A smooth tail lets the air close in gently behind it. Compare the drag with the ball to see why fast things are streamlined.",
    shape: "teardrop",
    speed: 100,
    angle: 0,
    view: "smoke",
  },
];

export default function LabTunnel() {
  const [ex, setEx] = useState<Example | null>(null);
  return (
    <>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {EXAMPLES.map((e) => (
          <button
            key={e.id}
            onClick={() => setEx(e)}
            className={`rounded-2xl border p-3 text-left transition hover:bg-white/10 ${
              ex?.id === e.id ? "border-lime-300/60 bg-lime-300/10" : "border-white/10 bg-white/5"
            }`}
          >
            <div className="font-semibold">
              {e.emoji} {e.title}
            </div>
          </button>
        ))}
      </div>
      {ex && <p className="mt-3 max-w-3xl text-sm text-white/70">{ex.text}</p>}
      <div className="mt-4">
        <WindTunnel
          key={ex?.id ?? "free"}
          initialShape={ex?.shape ?? "wing"}
          initialSpeed={ex?.speed ?? 80}
          initialView={ex?.view ?? "speed"}
          initialAngle={ex?.angle ?? 0}
        />
      </div>
    </>
  );
}

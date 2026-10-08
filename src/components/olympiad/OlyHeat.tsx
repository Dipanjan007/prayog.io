"use client";

import type { HeatScene } from "@/lib/sim/oly-heat";

interface Props {
  scene: HeatScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

/** Placeholder until the heat and temperature sim is built. */
export default function OlyHeat({ scene }: Props) {
  return <div className="h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" aria-label={scene.kind} />;
}

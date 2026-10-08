"use client";

import type { CircuitScene } from "@/lib/sim/oly-electricity";

interface Props {
  scene: CircuitScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

/** Placeholder until the electricity sim is built. */
export default function OlyCircuit({ scene }: Props) {
  return <div className="h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" aria-label={scene.kind} />;
}

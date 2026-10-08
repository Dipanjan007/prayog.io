"use client";

import type { FluidsScene } from "@/lib/sim/oly-fluids";

interface Props {
  scene: FluidsScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

/** Placeholder until the fluids and buoyancy sim is built. */
export default function OlyFluids({ scene }: Props) {
  return <div className="h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" aria-label={scene.kind} />;
}

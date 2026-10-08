"use client";

import type { OrbitsScene } from "@/lib/sim/oly-orbits";

interface Props {
  scene: OrbitsScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

/** Placeholder until the gravitation and orbits sim is built. */
export default function OlyOrbits({ scene }: Props) {
  return <div className="h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" aria-label={scene.kind} />;
}

"use client";

import type { OpticsScene } from "@/lib/sim/oly-optics";

interface Props {
  scene: OpticsScene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

/** Placeholder until the optics sim is built. */
export default function OlyOptics({ scene }: Props) {
  return <div className="h-60 w-full rounded-2xl border border-white/10 bg-[#0a0d1c] sm:h-80" aria-label={scene.kind} />;
}

"use client";

import type { Scene } from "@/lib/olympiad/scene";
import OlyCollision from "./OlyCollision";
import OlyIncline from "./OlyIncline";
import OlyProjectile from "./OlyProjectile";
import OlyTrack from "./OlyTrack";

interface Props {
  scene: Scene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

/** Picks the right reusable sim for a scene. */
export default function OlySim(props: Props) {
  const { scene, ...rest } = props;
  switch (scene.kind) {
    case "arc":
    case "river":
      return <OlyProjectile scene={scene} {...rest} />;
    case "atwood":
    case "slide":
    case "pulley":
      return <OlyIncline scene={scene} {...rest} />;
    case "bank":
    case "loop":
      return <OlyTrack scene={scene} {...rest} />;
    default:
      return <OlyCollision scene={scene} {...rest} />;
  }
}

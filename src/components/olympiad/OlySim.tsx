"use client";

import type { Scene } from "@/lib/olympiad/scene";
import { isOpticsScene } from "@/lib/sim/oly-optics";
import { isCircuitScene } from "@/lib/sim/oly-electricity";
import { isFluidsScene } from "@/lib/sim/oly-fluids";
import { isHeatScene } from "@/lib/sim/oly-heat";
import { isOrbitsScene } from "@/lib/sim/oly-orbits";
import { isNumberScene } from "@/lib/sim/oly-number";
import { isCountScene } from "@/lib/sim/oly-count";
import { isPolygonScene } from "@/lib/sim/oly-polygon";
import { isTriangleScene } from "@/lib/sim/oly-triangle";
import { isFillScene } from "@/lib/sim/oly-fill";
import { isEquationScene } from "@/lib/sim/oly-equation";
import { isPatternScene } from "@/lib/sim/oly-pattern";
import OlyCollision from "./OlyCollision";
import OlyIncline from "./OlyIncline";
import OlyProjectile from "./OlyProjectile";
import OlyTrack from "./OlyTrack";
import OlyOptics from "./OlyOptics";
import OlyCircuit from "./OlyCircuit";
import OlyFluids from "./OlyFluids";
import OlyHeat from "./OlyHeat";
import OlyOrbits from "./OlyOrbits";
import OlyNumber from "./OlyNumber";
import OlyCount from "./OlyCount";
import OlyPolygon from "./OlyPolygon";
import OlyTriangle from "./OlyTriangle";
import OlyFill from "./OlyFill";
import OlyEquation from "./OlyEquation";
import OlyPattern from "./OlyPattern";

interface Props {
  scene: Scene;
  idle: boolean;
  runKey: number;
  onDone?: () => void;
}

/** Picks the right reusable sim for a scene. */
export default function OlySim(props: Props) {
  const { scene, ...rest } = props;
  if (isNumberScene(scene)) return <OlyNumber scene={scene} {...rest} />;
  if (isCountScene(scene)) return <OlyCount scene={scene} {...rest} />;
  if (isPolygonScene(scene)) return <OlyPolygon scene={scene} {...rest} />;
  if (isTriangleScene(scene)) return <OlyTriangle scene={scene} {...rest} />;
  if (isFillScene(scene)) return <OlyFill scene={scene} {...rest} />;
  if (isEquationScene(scene)) return <OlyEquation scene={scene} {...rest} />;
  if (isPatternScene(scene)) return <OlyPattern scene={scene} {...rest} />;
  if (isOpticsScene(scene)) return <OlyOptics scene={scene} {...rest} />;
  if (isCircuitScene(scene)) return <OlyCircuit scene={scene} {...rest} />;
  if (isFluidsScene(scene)) return <OlyFluids scene={scene} {...rest} />;
  if (isHeatScene(scene)) return <OlyHeat scene={scene} {...rest} />;
  if (isOrbitsScene(scene)) return <OlyOrbits scene={scene} {...rest} />;
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

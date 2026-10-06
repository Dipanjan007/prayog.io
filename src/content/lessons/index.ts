import { lesson as circuits } from "./circuits";
import { lesson as pressureWinds } from "./pressure-winds";
import { lesson as motion } from "./motion";
import { lesson as lightRefraction } from "./light-refraction";
import { lesson as mirrorsLenses } from "./mirrors-lenses";
import { lesson as humanEye } from "./human-eye";
import { lesson as forces } from "./forces";
import { lesson as magneticHeating } from "./magnetic-heating";
import { lesson as skyClock } from "./sky-clock";
import { lesson as forcesMotion } from "./forces-motion";
import { lesson as workEnergy } from "./work-energy";
import { lesson as sound } from "./sound";
import { lesson as electricity } from "./electricity";
import { lesson as magneticEffects } from "./magnetic-effects";
import { lesson as timeMotion } from "./time-motion";
import { lesson as heatTransfer } from "./heat-transfer";
import { lesson as shadows } from "./shadows-reflections";
import { lesson as earthMoonSun } from "./earth-moon-sun";
import type { LessonDef } from "./types";

/** Every playable lesson, in class order. */
export const LESSONS: LessonDef[] = [
  timeMotion,
  heatTransfer,
  circuits,
  shadows,
  earthMoonSun,
  pressureWinds,
  mirrorsLenses,
  forces,
  magneticHeating,
  skyClock,
  motion,
  forcesMotion,
  workEnergy,
  sound,
  lightRefraction,
  humanEye,
  electricity,
  magneticEffects,
];

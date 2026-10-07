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
import { lesson as gravity } from "./gravity";
import { lesson as circularMotion } from "./circular-motion";
import { lesson as blackHoles } from "./black-holes";
import { lesson as timeDilation } from "./time-dilation";
import { lesson as lengthContraction } from "./length-contraction";
import { lesson as massEnergy } from "./mass-energy";
import { lesson as pressureLab } from "./pressure-lab";
import { lesson as floatSink } from "./float-sink";
import { lesson as cellsCompass } from "./cells-compass";
import { lesson as pathsCircles } from "./paths-circles";
import { lesson as simpleMachines } from "./simple-machines";
import { lesson as soundUses } from "./sound-uses";
import { lesson as houseWiring } from "./house-wiring";
import { lesson as skyColours } from "./sky-colours";
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
  pressureLab,
  floatSink,
  cellsCompass,
  pathsCircles,
  simpleMachines,
  soundUses,
  houseWiring,
  skyColours,
  gravity,
  circularMotion,
  blackHoles,
  timeDilation,
  lengthContraction,
  massEnergy,
];

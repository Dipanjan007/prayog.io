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
import { lesson as waterCycle } from "./water-cycle";
import { lesson as frictionTension } from "./friction-tension";
import { lesson as eyeDefects } from "./eye-defects";
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
  waterCycle,
  frictionTension,
  eyeDefects,
  gravity,
  circularMotion,
  blackHoles,
  timeDilation,
  lengthContraction,
  massEnergy,
];

/** Where each lesson is played, by lesson id. */
export const LESSON_HREF: Record<string, string> = {
  "x-black-holes": "/outliers/black-holes",
  "c8-cells-compass": "/learn/cells-compass",
  "c7-circuits": "/learn/circuits",
  "x-circular-motion": "/outliers/circular-motion",
  "c7-earth-moon-sun": "/learn/earth-moon-sun",
  "c10-electricity": "/learn/electricity",
  "c10-eye-defects": "/learn/eye-defects",
  "c8-float-sink": "/learn/float-sink",
  "c9-forces-motion": "/learn/forces-motion",
  "c8-forces": "/learn/forces",
  "c9-friction-tension": "/learn/friction-tension",
  "x-gravity": "/outliers/gravity",
  "c7-heat-transfer": "/learn/heat-transfer",
  "c10-house-wiring": "/learn/house-wiring",
  "c10-human-eye": "/learn/human-eye",
  "x-length-contraction": "/outliers/length-contraction",
  "c10-light": "/learn/light-refraction",
  "c10-magnetic": "/learn/magnetic-effects",
  "c8-magnetic-heating": "/learn/magnetic-heating",
  "x-mass-energy": "/outliers/mass-energy",
  "c8-mirrors-lenses": "/learn/mirrors-lenses",
  "c9-motion": "/learn/motion",
  "c9-paths-circles": "/learn/paths-circles",
  "c8-pressure-lab": "/learn/pressure-lab",
  "c8-pressure-winds": "/learn/pressure-winds",
  "c7-shadows": "/learn/shadows-reflections",
  "c9-simple-machines": "/learn/simple-machines",
  "c8-sky": "/learn/sky-clock",
  "c10-sky-colours": "/learn/sky-colours",
  "c9-sound-uses": "/learn/sound-uses",
  "c9-sound": "/learn/sound",
  "x-time-dilation": "/outliers/time-dilation",
  "c7-time-motion": "/learn/time-motion",
  "c7-water-cycle": "/learn/water-cycle",
  "c9-work-energy": "/learn/work-energy",
};

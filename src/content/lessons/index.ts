import { lesson as circuits } from "./circuits";
import { lesson as pressureWinds } from "./pressure-winds";
import { lesson as motion } from "./motion";
import { lesson as lightRefraction } from "./light-refraction";
import { lesson as mirrorsLenses } from "./mirrors-lenses";
import { lesson as humanEye } from "./human-eye";
import type { LessonDef } from "./types";

/** Every playable lesson, in class order. */
export const LESSONS: LessonDef[] = [circuits, pressureWinds, mirrorsLenses, motion, lightRefraction, humanEye];

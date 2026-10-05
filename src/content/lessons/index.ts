import { lesson as circuits } from "./circuits";
import { lesson as pressureWinds } from "./pressure-winds";
import { lesson as motion } from "./motion";
import type { LessonDef } from "./types";

/** Every playable lesson, in class order. */
export const LESSONS: LessonDef[] = [circuits, pressureWinds, motion];

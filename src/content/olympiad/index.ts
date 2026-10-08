import { CIRCULAR_PROBLEMS } from "./circular";
import { MOMENTUM_PROBLEMS } from "./momentum";
import { NEWTON_PROBLEMS } from "./newton";
import { PROJECTILE_PROBLEMS } from "./projectiles";
import { OPTICS_PROBLEMS } from "./optics";
import { ELECTRICITY_PROBLEMS } from "./electricity";
import { FLUIDS_PROBLEMS } from "./fluids";
import { HEAT_PROBLEMS } from "./heat";
import { ORBITS_PROBLEMS } from "./orbits";
import type { OlyProblem, SetId } from "./types";

export { OLY_SETS, getSet } from "./sets";
export type { OlyProblem, OlySet, SetId } from "./types";

export const OLY_PROBLEMS: OlyProblem[] = [...PROJECTILE_PROBLEMS, ...NEWTON_PROBLEMS, ...CIRCULAR_PROBLEMS, ...MOMENTUM_PROBLEMS, ...OPTICS_PROBLEMS, ...ELECTRICITY_PROBLEMS, ...FLUIDS_PROBLEMS, ...HEAT_PROBLEMS, ...ORBITS_PROBLEMS];

const ORDER = { "warm-up": 0, standard: 1, olympiad: 2 } as const;

export function problemsInSet(set: SetId | string) {
  return OLY_PROBLEMS.filter((p) => p.set === set).sort((a, b) => ORDER[a.level] - ORDER[b.level]);
}

export function getProblem(set: string, id: string) {
  return OLY_PROBLEMS.find((p) => p.set === set && p.id === id);
}

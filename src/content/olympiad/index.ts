import { CIRCULAR_PROBLEMS } from "./circular";
import { MOMENTUM_PROBLEMS } from "./momentum";
import { NEWTON_PROBLEMS } from "./newton";
import { PROJECTILE_PROBLEMS } from "./projectiles";
import { OPTICS_PROBLEMS } from "./optics";
import { ELECTRICITY_PROBLEMS } from "./electricity";
import { FLUIDS_PROBLEMS } from "./fluids";
import { HEAT_PROBLEMS } from "./heat";
import { ORBITS_PROBLEMS } from "./orbits";
import { MATHS_NUMBER_PROBLEMS } from "./maths-number";
import { MATHS_POLYGON_PROBLEMS } from "./maths-polygons";
import { MATHS_TRIANGLE_PROBLEMS } from "./maths-triangles";
import { MATHS_AREA_PROBLEMS } from "./maths-areas";
import { MATHS_COUNTING_PROBLEMS } from "./maths-counting";
import { MATHS_PROBABILITY_PROBLEMS } from "./maths-probability";
import { MATHS_EQUATION_PROBLEMS } from "./maths-equations";
import { MATHS_SEQUENCE_PROBLEMS } from "./maths-sequences";
import { MATHS_COORDINATE_PROBLEMS } from "./maths-coordinates";
import { getSet, subjectOf } from "./sets";
import type { OlyProblem, OlySubject, SetId } from "./types";

export { OLY_SETS, getSet, olyBase, setsFor, subjectOf } from "./sets";
export type { OlyProblem, OlySet, OlySubject, SetId } from "./types";

/** The Maths track, set by set. */
export const MATHS_PROBLEMS: OlyProblem[] = [...MATHS_NUMBER_PROBLEMS, ...MATHS_POLYGON_PROBLEMS, ...MATHS_TRIANGLE_PROBLEMS, ...MATHS_AREA_PROBLEMS, ...MATHS_COUNTING_PROBLEMS, ...MATHS_PROBABILITY_PROBLEMS, ...MATHS_EQUATION_PROBLEMS, ...MATHS_SEQUENCE_PROBLEMS, ...MATHS_COORDINATE_PROBLEMS];

export const OLY_PROBLEMS: OlyProblem[] = [...PROJECTILE_PROBLEMS, ...NEWTON_PROBLEMS, ...CIRCULAR_PROBLEMS, ...MOMENTUM_PROBLEMS, ...OPTICS_PROBLEMS, ...ELECTRICITY_PROBLEMS, ...FLUIDS_PROBLEMS, ...HEAT_PROBLEMS, ...ORBITS_PROBLEMS, ...MATHS_PROBLEMS];

const ORDER = { "warm-up": 0, standard: 1, olympiad: 2 } as const;

export function problemsInSet(set: SetId | string) {
  return OLY_PROBLEMS.filter((p) => p.set === set).sort((a, b) => ORDER[a.level] - ORDER[b.level]);
}

export function getProblem(set: string, id: string) {
  return OLY_PROBLEMS.find((p) => p.set === set && p.id === id);
}

/** Every problem of one track (Physics or Maths). */
export function problemsFor(subject: OlySubject) {
  return OLY_PROBLEMS.filter((p) => {
    const s = getSet(p.set);
    return s !== undefined && subjectOf(s) === subject;
  });
}

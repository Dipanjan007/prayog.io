"use client";

import { createLocalStore } from "@/lib/store";
import type { Level } from "./score";

/** Best result per problem, kept only on this device. */
export interface OlyRecord {
  solved: boolean;
  stars: number;
  xp: number;
  tries: number;
  /** Solved with the solution already open (counts as studied, no stars). */
  studied?: boolean;
  at?: number;
}

export interface OlyState {
  v: 1;
  problems: Record<string, OlyRecord>;
}

export const OLY_KEY = "prayog-olympiad-v1";

export const olyStore = createLocalStore<OlyState>(OLY_KEY, { v: 1, problems: {} });

/** Count one attempt (right or wrong). */
export function recordTry(id: string) {
  olyStore.update((s) => {
    const prev = s.problems[id] ?? { solved: false, stars: 0, xp: 0, tries: 0 };
    return { ...s, problems: { ...s.problems, [id]: { ...prev, tries: prev.tries + 1 } } };
  });
}

/** Save a solve, keeping the best stars and XP seen so far. */
export function recordSolve(id: string, stars: number, xp: number) {
  olyStore.update((s) => {
    const prev = s.problems[id] ?? { solved: false, stars: 0, xp: 0, tries: 0 };
    const next: OlyRecord = {
      ...prev,
      solved: true,
      stars: Math.max(prev.stars, stars),
      xp: Math.max(prev.xp, xp),
      studied: prev.studied || stars === 0,
      at: Date.now(),
    };
    return { ...s, problems: { ...s.problems, [id]: next } };
  });
}

export function totals(state: OlyState, ids: string[]) {
  let stars = 0;
  let xp = 0;
  let solved = 0;
  for (const id of ids) {
    const r = state.problems[id];
    if (!r) continue;
    stars += r.stars;
    xp += r.xp;
    if (r.solved) solved++;
  }
  return { stars, xp, solved };
}

export type { Level };

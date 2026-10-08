/**
 * Physics for the gravitation and orbits Olympiad sim. Placeholder until the set is built.
 */

export interface OrbitsScene {
  kind: "orbits-placeholder";
}

/** True for every scene this sim draws. */
export function isOrbitsScene(s: { kind: string }): s is OrbitsScene {
  return s.kind.startsWith("orbits-");
}

export function planOrbits(s: OrbitsScene): { outcome: { ok: boolean; text: string }; duration: number } {
  void s;
  return { outcome: { ok: false, text: "" }, duration: 0 };
}

/**
 * Physics for the heat and temperature Olympiad sim. Placeholder until the set is built.
 */

export interface HeatScene {
  kind: "heat-placeholder";
}

/** True for every scene this sim draws. */
export function isHeatScene(s: { kind: string }): s is HeatScene {
  return s.kind.startsWith("heat-");
}

export function planHeat(s: HeatScene): { outcome: { ok: boolean; text: string }; duration: number } {
  void s;
  return { outcome: { ok: false, text: "" }, duration: 0 };
}

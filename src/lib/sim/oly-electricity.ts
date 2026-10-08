/**
 * Physics for the electricity Olympiad sim. Placeholder until the set is built.
 */

export interface CircuitScene {
  kind: "electricity-placeholder";
}

/** True for every scene this sim draws. */
export function isCircuitScene(s: { kind: string }): s is CircuitScene {
  return s.kind.startsWith("electricity-");
}

export function planCircuit(s: CircuitScene): { outcome: { ok: boolean; text: string }; duration: number } {
  void s;
  return { outcome: { ok: false, text: "" }, duration: 0 };
}

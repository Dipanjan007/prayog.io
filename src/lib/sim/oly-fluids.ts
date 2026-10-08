/**
 * Physics for the fluids and buoyancy Olympiad sim. Placeholder until the set is built.
 */

export interface FluidsScene {
  kind: "fluids-placeholder";
}

/** True for every scene this sim draws. */
export function isFluidsScene(s: { kind: string }): s is FluidsScene {
  return s.kind.startsWith("fluids-");
}

export function planFluids(s: FluidsScene): { outcome: { ok: boolean; text: string }; duration: number } {
  void s;
  return { outcome: { ok: false, text: "" }, duration: 0 };
}

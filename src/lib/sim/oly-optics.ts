/**
 * Physics for the optics Olympiad sim. Placeholder until the set is built.
 */

export interface OpticsScene {
  kind: "optics-placeholder";
}

/** True for every scene this sim draws. */
export function isOpticsScene(s: { kind: string }): s is OpticsScene {
  return s.kind.startsWith("optics-");
}

export function planOptics(s: OpticsScene): { outcome: { ok: boolean; text: string }; duration: number } {
  void s;
  return { outcome: { ok: false, text: "" }, duration: 0 };
}

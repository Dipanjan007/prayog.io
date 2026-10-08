/**
 * Size a canvas for a CSS box of w × h pixels on a sharp (high-DPR) screen,
 * capped at 2× to keep phones fast. Only resizes when the box changed, so it
 * is cheap to call every frame. Returns a context that draws in CSS pixels.
 */
export function fitCanvas(c: HTMLCanvasElement, w: number, h: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
  }
  const ctx = c.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

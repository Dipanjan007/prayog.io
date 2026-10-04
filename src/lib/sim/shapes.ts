/** Obstacles for the wind tunnel, rasterised onto the simulation grid. */

export type ShapeId = "circle" | "square" | "plate" | "teardrop" | "wing" | "house" | "custom";

export interface ShapeInfo {
  id: ShapeId;
  label: string;
  /** Whether the angle slider does anything for this shape. */
  rotates: boolean;
}

export const SHAPES: ShapeInfo[] = [
  { id: "circle", label: "Ball", rotates: false },
  { id: "square", label: "Box", rotates: true },
  { id: "teardrop", label: "Raindrop", rotates: true },
  { id: "plate", label: "Flat plate", rotates: true },
  { id: "wing", label: "Wing", rotates: true },
  { id: "house", label: "House", rotates: false },
  { id: "custom", label: "Draw your own", rotates: false },
];

export interface ShapeParams {
  shape: ShapeId;
  /** Degrees, positive tilts the front edge upwards. */
  angle: number;
}

/** Rows of ground at the bottom of the tunnel when the house is shown. */
export const groundRows = (ny: number) => Math.max(2, Math.round(ny * 0.03));

/** Build a solid mask. `custom` returns the painted mask unchanged. */
export function rasterise(
  nx: number,
  ny: number,
  params: ShapeParams,
  painted?: Uint8Array,
): Uint8Array {
  if (params.shape === "custom") return painted ? painted.slice() : new Uint8Array(nx * ny);

  const mask = new Uint8Array(nx * ny);
  const size = Math.round(ny / 5); // frontal height of most shapes
  const cx = Math.round(nx * 0.28);
  const cy = Math.round(ny / 2);
  const th = (params.angle * Math.PI) / 180;
  const cos = Math.cos(th);
  const sin = Math.sin(th);

  if (params.shape === "house") {
    const groundTop = ny - groundRows(ny);
    const wallH = Math.round(size * 0.9);
    const roofH = Math.round(size * 0.3); // gentle pitch: steep windward roofs get pushed down instead of lifted
    const half = Math.round(size * 0.75);
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const dx = x - cx;
        const fromGround = groundTop - y;
        let inside = y >= groundTop;
        if (!inside && Math.abs(dx) <= half && fromGround >= 0) {
          if (fromGround < wallH) inside = true;
          else {
            const h = fromGround - wallH; // height into the roof
            inside = h < roofH * (1 - Math.abs(dx) / (half + 2));
          }
        }
        if (inside) mask[y * nx + x] = 1;
      }
    }
    return mask;
  }

  const inside = insideTest(params.shape, size, ny);
  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      const dx = x - cx;
      const dy = y - cy;
      // Rotate into the body frame (+y is down on screen).
      const bx = dx * cos + dy * sin;
      const by = -dx * sin + dy * cos;
      if (inside(bx, by)) mask[y * nx + x] = 1;
    }
  }
  return mask;
}

function insideTest(shape: ShapeId, size: number, ny: number): (bx: number, by: number) => boolean {
  // Thin parts are sized relative to the grid so a finer drawing grid gives the same shape.
  const thin = Math.max(ny * 0.011, 1.1);
  const r = size / 2;
  switch (shape) {
    case "circle":
      return (bx, by) => bx * bx + by * by <= r * r;
    case "square":
      return (bx, by) => Math.abs(bx) <= r && Math.abs(by) <= r;
    case "plate": {
      const half = size; // chord of 2 × size
      return (bx, by) => Math.abs(bx) <= half && Math.abs(by) <= thin;
    }
    case "teardrop":
      // Symmetric aerofoil, 40% thick, with the same frontal height as the ball.
      return airfoil(size / 0.4, 0.4, 0, 0.4, thin / 2);
    case "wing":
      // NACA 2412-style wing, chord 2.5 × size.
      return airfoil(size * 2.5, 0.12, 0.02, 0.4, thin / 2);
    default:
      return () => false;
  }
}

/** NACA 4-digit section centred on the origin; `by` is screen-down. */
function airfoil(chord: number, t: number, m: number, p: number, minHalfCells: number) {
  return (bx: number, by: number) => {
    const xc = (bx + chord / 2) / chord;
    if (xc < 0 || xc > 1) return false;
    const yt =
      5 * t * (0.2969 * Math.sqrt(xc) - 0.126 * xc - 0.3516 * xc ** 2 + 0.2843 * xc ** 3 - 0.1015 * xc ** 4);
    const yc = m === 0 ? 0 : xc < p ? (m / p ** 2) * (2 * p * xc - xc * xc) : (m / (1 - p) ** 2) * (1 - 2 * p + 2 * p * xc - xc * xc);
    const up = -by / chord; // height above the chord line, as a fraction of chord
    // Keep a minimum thickness so thin trailing edges stay solid.
    const minHalf = minHalfCells / chord;
    return Math.abs(up - yc) <= Math.max(yt, minHalf);
  };
}

/** The part of the mask whose force we report: everything but the ground. */
export function measuredPart(nx: number, ny: number, params: ShapeParams, mask: Uint8Array): Uint8Array {
  if (params.shape !== "house") return mask;
  const m = mask.slice();
  m.fill(0, (ny - groundRows(ny)) * nx);
  return m;
}

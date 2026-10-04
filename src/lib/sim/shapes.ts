/** Obstacles for the wind tunnel, rasterised onto the simulation grid. */

export type ShapeId = "circle" | "square" | "plate" | "teardrop" | "wing" | "house" | "car" | "custom";

export interface ShapeInfo {
  id: ShapeId;
  label: string;
  /** Whether the angle slider does anything for this shape. */
  rotates: boolean;
  /** What the angle slider is called for this shape. */
  angleLabel?: string;
  /** Sits on the ground rather than floating mid-tunnel. */
  grounded?: boolean;
  /** Slider range in degrees; defaults to -20..25. */
  angleRange?: [number, number];
}

export const SHAPES: ShapeInfo[] = [
  { id: "circle", label: "Ball", rotates: false },
  { id: "square", label: "Box", rotates: true },
  { id: "teardrop", label: "Raindrop", rotates: true },
  { id: "plate", label: "Flat plate", rotates: true },
  { id: "wing", label: "Wing", rotates: true },
  { id: "house", label: "House", rotates: false, grounded: true },
  // Past about -12° the rear wing stalls on the coarse phone grid, so stop there.
  { id: "car", label: "Sports car", rotates: true, angleLabel: "Rear wing tilt", grounded: true, angleRange: [-25, 10] },
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

  if (params.shape === "car") return car(nx, ny, size, cx, params.angle);

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
  if (params.shape !== "house" && params.shape !== "car") return mask;
  const m = mask.slice();
  m.fill(0, (ny - groundRows(ny)) * nx);
  return m;
}

/** Height of the car body above its floor, in units of `size`, along its length (front at 0). */
const CAR_PROFILE: [number, number][] = [
  [0, 0.12],
  [0.06, 0.3],
  [0.3, 0.42],
  [0.45, 0.85],
  [0.66, 0.9],
  [0.9, 0.55],
  [1, 0.5],
];

function profileAt(t: number) {
  for (let i = 1; i < CAR_PROFILE.length; i++) {
    const [x1, h1] = CAR_PROFILE[i];
    if (t <= x1) {
      const [x0, h0] = CAR_PROFILE[i - 1];
      return h0 + ((h1 - h0) * (t - x0)) / (x1 - x0);
    }
  }
  return CAR_PROFILE[CAR_PROFILE.length - 1][1];
}

/**
 * A low sports car on the ground: a wedge body with a gap underneath, two
 * wheels, and an upside-down rear wing on a strut. The angle tilts only the
 * wing; its curve pushes air up, so the air pushes the car down.
 */
function car(nx: number, ny: number, size: number, cx: number, angle: number) {
  const mask = new Uint8Array(nx * ny);
  const groundTop = ny - groundRows(ny);
  const length = size * 3.2;
  const front = cx - length / 2;
  const clearance = size * 0.2;
  const floor = groundTop - clearance; // underside of the body
  const wheelR = size * 0.3;
  const wheels = [front + length * 0.2, front + length * 0.8];
  const wheelY = groundTop - wheelR;
  const thin = Math.max(ny * 0.011, 1.1);

  // Rear wing: an upside-down aerofoil on a strut, rotated about its middle.
  const wingChord = size * 1.3;
  const wingX = front + length * 0.88;
  const wingY = floor - size * 1.35;
  const strutTop = wingY + size * 0.1;
  // Rotate so a negative tilt puts the front edge down, which makes downforce.
  const th = (angle * Math.PI) / 180;
  const cos = Math.cos(th);
  const sin = Math.sin(th);
  const wing = airfoil(wingChord, 0.12, 0.04, 0.4, thin / 2);

  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      let inside = y >= groundTop;
      if (!inside) {
        const t = (x - front) / length;
        if (t >= 0 && t <= 1 && y <= floor && floor - y <= profileAt(t) * size) inside = true;
      }
      if (!inside) {
        for (const wx of wheels) if ((x - wx) ** 2 + (y - wheelY) ** 2 <= wheelR * wheelR) inside = true;
      }
      if (!inside) {
        // Strut from the tail up to the wing.
        if (Math.abs(x - wingX) <= thin && y >= strutTop && y <= floor - size * 0.4) inside = true;
      }
      if (!inside) {
        const dx = x - wingX;
        const dy = y - wingY;
        const bx = dx * cos + dy * sin;
        const by = -dx * sin + dy * cos;
        // Flip vertically so the camber points down, like a racing car's wing.
        if (wing(bx, -by)) inside = true;
      }
      if (inside) mask[y * nx + x] = 1;
    }
  }
  return mask;
}

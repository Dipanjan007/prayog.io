/**
 * Multiple images in two mirrors, and focusing sunlight, for the Class 8
 * "Light: Mirrors and Lenses" second lab (kaleidoscope and burning spot).
 * Pure functions, so they can be unit tested.
 *
 * Hinged mirrors: seen from above, mirror 1 lies along angle 0 and mirror 2 along angle θ,
 * meeting at the hinge (the origin). The object sits inside the wedge at angle φ (0 < φ < θ).
 * Images form by bouncing light off one mirror, then the other, and so on. A chain of images
 * that starts with mirror 1 keeps going while (k − 1)θ + φ < 180°, and the same for the chain
 * that starts with mirror 2 with θ − φ in place of φ. When 360 ÷ θ is even the last images of
 * the two chains land on the same spot, so they count once. This gives the textbook rule:
 * n = 360 ÷ θ − 1 images, except when 360 ÷ θ is odd and the object is off-centre (then 360 ÷ θ).
 *
 * Sunlight: the Sun is a disc 0.53° across, so even a perfect lens makes a small spot of radius
 * f × 0.00465 at its focus, not a point. Away from the focus the spot is a blurred circle of
 * radius (D ÷ 2) × |1 − d ÷ f| on top of that.
 */

export type Vec = { x: number; y: number };

const EPS = 1e-9;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Hinge angles on the bench, in degrees. Each divides 360 exactly. */
export const ANGLES = [180, 120, 90, 72, 60, 45, 40, 36, 30] as const;
/** Where the object sits across the wedge: 0.5 is exactly in the middle. */
export const POSITIONS = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] as const;

/** Reflect a point in a mirror line through the origin at the given angle (degrees). */
export function reflect(p: Vec, lineDeg: number): Vec {
  const c = Math.cos(rad(2 * lineDeg));
  const s = Math.sin(rad(2 * lineDeg));
  return { x: c * p.x + s * p.y, y: s * p.x - c * p.y };
}

/** Which mirror each bounce uses, in the order the light meets them. 1 lies along 0°, 2 along θ. */
export type Bounce = 1 | 2;

/** Reflect a point in each mirror of the chain in turn, building the image it makes. */
export function applyChain(p: Vec, chain: Bounce[], thetaDeg: number): Vec {
  return chain.reduce((q, m) => reflect(q, m === 1 ? 0 : thetaDeg), p);
}

/** Angle of a point from mirror 1, between 0 and 360 degrees. */
const angleOf = (p: Vec) => {
  const a = (Math.atan2(p.y, p.x) * 180) / Math.PI;
  return a < 0 ? a + 360 : a;
};

/** Every image the two mirrors form, as the bounce chain that makes it and its angle round the hinge. */
export function hingeImages(thetaDeg: number, phiDeg: number): { chain: Bounce[]; angle: number }[] {
  const obj = { x: Math.cos(rad(phiDeg)), y: Math.sin(rad(phiDeg)) };
  const out: { chain: Bounce[]; angle: number }[] = [];
  for (const [first, start] of [
    [1, phiDeg],
    [2, thetaDeg - phiDeg],
  ] as const) {
    const chain: Bounce[] = [];
    for (let k = 1; (k - 1) * thetaDeg + start < 180 - EPS; k++) {
      chain.push(chain.length ? (chain[chain.length - 1] === 1 ? 2 : 1) : first);
      const angle = angleOf(applyChain(obj, chain, thetaDeg));
      const same = out.some((o) => Math.abs(((o.angle - angle + 540) % 360) - 180) < 1e-6);
      if (!same) out.push({ chain: [...chain], angle });
    }
  }
  return out;
}

/** How many images you see of an object at a fraction of the way across the wedge. */
export const imageCount = (thetaDeg: number, position: number) => hingeImages(thetaDeg, thetaDeg * position).length;

/** The textbook rule, n = 360 ÷ θ − 1. */
export const formulaCount = (thetaDeg: number) => 360 / thetaDeg - 1;

/**
 * Parallel mirrors at x = 0 and x = gap, object at x0 between them.
 * Returns the image positions nearest first: they go on forever, each a bit dimmer.
 */
export function parallelImages(gap: number, x0: number, perSide: number): { x: number; bounces: number }[] {
  const out: { x: number; bounces: number }[] = [];
  // Chain starting at the left mirror: −x0, 2gap + x0, −2gap − x0, ... and the one starting at the right.
  let a = x0;
  let b = x0;
  for (let k = 1; k <= perSide; k++) {
    a = k % 2 ? -a : 2 * gap - a;
    b = k % 2 ? 2 * gap - b : -b;
    out.push({ x: a, bounces: k }, { x: b, bounces: k });
  }
  return out;
}

/** Light losses: a glass lens lets most light through; a polished dish reflects a bit less. */
export const FOCUSERS = {
  lens: { label: "Magnifying glass", kind: "convex lens", f: 0.15, aperture: 0.06, efficiency: 0.9, min: 0.02, max: 0.4, step: 0.005 },
  dish: { label: "Solar cooker dish", kind: "concave mirror", f: 0.4, aperture: 0.6, efficiency: 0.8, min: 0.05, max: 0.8, step: 0.01 },
} as const;
export type FocuserId = keyof typeof FOCUSERS;

/** Half the angle the Sun's disc makes in the sky (0.53° across), in radians. */
export const SUN_HALF_ANGLE = 0.00465;
export const AMBIENT_C = 30;
/** Paper starts to char and catch fire at about 230 °C. */
export const CHAR_C = 230;
/** Each "sun" of concentration raises the card's steady temperature by this much. */
export const C_PER_SUN = 7;
/** How quickly the card warms towards its steady temperature, in seconds. */
export const WARM_TAU = 1.5;

/** Radius (m) of the bright spot on a card held d metres from a lens or mirror of focal length f. */
export const spotRadius = (f: number, aperture: number, d: number) => (aperture / 2) * Math.abs(1 - d / f) + d * SUN_HALF_ANGLE;

/** How many times brighter than plain sunlight the spot is. */
export function concentration(id: FocuserId, d: number) {
  const fo = FOCUSERS[id];
  return fo.efficiency * (fo.aperture / 2 / spotRadius(fo.f, fo.aperture, d)) ** 2;
}

/** The temperature the card would settle at, in °C. */
export const steadyTemp = (conc: number) => AMBIENT_C + C_PER_SUN * conc;

/** Warm (or cool) the card for dt seconds. */
export const warm = (temp: number, conc: number, dt: number) => temp + (steadyTemp(conc) - temp) * (1 - Math.exp(-dt / WARM_TAU));

/** Seconds for a cold card to start charring, or Infinity if this spot never gets hot enough. */
export function timeToChar(conc: number) {
  const rise = steadyTemp(conc) - AMBIENT_C;
  const need = CHAR_C - AMBIENT_C;
  return rise <= need ? Infinity : -WARM_TAU * Math.log(1 - need / rise);
}

/** Challenge rounds: make exactly this many images. */
export const ROUNDS = [
  { target: 7, name: "Seven bangles", hint: "Use n = 360 ÷ θ − 1 to find the angle." },
  { target: 11, name: "A crowd of eleven", hint: "Smaller angles give more images." },
  { target: 4, name: "The odd one", hint: "No angle on the bench gives 4 with the formula. When 360 ÷ θ is odd, try moving the bangle." },
] as const;

/** Every angle and position that makes the target number of images. */
export function solutions(target: number) {
  return ANGLES.flatMap((a) => POSITIONS.filter((p) => imageCount(a, p) === target).map((p) => ({ angle: a, position: p })));
}

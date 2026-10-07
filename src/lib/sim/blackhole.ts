/**
 * Gravity and black holes: surface gravity, escape speed, the Schwarzschild radius,
 * what a dead star core becomes, how light bends near a black hole, and tidal stretch.
 * SI units throughout unless a name says otherwise.
 */

/** Gravitational constant (N m² / kg²). */
export const G = 6.674e-11;
/** Speed of light (m/s). */
export const C = 2.998e8;
/** Standard gravity at Earth's surface (m/s²), used to express g in "Earth g's". */
export const G_EARTH = 9.81;

export const M_SUN = 1.989e30;
export const R_SUN = 6.957e8;
export const M_EARTH = 5.972e24;
export const R_EARTH = 6.371e6;

export type BodyId = "earth" | "sun" | "star20";

export const BODIES: Record<BodyId, { label: string; mass: number; radius: number }> = {
  earth: { label: "Earth", mass: M_EARTH, radius: R_EARTH },
  sun: { label: "Sun", mass: M_SUN, radius: R_SUN },
  /** A 20-solar-mass star in the prime of its life is roughly 7 times as wide as the Sun. */
  star20: { label: "Big star (20 Suns)", mass: 20 * M_SUN, radius: 7 * R_SUN },
};

/** Surface gravity g = GM / R² (m/s²). */
export function surfaceGravity(mass: number, radius: number) {
  return (G * mass) / (radius * radius);
}

/** Escape speed v = √(2GM / R) (m/s), the launch speed needed to never fall back (ignoring air). */
export function escapeSpeed(mass: number, radius: number) {
  return Math.sqrt((2 * G * mass) / radius);
}

/** Schwarzschild radius r_s = 2GM / c² (m): squeeze the mass inside this and it is a black hole. */
export function schwarzschildRadius(mass: number) {
  return (2 * G * mass) / (C * C);
}

/** True once the body fits inside its own Schwarzschild radius. */
export function isBlackHole(mass: number, radius: number) {
  return radius <= schwarzschildRadius(mass);
}

/** Approximate dividing lines (in Suns) between the three kinds of dead star core. */
export const CHANDRASEKHAR_LIMIT = 1.4;
/** The heaviest a neutron star can be is not known exactly; about 2 to 3 Suns. */
export const NEUTRON_STAR_LIMIT = 3;

export type Remnant = "white-dwarf" | "neutron-star" | "black-hole";

/** What a dead core of this mass (in Suns) becomes, using the approximate limits. */
export function remnantFate(coreSuns: number): Remnant {
  if (coreSuns < CHANDRASEKHAR_LIMIT) return "white-dwarf";
  if (coreSuns < NEUTRON_STAR_LIMIT) return "neutron-star";
  return "black-hole";
}

/** Light aimed closer than this many Schwarzschild radii (3√3 / 2 ≈ 2.6) falls in. It sets the size of the black hole's shadow. */
export const CAPTURE_B = (3 * Math.sqrt(3)) / 2;
/** Light can circle the black hole at 1.5 r_s, the photon sphere. */
export const PHOTON_SPHERE = 1.5;

export interface LightPath {
  /** Points in units of r_s, black hole at the origin. The ray starts far to the left, moving right, b above the centre. */
  points: [number, number][];
  captured: boolean;
  /** How far the escaping ray was turned from a straight line (radians). 0 when captured. */
  deflection: number;
  /** Closest distance to the centre, in r_s (1 when captured). */
  closest: number;
}

/**
 * Traces a ray of light past a non-spinning black hole using the exact orbit equation
 * d²u/dφ² = −u + (3/2)u², with u = r_s / r. b is the aim distance (impact parameter) in r_s.
 */
export function lightPath(b: number, opts: { start?: number; dphi?: number; maxTurns?: number } = {}): LightPath {
  const start = opts.start ?? Math.max(30, 40 * b);
  const h = opts.dphi ?? 0.002;
  const maxPhi = Math.PI * 2 * (opts.maxTurns ?? 3);
  // Far away the ray is a straight line, u = sin φ / b.
  let phi = Math.asin(Math.min(1, b / start));
  let u = Math.sin(phi) / b;
  let w = Math.cos(phi) / b;
  const acc = (x: number) => -x + 1.5 * x * x;
  const pt = (uu: number, p: number): [number, number] => [-Math.cos(p) / uu, Math.sin(p) / uu];
  const points: [number, number][] = [pt(u, phi)];
  let uMax = u;
  let captured = false;
  let n = 0;
  while (phi < maxPhi) {
    const k1u = w;
    const k1w = acc(u);
    const k2u = w + (h / 2) * k1w;
    const k2w = acc(u + (h / 2) * k1u);
    const k3u = w + (h / 2) * k2w;
    const k3w = acc(u + (h / 2) * k2u);
    const k4u = w + h * k3w;
    const k4w = acc(u + h * k3u);
    const nu = u + (h / 6) * (k1u + 2 * k2u + 2 * k3u + k4u);
    const nw = w + (h / 6) * (k1w + 2 * k2w + 2 * k3w + k4w);
    if (nu >= 1) {
      // Crossed the horizon: finish the point on it.
      const f = (1 - u) / (nu - u);
      phi += f * h;
      points.push(pt(1, phi));
      captured = true;
      break;
    }
    if (nu <= 0) {
      // Back out to infinity: the angle where u reaches 0.
      phi += (u / (u - nu)) * h;
      u = 0;
      break;
    }
    u = nu;
    w = nw;
    phi += h;
    uMax = Math.max(uMax, u);
    if (++n % 4 === 0) points.push(pt(u, phi));
    if (w < 0 && u < 1 / start) break;
  }
  if (!captured && phi < maxPhi) {
    // Far out the ray is straight again: u falls to 0 at φ∞ ≈ φ + u / |w|.
    if (u > 0) phi += u / Math.abs(w);
    // Run the ray out along its final direction so it leaves the picture.
    const [lx, ly] = points[points.length - 1];
    const run = Math.max(start, 60);
    points.push([lx - Math.cos(phi) * run, ly + Math.sin(phi) * run]);
  }
  return {
    points,
    captured: captured || phi >= maxPhi,
    deflection: captured ? 0 : phi - Math.PI,
    closest: captured ? 1 : 1 / uMax,
  };
}

/** Weak-field bending angle 2r_s / b (radians), good when the ray passes far away. */
export function weakDeflection(bOverRs: number) {
  return 2 / bOverRs;
}

/**
 * Tidal stretch (m/s²): the difference in pull between your head and feet,
 * Δa ≈ 2GM·L / r³, for a body of length L at distance r from the centre.
 */
export function tidalStretch(mass: number, r: number, length = 1.8) {
  return (2 * G * mass * length) / (r * r * r);
}

/** Is a guessed radius (same units as the truth) within a fractional tolerance? */
export function radiusGuessOk(guess: number, truth: number, tol: number) {
  return Number.isFinite(guess) && guess > 0 && Math.abs(guess - truth) <= tol * truth;
}

const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };

/** Short number for readouts: 3 significant figures, or "1.23 × 10⁹" when very big or small. */
export function sci(x: number, sig = 3) {
  if (x === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e < 6) {
    const d = Math.max(0, sig - 1 - e);
    return x.toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: 0 });
  }
  const m = x / 10 ** e;
  return `${m.toFixed(sig - 1)} × 10${String(e)
    .split("")
    .map((ch) => SUP[ch])
    .join("")}`;
}

/** A length in metres, in the friendliest unit (mm, cm, m, km, or millions of km). */
export function formatLength(m: number) {
  const a = Math.abs(m);
  if (a < 0.01) return `${sci(m * 1000)} mm`;
  if (a < 1) return `${sci(m * 100)} cm`;
  if (a < 1000) return `${sci(m)} m`;
  if (a < 1e9) return `${sci(m / 1000)} km`;
  return `${sci(m / 1e9)} million km`;
}

/** Something about as wide as a ball of this radius (m), for a feel of the size. */
export function sizeLike(radius: number) {
  const d = 2 * radius;
  if (d < 0.0005) return "smaller than a grain of sand";
  if (d < 0.004) return "about a grain of rice";
  if (d < 0.03) return "about a marble";
  if (d < 0.3) return "about a cricket ball";
  if (d < 3) return "about a car";
  if (d < 300) return "about a cricket ground";
  if (d < 30e3) return "about a city";
  if (d < 1e6) return "about a state";
  if (d < 2e7) return "about a planet like Earth";
  if (d < 2e8) return "about Jupiter";
  return "bigger than Jupiter";
}

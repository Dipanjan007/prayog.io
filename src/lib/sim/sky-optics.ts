/**
 * Optics of the atmosphere for the Class 10 "The Human Eye and the Colourful World" sky lab:
 * scattering (Rayleigh's 1/λ⁴ law, the Tyndall effect), the colour of the sky and the Sun,
 * atmospheric refraction (twinkling, early sunrise, the flattened Sun) and the rainbow.
 * Pure functions, so they can be unit tested.
 */

export type RGB = [number, number, number];

/** Wavelengths (nm) used for the red, green and blue channels when we turn light into a colour. */
export const CHANNEL_NM: RGB = [650, 550, 450];

const DEG = Math.PI / 180;

// ---------- Scattering ----------

/** Rayleigh's law: how many times more a tiny particle scatters wavelength λ1 than λ2. */
export function rayleighRatio(lambda1Nm: number, lambda2Nm: number) {
  return (lambda2Nm / lambda1Nm) ** 4;
}

/** Size parameter x = 2πr/λ: how big a particle is compared with the wavelength of light. */
export function sizeParameter(radiusNm: number, lambdaNm: number) {
  return (2 * Math.PI * radiusNm) / lambdaNm;
}

/**
 * Scattering strength per particle, as a fraction of its large-particle limit.
 * A smooth bridge between the two textbook limits: for x ≪ 1 it grows as x⁴ (Rayleigh, ∝ 1/λ⁴);
 * for x ≫ 1 it levels off and no longer depends on colour, so big drops scatter white light.
 * Real particles (Mie scattering) add wiggles on top of this curve.
 */
export function scatterEfficiency(lambdaNm: number, radiusNm: number) {
  const x4 = sizeParameter(radiusNm, lambdaNm) ** 4;
  return x4 / (1 + x4);
}

/** The power n in "scattering ∝ 1/λⁿ" for this particle size: 4 for tiny particles, near 0 for big ones. */
export function colourExponent(radiusNm: number, lambdaNm = 550) {
  return 4 / (1 + sizeParameter(radiusNm, lambdaNm) ** 4);
}

/** Optical depth of the tank at 550 nm per metre of path (the milk dose is set to keep it equally cloudy). */
export const TANK_TAU_PER_M = 1.6;

/** Optical depth of the tank for each colour channel after a path of z metres. */
export function tankDepth(radiusNm: number, z: number): RGB {
  const ref = scatterEfficiency(550, radiusNm);
  return CHANNEL_NM.map((l) => (TANK_TAU_PER_M * z * scatterEfficiency(l, radiusNm)) / ref) as RGB;
}

/** Light scattered sideways out of the beam at a distance z into the tank (before normalising). */
export function tankSideLight(radiusNm: number, z: number): RGB {
  const ref = scatterEfficiency(550, radiusNm);
  const tau = tankDepth(radiusNm, z);
  return CHANNEL_NM.map((l, i) => (scatterEfficiency(l, radiusNm) / ref) * Math.exp(-tau[i])) as RGB;
}

/** White light left in the beam after the whole tank (what lands on the screen at the far end). */
export function tankEndLight(radiusNm: number, lengthM: number): RGB {
  return tankDepth(radiusNm, lengthM).map((t) => Math.exp(-t)) as RGB;
}

/** Scale a colour so its brightest channel is 1. Black stays black. */
export function normalise(c: RGB): RGB {
  const m = Math.max(c[0], c[1], c[2]);
  return m > 0 ? (c.map((v) => v / m) as RGB) : [0, 0, 0];
}

export type Hue = "blue" | "red" | "white" | "other";

/** A rough name for a colour, used to check missions. */
export function hueOf(c: RGB): Hue {
  const [r, g, b] = normalise(c);
  if (r === 0 && g === 0 && b === 0) return "other";
  if (Math.min(r, g, b) >= 0.75) return "white";
  if (b === 1 && r <= 0.6) return "blue";
  if (r === 1 && g <= 0.55 && b <= 0.3) return "red";
  return "other";
}

// ---------- Sky colour ----------

/**
 * Rayleigh optical depth of the whole atmosphere straight up (sea level), λ in nm.
 * Hansen and Travis (1974): τ = 0.008569 λ⁻⁴ (1 + 0.0113 λ⁻² + 0.00013 λ⁻⁴), λ in µm.
 */
export function rayleighDepth(lambdaNm: number) {
  const l = lambdaNm / 1000;
  return 0.008569 * l ** -4 * (1 + 0.0113 * l ** -2 + 0.00013 * l ** -4);
}

/** Air mass: how many times more air light crosses at this altitude than from straight overhead (Kasten and Young, 1989). */
export function airMass(altDeg: number) {
  const z = 90 - Math.max(0, Math.min(90, altDeg));
  return 1 / (Math.cos(z * DEG) + 0.50572 * (96.07995 - z) ** -1.6364);
}

/** Thickness of the atmosphere if all of it were squeezed to sea-level density (km). */
export const AIR_THICKNESS_KM = 8;

/** Length of the path sunlight takes through the air, in "sea-level kilometres". */
export function airPathKm(sunAltDeg: number) {
  return AIR_THICKNESS_KM * airMass(sunAltDeg);
}

/** Colour of the Sun's disc: the white light that is not scattered away on the way down. */
export function sunLight(sunAltDeg: number, air = 1): RGB {
  const m = airMass(sunAltDeg);
  return CHANNEL_NM.map((l) => Math.exp(-air * rayleighDepth(l) * m)) as RGB;
}

/**
 * Sky brightness in a direction viewElevDeg above the horizon (single scattering).
 * Sunlight is dimmed on its way in (sun's air mass), then part of it is scattered toward you
 * along your line of sight. With no air there is nothing to scatter and the sky is black.
 */
export function skyLight(sunAltDeg: number, viewElevDeg: number, air = 1): RGB {
  const ms = airMass(sunAltDeg);
  const mv = airMass(viewElevDeg);
  return CHANNEL_NM.map((l) => {
    const t = air * rayleighDepth(l);
    return Math.exp(-t * ms) * (1 - Math.exp(-t * mv));
  }) as RGB;
}

// ---------- Atmospheric refraction ----------

/** Angular diameter of the Sun (degrees). */
export const SUN_DIAMETER_DEG = 0.533;

/**
 * Bending of light by the air (arcminutes) for an object at true altitude h (degrees),
 * at sea level in normal weather (Sæmundsson, 1986).
 */
export function refractionArcmin(trueAltDeg: number) {
  const h = trueAltDeg;
  return 1.02 / Math.tan((h + 10.3 / (h + 5.11)) * DEG);
}

/** Where the object appears: a little higher than it really is. */
export function apparentAltitude(trueAltDeg: number, air = 1) {
  return trueAltDeg + (air * refractionArcmin(trueAltDeg)) / 60;
}

/** True altitude (degrees, negative) at which an object just appears on the horizon. */
export function trueAltitudeAtHorizon() {
  let lo = -3;
  let hi = 0;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (apparentAltitude(mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Latitude of Mumbai (degrees north), used for the sunrise clock. */
export const MUMBAI_LAT = 19.08;

/** How fast the Sun climbs at the horizon (degrees per minute) on an equinox day at this latitude. */
export function sunClimbRate(latDeg: number) {
  return (360 / (24 * 60)) * Math.cos(latDeg * DEG);
}

/** Minutes by which the air makes the Sun appear before it geometrically rises (and set after it has set). */
export function sunriseAdvanceMinutes(latDeg: number) {
  return -trueAltitudeAtHorizon() / sunClimbRate(latDeg);
}

/**
 * Height ÷ width of the Sun's disc as you see it. The lower edge is lifted more than
 * the upper edge, so near the horizon the Sun looks squashed.
 */
export function sunSquash(centreTrueAltDeg: number, air = 1) {
  const r = SUN_DIAMETER_DEG / 2;
  return (apparentAltitude(centreTrueAltDeg + r, air) - apparentAltitude(centreTrueAltDeg - r, air)) / SUN_DIAMETER_DEG;
}

/**
 * Twinkling. Moving pockets of warm and cool air bend light by slightly different amounts.
 * A star is a point, so all its light takes one wobbly path and the brightness jumps about.
 * A planet is a small disc made of many points; their wobbles average out (roughly as 1/√N).
 * patchArcsec is the size of sky over which the air bends light the same way.
 * Returns the relative flicker for a source of this angular diameter (1 = full twinkle).
 */
export function flickerAmplitude(angularDiameterArcsec: number, patchArcsec = 1) {
  return 1 / Math.sqrt(1 + (angularDiameterArcsec / patchArcsec) ** 2);
}

/** Angular diameters seen from Earth (arcseconds): Sirius, the brightest star, and Jupiter at a typical distance. */
export const SIRIUS_ARCSEC = 0.006;
export const JUPITER_ARCSEC = 40;

// ---------- Rainbow ----------

/** Refractive index of water for light of wavelength λ (nm), a Cauchy fit: 1.331 for red, 1.343 for violet. */
export function waterIndex(lambdaNm: number) {
  return 1.3242 + 3090 / lambdaNm ** 2;
}

/** VIBGYOR, with a typical wavelength (nm) and a colour to draw it. */
export const SPECTRUM = [
  { name: "Violet", nm: 400, css: "#a78bfa" },
  { name: "Indigo", nm: 440, css: "#818cf8" },
  { name: "Blue", nm: 475, css: "#60a5fa" },
  { name: "Green", nm: 520, css: "#4ade80" },
  { name: "Yellow", nm: 575, css: "#facc15" },
  { name: "Orange", nm: 610, css: "#fb923c" },
  { name: "Red", nm: 700, css: "#f87171" },
] as const;

/** Total turn (degrees) of a ray that enters a drop at angle i, reflects once inside and leaves. */
export function primaryDeviation(incidenceDeg: number, n: number) {
  const i = incidenceDeg * DEG;
  const r = Math.asin(Math.sin(i) / n);
  return (Math.PI + 2 * i - 4 * r) / DEG;
}

/**
 * Rainbow angle: the angle between the light coming out and the line back to the anti-solar point.
 * Many rays bunch up at the minimum deviation, where cos²i = (n² − 1)/3.
 */
export function rainbowAngle(n: number) {
  const i = Math.acos(Math.sqrt((n * n - 1) / 3)) / DEG;
  return 180 - primaryDeviation(i, n);
}

export const RED_BOW_DEG = rainbowAngle(waterIndex(700));
export const VIOLET_BOW_DEG = rainbowAngle(waterIndex(400));

type V2 = { x: number; y: number };

/** Refract direction d (unit) at a surface with unit normal nrm pointing against d, from index n1 into n2. */
export function refract(d: V2, nrm: V2, n1: number, n2: number): V2 | null {
  const eta = n1 / n2;
  const cosI = -(d.x * nrm.x + d.y * nrm.y);
  const k = 1 - eta * eta * (1 - cosI * cosI);
  if (k < 0) return null;
  const f = eta * cosI - Math.sqrt(k);
  return { x: eta * d.x + f * nrm.x, y: eta * d.y + f * nrm.y };
}

export function reflect(d: V2, nrm: V2): V2 {
  const dot = d.x * nrm.x + d.y * nrm.y;
  return { x: d.x - 2 * dot * nrm.x, y: d.y - 2 * dot * nrm.y };
}

/** From a point p on the unit circle, travelling along d inside it, find where the ray hits the circle again. */
function chordEnd(p: V2, d: V2): V2 {
  const t = -2 * (p.x * d.x + p.y * d.y);
  return { x: p.x + t * d.x, y: p.y + t * d.y };
}

/**
 * Trace a sunbeam through a round raindrop of radius 1 centred at the origin (y up).
 * Sunlight travels in +x and hits the drop a height b (0 to 1) above its centre.
 * It refracts in, reflects once off the back, and refracts out.
 * Returns the three points on the drop, the exit direction and the elevation (degrees)
 * at which a person standing with the Sun behind them would see this light.
 */
export function traceDrop(b: number, n: number) {
  const d0 = { x: 1, y: 0 };
  const p1 = { x: -Math.sqrt(1 - b * b), y: b };
  const d1 = refract(d0, p1, 1, n)!;
  const p2 = chordEnd(p1, d1);
  const d2 = reflect(d1, { x: -p2.x, y: -p2.y });
  const p3 = chordEnd(p2, d2);
  const d3 = refract(d2, { x: -p3.x, y: -p3.y }, n, 1)!;
  const elevation = Math.atan2(-d3.y, -d3.x) / DEG;
  return { p1, p2, p3, exit: d3, elevation };
}

export interface RainScene {
  /** Sun's height above the horizon (degrees). */
  sunAlt: number;
  /** True when the Sun is on the left of the picture, so its light travels to the right. */
  sunOnLeft: boolean;
  /** Observer's position along the ground. */
  observerX: number;
  /** Rain falls between x0 and x1, from the ground up to the cloud at height top (same units as x). */
  rain: { x0: number; x1: number; top: number };
}

export type RainbowReason = "ok" | "sun-in-front" | "no-rain-behind" | "sun-too-high" | "above-cloud";

/**
 * Can the observer see a rainbow? The bow is a circle of about 42° around the anti-solar point,
 * the point straight opposite the Sun, below the horizon by the Sun's altitude.
 * So the top of the red bow sits (42° − sun altitude) above the horizon, on the side away from the Sun.
 */
export function rainbowView(s: RainScene): { visible: boolean; reason: RainbowReason; elevation: number; hitX: number | null } {
  const elevation = RED_BOW_DEG - s.sunAlt;
  const dir = s.sunOnLeft ? 1 : -1;
  const ahead = (sign: number) => {
    if (sign > 0) return s.rain.x1 >= s.observerX ? Math.max(s.rain.x0, s.observerX) : null;
    return s.rain.x0 <= s.observerX ? Math.min(s.rain.x1, s.observerX) : null;
  };
  const near = ahead(dir);
  if (near === null) return { visible: false, reason: ahead(-dir) !== null ? "sun-in-front" : "no-rain-behind", elevation, hitX: null };
  if (elevation <= 0) return { visible: false, reason: "sun-too-high", elevation, hitX: null };
  const height = Math.abs(near - s.observerX) * Math.tan(elevation * DEG);
  if (height >= s.rain.top) return { visible: false, reason: "above-cloud", elevation, hitX: null };
  return { visible: true, reason: "ok", elevation, hitX: near };
}

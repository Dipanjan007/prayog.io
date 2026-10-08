/**
 * Water cycle physics for the Class 7 "Heat Transfer in Nature" second lab.
 * Pure functions, so they can be unit tested. Temperatures in °C, humidity as a fraction (0 to 1).
 *
 * Models used (all standard, simple ones):
 * - Saturation vapour pressure: the Tetens / Magnus formula.
 * - Dew point: the inverse of the Magnus formula.
 * - Cloud base: Espy's rule, about 125 m of height for every °C between air temperature and dew point.
 * - Evaporation: Dalton's law with the Penman wind function, E = 2.6 (1 + 0.54 u)(e_s − e_a) mm/day.
 * - Wet-bulb temperature: Stull's (2011) formula. A wet cloth in the shade and the water in a
 *   matka cool towards it.
 * - Rain on the hills: moist sea air forced up a 1200 m slope cools; the vapour it can no longer
 *   hold falls as rain on the slope facing the wind.
 */

/** Gas constant for water vapour, J/(kg·K). */
export const R_VAPOUR = 461.5;
/** Rising air without cloud cools by about 9.8 °C per km. */
export const DRY_LAPSE = 9.8;
/** Inside a cloud, condensation releases heat, so rising air cools more slowly: about 6 °C per km here. */
export const MOIST_LAPSE = 6;
/** Espy's rule: metres of cloud base per °C of (temperature − dew point). */
export const ESPY_M_PER_C = 125;

/** Saturation vapour pressure over water, kPa (Tetens). */
export function satVapourPressure(T: number) {
  return 0.6108 * Math.exp((17.27 * T) / (T + 237.3));
}

/** Water vapour density of air, g/m³, at temperature T and relative humidity rh. */
export function vapourDensity(T: number, rh = 1) {
  return ((rh * satVapourPressure(T) * 1000) / (R_VAPOUR * (T + 273.15))) * 1000;
}

/** The temperature at which air must be cooled for its vapour to start condensing, °C. */
export function dewPoint(T: number, rh: number) {
  const g = Math.log(Math.max(1e-6, Math.min(1, rh))) + (17.27 * T) / (T + 237.3);
  return (237.3 * g) / (17.27 - g);
}

/** Height (m) at which rising air has cooled to its dew point and a cloud starts. */
export function cloudBase(T: number, rh: number) {
  return ESPY_M_PER_C * (T - dewPoint(T, rh));
}

/** Wet-bulb temperature, °C (Stull 2011; good for 5% to 99% humidity). */
export function wetBulb(T: number, rh: number) {
  if (rh >= 0.99) return T;
  const R = Math.max(5, rh * 100);
  const tw =
    T * Math.atan(0.151977 * Math.sqrt(R + 8.313659)) +
    Math.atan(T + R) -
    Math.atan(R - 1.676331) +
    0.00391838 * Math.pow(R, 1.5) * Math.atan(0.023101 * R) -
    4.686035;
  return Math.min(T, tw);
}

/**
 * Evaporation from a wet surface, mm of water per day (= kg per m² per day).
 * Dalton's law: the drier the air and the warmer the water, the bigger the gap in vapour
 * pressure, and the wind carries the damp air away. wind in m/s.
 */
export function evaporationRate(Tsurface: number, Tair: number, rh: number, wind: number) {
  const gap = satVapourPressure(Tsurface) - rh * satVapourPressure(Tair);
  return 2.6 * (1 + 0.54 * Math.max(0, wind)) * Math.max(0, gap);
}

// ---------------------------------------------------------------------------
// The landscape: sea, a coastal plain, the Western Ghats and the plateau behind them.

export const LAND = {
  /** Height of the hills, m (the Western Ghats are about 1000 to 1500 m high). */
  hillTop: 1200,
  /** Height of the plateau behind the hills (around Pune), m. */
  plateau: 550,
  /** Thickness of the moist layer of sea air pushed up the slope, m. */
  liftDepth: 1000,
  /** Horizontal length of the slope facing the sea, m. */
  slopeRun: 30000,
};

/** How fast water can soak into the ground, mm per hour. Soil here is a clayey farm soil; concrete is sealed. */
export const INFILTRATION = { soil: 4, concrete: 0 } as const;
export type Ground = keyof typeof INFILTRATION;

/** Sea surface (and sea air) temperature for a Sun strength from 0 to 1. */
export function seaTemp(sun: number) {
  return 20 + 10 * sun;
}

/** Humidity of the air over the sea (fairly steady in the tropics). */
export const SEA_AIR_RH = 0.8;

/** Height that sun-warmed air over the sea rises to by itself (convection), m. */
export function convectionTop(sun: number) {
  return 200 + 1000 * sun;
}

export interface Landscape {
  seaT: number;
  rh: number;
  dew: number;
  /** m */
  cloudBase: number;
  /** Evaporation from the sea, mm/day. */
  evaporation: number;
  /** A cloud sits on the hills (air pushed up the slope goes above the cloud base). */
  hillCloud: boolean;
  /** Small clouds form over the sea from rising warm air alone. */
  seaCloud: boolean;
  /** Rain on the slope facing the sea, mm per hour. */
  rainHill: number;
  /** Rain on the far side of the hills, mm per hour (the rain shadow). */
  rainLee: number;
}

/**
 * Sun strength from 0 to 1; wind in m/s, blowing from the sea towards the hills (like the monsoon).
 * The air pushed over the hills cools at the dry rate up to the cloud base and at the moist rate
 * above it. The vapour it can no longer hold, carried in by the wind, falls on the slope.
 */
export function landscape(sun: number, wind: number): Landscape {
  const seaT = seaTemp(sun);
  const rh = SEA_AIR_RH;
  const dew = dewPoint(seaT, rh);
  const base = cloudBase(seaT, rh);
  const evaporation = evaporationRate(seaT, seaT, rh, wind);
  const lifted = wind > 0.2 && base < LAND.hillTop;
  let rainHill = 0;
  if (lifted) {
    const Tbase = seaT - (DRY_LAPSE * base) / 1000;
    const Ttop = Tbase - (MOIST_LAPSE * (LAND.hillTop - base)) / 1000;
    const dropped = (vapourDensity(Tbase) - vapourDensity(Ttop)) / 1000; // kg/m³
    rainHill = ((wind * LAND.liftDepth * dropped) / LAND.slopeRun) * 3600; // kg/m²/h = mm/h
  }
  return {
    seaT,
    rh,
    dew,
    cloudBase: base,
    evaporation,
    hillCloud: lifted,
    seaCloud: convectionTop(sun) > base,
    rainHill,
    rainLee: 0,
  };
}

/**
 * Air coming down the far side of the hills warms at the dry rate, so its temperature climbs far
 * above its dew point: no cloud, no rain. Returns the air temperature on the plateau, °C.
 */
export function leeAirTemp(sun: number) {
  const L = landscape(sun, 1);
  if (!L.hillCloud) return L.seaT - (DRY_LAPSE * LAND.plateau) / 1000;
  const Ttop = L.seaT - (DRY_LAPSE * L.cloudBase) / 1000 - (MOIST_LAPSE * (LAND.hillTop - L.cloudBase)) / 1000;
  return Ttop + (DRY_LAPSE * (LAND.hillTop - LAND.plateau)) / 1000;
}

/** Split rain (mm/h) into the part that soaks into the ground and the part that runs off. */
export function infiltration(rain: number, ground: Ground) {
  const soak = Math.min(rain, INFILTRATION[ground]);
  return { soak, runoff: rain - soak };
}

// ---------------------------------------------------------------------------
// The kitchen and the balcony.

/** Water left in a wrung-out cotton shirt, kg. */
export const SHIRT_WATER = 0.3;
/** Wet area facing the air, m²: a shirt spread on a line (both sides), or folded in a heap. */
export const SHIRT_AREA = { spread: 1, folded: 0.3 } as const;
export type Hang = keyof typeof SHIRT_AREA;

/** Still indoor air still moves a little. */
export const STILL_AIR = 0.3;

/**
 * Hours for a wet shirt to dry in the shade. A wet cloth cools to the wet-bulb temperature, so
 * it evaporates at that temperature. Infinity if the air is already saturated.
 */
export function dryingHours(T: number, rh: number, fan: number, hang: Hang) {
  const perDay = evaporationRate(wetBulb(T, rh), T, rh, Math.max(STILL_AIR, fan)) * SHIRT_AREA[hang];
  return perDay > 1e-9 ? (SHIRT_WATER / perDay) * 24 : Infinity;
}

/** A clay matka does not reach the full wet-bulb temperature; about 70% of the way is typical. */
export const MATKA_EFFICIENCY = 0.7;

/** Temperature of water in a matka after a few hours, °C. */
export function matkaTemp(T: number, rh: number) {
  return T - MATKA_EFFICIENCY * (T - wetBulb(T, rh));
}

export type Drink = "matka" | "fridge" | "ice";
/** Water from the fridge, °C. Ice and water together stay at 0 °C until the ice melts. */
export const DRINK_T = { fridge: 6, ice: 0 } as const;

export function drinkTemp(d: Drink, T: number, rh: number) {
  return d === "matka" ? matkaTemp(T, rh) : DRINK_T[d];
}

/** Water from the air condenses on the outside of a tumbler colder than the dew point. */
export function tumblerSweats(tumblerT: number, T: number, rh: number) {
  return tumblerT < dewPoint(T, rh);
}

/** Weather presets for the kitchen. */
export const WEATHER = {
  mumbai: { label: "Mumbai, July", T: 29, rh: 0.88 },
  delhi: { label: "Delhi, May", T: 40, rh: 0.2 },
} as const;
export type City = keyof typeof WEATHER;

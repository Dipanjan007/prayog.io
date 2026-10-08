/**
 * Domestic electric circuits and electric power (NCERT Class 10 Science,
 * "Magnetic Effects of Electric Current" §12.4 and "Electricity" §11.8).
 * Pure functions only, so the house board, the fault bench and the bill can be tested.
 */

/** Mains supply in Indian homes: 220 V AC at 50 Hz. */
export const MAINS = { V: 220, f: 50 };

/** Days in the billing month used by the sim. */
export const DAYS_IN_MONTH = 30;

/** Example tariff in rupees per unit (kWh). Real tariffs vary by state and often rise in slabs. */
export const TARIFF_RS = 7;

/** 1 kWh in joules. */
export const J_PER_KWH = 3.6e6;

export type ApplianceId = "led" | "fan" | "tv" | "fridge" | "iron" | "geyser" | "ac" | "microwave";

export interface Appliance {
  name: string;
  emoji: string;
  /** Rated power at 220 V, in watts. */
  watts: number;
  /** Starting hours of use per day on the bill. */
  hours: number;
}

export const APPLIANCES: Record<ApplianceId, Appliance> = {
  led: { name: "LED bulb", emoji: "💡", watts: 9, hours: 6 },
  fan: { name: "Ceiling fan", emoji: "🌀", watts: 75, hours: 10 },
  tv: { name: "TV", emoji: "📺", watts: 100, hours: 4 },
  fridge: { name: "Fridge", emoji: "🧊", watts: 200, hours: 8 },
  iron: { name: "Iron", emoji: "👕", watts: 1000, hours: 0.5 },
  geyser: { name: "Geyser", emoji: "🚿", watts: 2000, hours: 1 },
  ac: { name: "AC", emoji: "❄️", watts: 1500, hours: 0 },
  microwave: { name: "Microwave", emoji: "🍲", watts: 1200, hours: 0.5 },
};

export const APPLIANCE_IDS = Object.keys(APPLIANCES) as ApplianceId[];

/** The two house circuits and their MCB ratings in amperes. */
export const CIRCUITS = {
  light: { label: "Lighting circuit", rating: 5 },
  power: { label: "Power circuit", rating: 15 },
} as const;
export type CircuitId = keyof typeof CIRCUITS;

/** P = V I, so I = P / V. */
export function currentDrawn(watts: number, volts = MAINS.V) {
  return watts / volts;
}

export function powerVI(volts: number, amps: number) {
  return volts * amps;
}

export function powerI2R(amps: number, ohms: number) {
  return amps * amps * ohms;
}

export function powerV2R(volts: number, ohms: number) {
  return (volts * volts) / ohms;
}

/** Resistance of a heating appliance at its rated voltage: R = V² / P. */
export function resistanceOf(watts: number, volts = MAINS.V) {
  return (volts * volts) / watts;
}

/**
 * Appliances in a house are in parallel. Each gets the full mains voltage,
 * and the currents add up in the circuit's live wire.
 */
export function circuitCurrent(watts: number[], volts = MAINS.V) {
  return watts.reduce((sum, p) => sum + currentDrawn(p, volts), 0);
}

/** A fuse or MCB breaks the circuit when the current is more than its rating. */
export function overloaded(amps: number, rating: number) {
  return amps > rating;
}

/** Standard fuse and MCB ratings in amperes. */
export const FUSE_RATINGS = [1, 2, 3, 5, 10, 15, 20, 30];

/** The right fuse: the smallest standard rating that is a little more than the normal current. */
export function fuseFor(amps: number) {
  return FUSE_RATINGS.find((r) => r > amps) ?? null;
}

/** Energy in kWh (units): power in kW times hours. */
export function energyKWh(watts: number, hours: number) {
  return (watts / 1000) * hours;
}

export function kWhToJ(kWh: number) {
  return kWh * J_PER_KWH;
}

export function monthlyUnits(watts: number, hoursPerDay: number, days = DAYS_IN_MONTH) {
  return energyKWh(watts, hoursPerDay * days);
}

export function billRs(units: number, tariff = TARIFF_RS) {
  return units * tariff;
}

export type Hours = Record<ApplianceId, number>;

export function defaultHours(): Hours {
  return Object.fromEntries(APPLIANCE_IDS.map((id) => [id, APPLIANCES[id].hours])) as Hours;
}

/** Units used by each appliance over a month, and the total. */
export function monthReport(hours: Hours, days = DAYS_IN_MONTH, tariff = TARIFF_RS) {
  const units = Object.fromEntries(APPLIANCE_IDS.map((id) => [id, monthlyUnits(APPLIANCES[id].watts, hours[id], days)])) as Record<ApplianceId, number>;
  const total = APPLIANCE_IDS.reduce((s, id) => s + units[id], 0);
  const most = Math.max(...APPLIANCE_IDS.map((id) => units[id]));
  const top = APPLIANCE_IDS.filter((id) => most > 0 && Math.abs(units[id] - most) < 1e-9);
  return { units, total, bill: billRs(total, tariff), top };
}

/** Resistances used on the fault bench (ohms). Typical, rounded values. */
export const FAULT_OHMS = {
  /** House wiring from the board to a socket and back: live plus neutral. */
  wiringLoop: 0.5,
  /** Earth wire plus the earth electrode buried in the ground. */
  earthPath: 2,
  /** A person from hand to feet. It varies a lot; damp skin lowers it. */
  body: 1000,
};

/** Short circuit: live touches neutral, so only the tiny wiring resistance limits the current. */
export function shortCircuitCurrent(volts = MAINS.V, ohms = FAULT_OHMS.wiringLoop) {
  return volts / ohms;
}

/** Live touches an earthed metal body: a big current rushes down the earth wire. */
export function earthFaultCurrent(volts = MAINS.V, ohms = FAULT_OHMS.earthPath) {
  return volts / ohms;
}

/** Live touches an unearthed metal body and a person touches it: the current goes through the person. */
export function bodyCurrent(volts = MAINS.V, ohms = FAULT_OHMS.body) {
  return volts / ohms;
}

/** Currents through the body above about 30 mA can be very dangerous. RCCBs trip at 30 mA. */
export const DANGER_AMPS = 0.03;

/** Challenge: keep the month's bill under budget while giving some appliances at least the hours they need. */
export interface BudgetRound {
  name: string;
  story: string;
  budget: number;
  needs: Partial<Hours>;
}

export function budgetResult(round: BudgetRound, hours: Hours, tariff = TARIFF_RS) {
  const report = monthReport(hours, DAYS_IN_MONTH, tariff);
  const needsMet = (Object.keys(round.needs) as ApplianceId[]).every((id) => hours[id] >= (round.needs[id] ?? 0));
  return { ...report, needsMet, underBudget: report.bill <= round.budget, ok: needsMet && report.bill <= round.budget };
}

/** The least bill a round allows: only the needed hours, everything else off. */
export function minimumBill(round: BudgetRound, tariff = TARIFF_RS) {
  const hours = Object.fromEntries(APPLIANCE_IDS.map((id) => [id, round.needs[id] ?? 0])) as Hours;
  return monthReport(hours, DAYS_IN_MONTH, tariff).bill;
}

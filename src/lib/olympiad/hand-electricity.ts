/** Hand-worked answers for the electricity set (see each problem's solution). The code must agree to 0.5%. */
export const HAND_ELECTRICITY: Record<string, number> = {
  // I = 0.75 / 2.5 = 0.30 A; R = (9.0 − 2.5) / 0.30 = 21.67 Ω
  "rangoli-bulb": 21.67,
  // R = 230² / 1500 = 35.27 Ω; A = π (0.5 mm)² / 4 = 1.963e-7 m²; L = 35.27 × 1.963e-7 / 1.1e-6 = 6.295 m
  "chai-kettle-coil": 6.295,
  // r = 0.5 Ω, E = 12 V; I = 6 / 2.5 = 2.4 A; I_X = 1.4 A; X = 6 / 1.4 = 4.286 Ω
  "solar-lamp-shunt": 4.286,
};

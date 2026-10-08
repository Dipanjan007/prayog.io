/** Hand-worked answers for the fluids and buoyancy set (see each problem's solution). The code must agree to 0.5%. */
export const HAND_FLUIDS: Record<string, number> = {
  // 1440 × 9.8 × (2.5/30)² = 14112 / 144
  "service-lift": 98.0,
  // 1025 × 120 − 1000 × 30 = 123000 − 30000 kg
  "paradip-barge": 93.0,
  // ρ_k = 1000 × 10.4 / 13 = 800; ρ = (1000 × 1.8 + 800 × 3.2) / 5
  "kerosene-cube": 872,
};

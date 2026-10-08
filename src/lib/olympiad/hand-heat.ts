/** Hand-worked answers for the heat and temperature set (see each problem's solution). The code must agree to 0.5%. */
export const HAND_HEAT: Record<string, number> = {
  // 27 m = 15 × 16 = 240, so m = 240 / 27
  "winter-bath": 8.889,
  // 0.18 × 4186 × 30 = 22 604.4 J out; tumbler 0.15 × 500 × 35 = 2625 J; m = 19 979.4 / (4186 × 57)
  "chai-tumbler": 83.74,
  // Q = 1381.8 × 32 = 44 217.6 J; (44 217.6 + 0.025 × 334 000) / (334 000 + 2100 × 8) = 52 567.6 / 350 800 kg
  "sharbat-ice": 149.85,
};

/** Hand-worked answers for the gravitation and orbits set (see each problem's solution). The code must agree to 0.5%. */
export const HAND_ORBITS: Record<string, number> = {
  // h = 0.40 × (5.972e24 / 6.42e23) × (3390 / 6371)² = 0.40 × 9.302 × 0.2831 = 1.054 m
  "mars-hop": 1.054,
  // r³ = 3.986e14 × 86164² / 39.48 = 7.495e22 m³, r = 4.216e7 m, h = 42 160 − 6371 = 35 790 km
  "gsat-parking": 35790,
  // v² = 2 × 7.141e5 × (1/11 100 − 1/19 100) = 2 × 7.141e5 × 3.773e-5 = 53.89, v = 7.341 m/s
  "phobos-toss": 7.341,
};

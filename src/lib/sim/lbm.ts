/**
 * A small 2D fluid solver (lattice Boltzmann, D2Q9 with BGK collisions).
 *
 * Grid rows grow downwards, so +y is "down" on screen. Air enters on the left
 * at a fixed speed, leaves on the right, and wraps top-to-bottom. Solid cells
 * bounce air back, and the momentum they absorb gives the drag and lift forces.
 *
 * Units are lattice units: speeds stay below ~0.12 for stability. The UI maps
 * them to friendly km/h values; this is a teaching model, not a CFD tool.
 */

const EX = [0, 1, 0, -1, 0, 1, -1, -1, 1];
const EY = [0, 0, 1, 0, -1, 1, 1, -1, -1];
const W = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36];
const BOUNCE_PAIRS = [
  [1, 3],
  [2, 4],
  [5, 7],
  [6, 8],
] as const;

export const MAX_LATTICE_SPEED = 0.12;

export class FluidSim {
  readonly nx: number;
  readonly ny: number;
  readonly n: number;
  /** Distributions, laid out as f[i * n + cell]. */
  private f: Float32Array;
  private fNext: Float32Array;
  readonly rho: Float32Array;
  readonly ux: Float32Array;
  readonly uy: Float32Array;
  readonly solid: Uint8Array;
  /** Solid cells whose force is measured (e.g. the house, not the ground). */
  readonly measured: Uint8Array;
  private omega: number;
  inflow: number;
  /** Raw force on all solid cells from the last step (lattice units). */
  forceX = 0;
  forceY = 0;
  /** Smoothed forces, so vortex shedding doesn't make the readout flicker. */
  avgForceX = 0;
  avgForceY = 0;
  /** Density of the incoming air, used as "normal" pressure. */
  rhoRef = 1;
  steps = 0;

  constructor(nx: number, ny: number, inflow = 0.08, viscosity = 0.01) {
    this.nx = nx;
    this.ny = ny;
    this.n = nx * ny;
    this.f = new Float32Array(9 * this.n);
    this.fNext = new Float32Array(9 * this.n);
    this.rho = new Float32Array(this.n);
    this.ux = new Float32Array(this.n);
    this.uy = new Float32Array(this.n);
    this.solid = new Uint8Array(this.n);
    this.measured = new Uint8Array(this.n);
    this.omega = 1 / (3 * viscosity + 0.5);
    this.inflow = inflow;
    this.reset();
  }

  /** Fill the tunnel with air moving at the inflow speed. */
  reset() {
    for (let k = 0; k < this.n; k++) {
      const u = this.solid[k] ? 0 : this.inflow;
      // A tiny vertical nudge breaks symmetry so vortices start shedding.
      const v = this.solid[k] ? 0 : 0.001 * Math.sin((k % this.nx) * 0.3);
      this.setEquilibrium(k, 1, u, v);
    }
    this.avgForceX = 0;
    this.avgForceY = 0;
    this.steps = 0;
  }

  /** `measuredMask` defaults to every solid cell. */
  setSolid(mask: Uint8Array, measuredMask: Uint8Array = mask) {
    this.measured.set(measuredMask);
    for (let k = 0; k < this.n; k++) {
      const was = this.solid[k];
      this.solid[k] = mask[k];
      // Air cells uncovered by a moved shape start still.
      if (was && !mask[k]) this.setEquilibrium(k, 1, 0, 0);
    }
  }

  private setEquilibrium(k: number, rho: number, ux: number, uy: number) {
    const usq = ux * ux + uy * uy;
    for (let i = 0; i < 9; i++) {
      const cu = EX[i] * ux + EY[i] * uy;
      this.f[i * this.n + k] = W[i] * rho * (1 + 3 * cu + 4.5 * cu * cu - 1.5 * usq);
    }
    this.rho[k] = rho;
    this.ux[k] = ux;
    this.uy[k] = uy;
  }

  step(count = 1) {
    for (let s = 0; s < count; s++) this.stepOnce();
  }

  private stepOnce() {
    const { nx, ny, n, f, fNext, solid, omega } = this;

    // 1. Collide: relax each air cell towards local equilibrium.
    for (let k = 0; k < n; k++) {
      if (solid[k]) continue;
      let r = 0;
      let mx = 0;
      let my = 0;
      for (let i = 0; i < 9; i++) {
        const fi = f[i * n + k];
        r += fi;
        mx += EX[i] * fi;
        my += EY[i] * fi;
      }
      const ux = mx / r;
      const uy = my / r;
      this.rho[k] = r;
      this.ux[k] = ux;
      this.uy[k] = uy;
      const usq = 1.5 * (ux * ux + uy * uy);
      for (let i = 0; i < 9; i++) {
        const cu = EX[i] * ux + EY[i] * uy;
        const feq = W[i] * r * (1 + 3 * cu + 4.5 * cu * cu - usq);
        const idx = i * n + k;
        f[idx] += omega * (feq - f[idx]);
      }
    }

    // 2. Stream (pull): each cell takes what its neighbours sent towards it.
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const k = y * nx + x;
        for (let i = 0; i < 9; i++) {
          let sx = x - EX[i];
          let sy = y - EY[i];
          if (sx < 0) sx = 0; // inlet column is overwritten below
          else if (sx >= nx) sx = nx - 1;
          if (sy < 0) sy += ny;
          else if (sy >= ny) sy -= ny;
          fNext[i * n + k] = f[i * n + sy * nx + sx];
        }
      }
    }

    // 3. Bounce back inside solids and add up the momentum they absorb.
    let fx = 0;
    let fy = 0;
    for (let k = 0; k < n; k++) {
      if (!solid[k]) continue;
      const x = k % nx;
      const y = (k - x) / nx;
      for (let i = 1; i < 9; i++) {
        const sx = x - EX[i];
        let sy = y - EY[i];
        if (sy < 0) sy += ny;
        else if (sy >= ny) sy -= ny;
        if (this.measured[k] && sx >= 0 && sx < nx && !solid[sy * nx + sx]) {
          // Subtract still air at the incoming air's pressure, as if the
          // inside of the object (a house, say) is open to the outside air.
          const incoming = fNext[i * n + k] - W[i] * this.rhoRef;
          fx += 2 * EX[i] * incoming;
          fy += 2 * EY[i] * incoming;
        }
      }
      for (const [a, b] of BOUNCE_PAIRS) {
        const ia = a * n + k;
        const ib = b * n + k;
        const t = fNext[ia];
        fNext[ia] = fNext[ib];
        fNext[ib] = t;
      }
    }
    this.forceX = fx;
    this.forceY = fy;
    const a = this.steps < 50 ? 0.2 : 0.02;
    this.avgForceX += a * (fx - this.avgForceX);
    this.avgForceY += a * (fy - this.avgForceY);

    // Swap buffers.
    this.f = fNext;
    this.fNext = f;

    // 4. Inlet: steady wind. Outlet: air leaves at normal pressure, which
    // stops pressure building up inside the tunnel.
    const u = this.inflow;
    let refSum = 0;
    let refCount = 0;
    for (let y = 0; y < ny; y++) {
      const k = y * nx;
      if (!solid[k]) this.setEquilibrium(k, 1, u, 0);
      const last = k + nx - 1;
      const prev = last - 1;
      if (!solid[last] && !solid[prev]) this.setEquilibrium(last, 1, this.ux[prev], this.uy[prev]);
      const probe = k + 3;
      if (!solid[probe]) {
        refSum += this.rho[probe];
        refCount++;
      }
    }
    if (refCount) this.rhoRef = refSum / refCount;

    this.steps++;
    if (this.steps % 200 === 0 && !Number.isFinite(this.avgForceX)) this.reset();
  }

  /** Pressure relative to the incoming air (lattice units: p = rho / 3). */
  pressureAt(k: number) {
    return (this.rho[k] - this.rhoRef) / 3;
  }

  isUnstable() {
    const mid = (this.ny >> 1) * this.nx + (this.nx >> 1);
    return !Number.isFinite(this.rho[mid]) || this.rho[mid] > 2 || this.rho[mid] < 0.3;
  }
}

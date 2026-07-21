import { Params, State, HistoryRecord } from '../types';
import { rk4Step, Deriv } from './integrator';
import {
  derivative, pivotAcceleration, energy, externalPower, dampingPower,
} from './equations';
import { deterministicTorque, randomTorque } from './forcing';
import { stateSeparation } from './angles';
import { mulberry32 } from '../utils/seededRandom';

const MAX_HISTORY = 4000;      // cap retained samples to protect the browser
const IMPULSE_DURATION = 0.12; // seconds a torque impulse is applied

export class UnstableError extends Error {}

// Drives one (or two, in comparison mode) double pendulums with a fixed-step
// RK4 integrator, seeded/reproducible forcing, damping, moving pivot and user
// impulses, while recording a capped history for charts and export.
export class Simulation {
  params: Params;
  x: State = [0, 0, 0, 0];
  x2: State | null = null;
  t = 0;
  history: HistoryRecord[] = [];
  lastTorque: [number, number] = [0, 0];

  private rng: () => number = mulberry32(1);
  private impulseValue: [number, number] = [0, 0];
  private impulseLeft: [number, number] = [0, 0];
  private d0 = 1e-9;

  constructor(params: Params) {
    this.params = params;
    this.reset(params);
  }

  reset(params?: Params): void {
    if (params) this.params = params;
    const p = this.params;
    this.x = [p.theta1_0, p.theta2_0, p.omega1_0, p.omega2_0];
    this.t = 0;
    this.history = [];
    this.rng = mulberry32(p.seed);
    this.impulseValue = [0, 0];
    this.impulseLeft = [0, 0];
    if (p.comparison) {
      this.x2 = [p.theta1_0 + p.epsilon, p.theta2_0, p.omega1_0, p.omega2_0];
      this.d0 = stateSeparation(this.x, this.x2) || 1e-9;
    } else {
      this.x2 = null;
    }
    this.recordSample([0, 0]);
  }

  setComparison(on: boolean, epsilon: number): void {
    this.params = { ...this.params, comparison: on, epsilon };
    if (on) {
      this.x2 = [this.x[0] + epsilon, this.x[1], this.x[2], this.x[3]];
      this.d0 = stateSeparation(this.x, this.x2) || 1e-9;
    } else {
      this.x2 = null;
    }
  }

  applyImpulse(joint: 0 | 1, sign: 1 | -1): void {
    this.impulseValue[joint] = sign * this.params.impulseMagnitude;
    this.impulseLeft[joint] = IMPULSE_DURATION;
  }

  // Advance the simulation by one fixed physics step.
  step(): void {
    const p = this.params;
    const dt = p.dt;
    const t0 = this.t;

    // Seeded random samples are drawn once per step and held constant across
    // the four RK4 stages, guaranteeing reproducibility and identical forcing
    // for both pendulums in comparison mode.
    const rt1 = randomTorque(p.forcing1, this.rng());
    const rt2 = randomTorque(p.forcing2, this.rng());
    const imp0 = this.impulseLeft[0] > 0 ? this.impulseValue[0] : 0;
    const imp1 = this.impulseLeft[1] > 0 ? this.impulseValue[1] : 0;

    const torqueAt = (t: number): [number, number] => [
      deterministicTorque(p.forcing1, t) + rt1 + imp0,
      deterministicTorque(p.forcing2, t) + rt2 + imp1,
    ];

    const f: Deriv = (x, t) =>
      derivative(x, p, torqueAt(t), pivotAcceleration(p, t));

    this.x = rk4Step(this.x, t0, dt, f);
    if (this.x2) this.x2 = rk4Step(this.x2, t0, dt, f);
    this.t = t0 + dt;

    this.impulseLeft[0] = Math.max(0, this.impulseLeft[0] - dt);
    this.impulseLeft[1] = Math.max(0, this.impulseLeft[1] - dt);

    const tau = torqueAt(t0);
    this.lastTorque = tau;

    if (!this.isFinite(this.x) || (this.x2 && !this.isFinite(this.x2))) {
      throw new UnstableError(
        'Simulation became numerically unstable (NaN/Inf). Reduce the time step or forcing amplitude, then reset.'
      );
    }
    this.recordSample(tau);
  }

  private isFinite(x: State): boolean {
    return x.every((v) => Number.isFinite(v));
  }

  private recordSample(tau: [number, number]): void {
    const p = this.params;
    const { ke, pe, total } = energy(this.x, p);
    const pext = externalPower(tau, this.x);
    const pdamp = dampingPower(this.x, p);

    let d: number | null = null;
    let lyap: number | null = null;
    if (this.x2) {
      d = stateSeparation(this.x, this.x2);
      if (this.t > 0 && d > 0) {
        lyap = (1 / this.t) * Math.log(d / this.d0);
      }
    }

    this.history.push({
      t: this.t,
      th1: this.x[0], th2: this.x[1], w1: this.x[2], w2: this.x[3],
      ke, pe, e: total,
      tau1: tau[0], tau2: tau[1],
      pext, pdamp,
      d, lyap,
    });
    if (this.history.length > MAX_HISTORY) this.history.shift();
  }

  latest(): HistoryRecord {
    return this.history[this.history.length - 1];
  }
}

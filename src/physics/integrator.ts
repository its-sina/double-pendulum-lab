import { State } from '../types';

// A time-dependent derivative: f(state, absoluteTime) -> dState/dt.
export type Deriv = (x: State, t: number) => State;

const axpy = (a: State, b: State, s: number): State => [
  a[0] + b[0] * s,
  a[1] + b[1] * s,
  a[2] + b[2] * s,
  a[3] + b[3] * s,
];

// Classic fourth-order Runge-Kutta step (fixed dt). Explicitly NOT Euler:
// four stage evaluations combined with the standard 1/6, 1/3, 1/3, 1/6 weights.
export function rk4Step(x: State, t: number, dt: number, f: Deriv): State {
  const k1 = f(x, t);
  const k2 = f(axpy(x, k1, dt / 2), t + dt / 2);
  const k3 = f(axpy(x, k2, dt / 2), t + dt / 2);
  const k4 = f(axpy(x, k3, dt), t + dt);
  return [
    x[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
    x[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    x[2] + (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
    x[3] + (dt / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]),
  ];
}

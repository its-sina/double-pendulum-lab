// Shared type definitions for the double-pendulum lab.
// State vector ordering is x = [theta1, theta2, omega1, omega2].
export type State = [number, number, number, number];

export type ForcingType =
  | 'none'
  | 'constant'
  | 'sine'
  | 'square'
  | 'random'
  | 'impulse';

export interface JointForcing {
  type: ForcingType;
  amplitude: number;      // A_i  (N·m)
  frequency: number;      // f_i  (Hz)
  phase: number;          // phi_i (rad)
  noiseIntensity: number; // random-forcing intensity (N·m)
}

export interface PivotConfig {
  mode: 'none' | 'horizontal' | 'vertical';
  amplitude: number;      // metres
  frequency: number;      // Hz
}

export interface Params {
  m1: number; m2: number;      // kg
  l1: number; l2: number;      // m
  g: number;                   // m/s^2
  b1: number; b2: number;      // joint viscous damping (N·m·s)
  theta1_0: number; theta2_0: number;   // rad
  omega1_0: number; omega2_0: number;   // rad/s
  forcing1: JointForcing;
  forcing2: JointForcing;
  pivot: PivotConfig;
  dt: number;                  // physics step (s)
  speed: number;               // playback multiplier
  trailLength: number;         // number of trail points
  seed: number;                // RNG seed for random forcing
  impulseMagnitude: number;    // N·m applied over impulseDuration
  comparison: boolean;         // chaos-comparison mode
  epsilon: number;             // perturbation on theta1 for 2nd pendulum
}

export interface HistoryRecord {
  t: number;
  th1: number; th2: number;
  w1: number; w2: number;
  ke: number; pe: number; e: number;
  tau1: number; tau2: number;
  pext: number; pdamp: number;
  d: number | null;      // state separation (comparison mode)
  lyap: number | null;   // finite-time Lyapunov estimate
}

import { Params, State } from '../types';

// ---------------------------------------------------------------------------
// Full coupled double-pendulum dynamics in the manipulator form
//     M(theta) * theta_ddot + C(theta,theta_dot) + G(theta) + D*theta_dot = tau
// with absolute angles theta1, theta2 measured from the downward vertical,
// point masses m1, m2 at the rod ends, joint viscous damping b1, b2, external
// joint torques tau1, tau2, and an (optionally) accelerating suspension point.
//
// Mass matrix (symmetric):
//   M11 = (m1+m2) L1^2
//   M12 = M21 = m2 L1 L2 cos(theta1-theta2)
//   M22 = m2 L2^2
// The velocity-product (Coriolis/centrifugal) and gravity terms are moved to
// the right-hand side below. A moving pivot enters as generalized forces Qp.
// ---------------------------------------------------------------------------

// Second derivative of the prescribed pivot position -> pivot acceleration.
export function pivotAcceleration(params: Params, t: number): [number, number] {
  const p = params.pivot;
  if (p.mode === 'none' || p.amplitude === 0) return [0, 0];
  const w = 2 * Math.PI * p.frequency;
  const acc = -p.amplitude * w * w * Math.sin(w * t); // d2/dt2 [A sin(w t)]
  return p.mode === 'horizontal' ? [acc, 0] : [0, acc];
}

// Right-hand side of the 2x2 system and the mass matrix, then solve for the
// angular accelerations. Returns the state derivative [w1, w2, a1, a2].
export function derivative(
  x: State,
  params: Params,
  torque: [number, number],
  pivotAcc: [number, number]
): State {
  const [th1, th2, w1, w2] = x;
  const { m1, m2, l1, l2, g, b1, b2 } = params;
  const d = th1 - th2;
  const cd = Math.cos(d);
  const sd = Math.sin(d);

  const M11 = (m1 + m2) * l1 * l1;
  const M12 = m2 * l1 * l2 * cd;
  const M22 = m2 * l2 * l2;

  // Generalized forces from an accelerating suspension point (pseudo-forces).
  const [ax, ay] = pivotAcc;
  const Qp1 = -(m1 + m2) * l1 * (ax * Math.cos(th1) - ay * Math.sin(th1));
  const Qp2 = -m2 * l2 * (ax * Math.cos(th2) - ay * Math.sin(th2));

  // RHS = external torque + pivot force - gravity - Coriolis - damping.
  const rhs1 =
    torque[0] + Qp1 -
    (m1 + m2) * g * l1 * Math.sin(th1) -
    m2 * l1 * l2 * sd * w2 * w2 -
    b1 * w1;
  const rhs2 =
    torque[1] + Qp2 -
    m2 * g * l2 * Math.sin(th2) +
    m2 * l1 * l2 * sd * w1 * w1 -
    b2 * w2;

  const det = M11 * M22 - M12 * M12;
  const a1 = (M22 * rhs1 - M12 * rhs2) / det;
  const a2 = (M11 * rhs2 - M12 * rhs1) / det;

  return [w1, w2, a1, a2];
}

// Kinetic, potential and total mechanical energy (pivot at height 0, up +ve).
export function energy(x: State, params: Params): {
  ke: number; pe: number; total: number;
} {
  const [th1, th2, w1, w2] = x;
  const { m1, m2, l1, l2, g } = params;
  const v1sq = l1 * l1 * w1 * w1;
  const v2sq =
    l1 * l1 * w1 * w1 +
    l2 * l2 * w2 * w2 +
    2 * l1 * l2 * w1 * w2 * Math.cos(th1 - th2);
  const ke = 0.5 * m1 * v1sq + 0.5 * m2 * v2sq;
  const y1 = -l1 * Math.cos(th1);
  const y2 = -l1 * Math.cos(th1) - l2 * Math.cos(th2);
  const pe = m1 * g * y1 + m2 * g * y2;
  return { ke, pe, total: ke + pe };
}

// Instantaneous injected power  P_ext = tau1*omega1 + tau2*omega2.
export function externalPower(torque: [number, number], x: State): number {
  return torque[0] * x[2] + torque[1] * x[3];
}

// Power dissipated by joint damping  P_damp = b1*omega1^2 + b2*omega2^2.
export function dampingPower(x: State, params: Params): number {
  return params.b1 * x[2] * x[2] + params.b2 * x[3] * x[3];
}

// Cartesian positions of the two bobs (pivot at origin, y up positive).
export function positions(x: State, params: Params, pivot: [number, number] = [0, 0]) {
  const [th1, th2] = x;
  const { l1, l2 } = params;
  const x1 = pivot[0] + l1 * Math.sin(th1);
  const y1 = pivot[1] - l1 * Math.cos(th1);
  const x2 = x1 + l2 * Math.sin(th2);
  const y2 = y1 - l2 * Math.cos(th2);
  return { x1, y1, x2, y2 };
}

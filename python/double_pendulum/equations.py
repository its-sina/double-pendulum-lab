"""Full coupled double-pendulum dynamics.

Manipulator form::

    M(theta) * theta_ddot + C(theta, theta_dot) + G(theta) + D*theta_dot = tau

with absolute angles ``theta1``, ``theta2`` measured from the downward vertical,
point masses ``m1``, ``m2`` at the rod ends, joint viscous damping ``b1``, ``b2``,
external joint torques ``tau1``, ``tau2``, and an (optionally) accelerating
suspension point.

Mass matrix (symmetric)::

    M11 = (m1 + m2) L1^2
    M12 = M21 = m2 L1 L2 cos(theta1 - theta2)
    M22 = m2 L2^2

The velocity-product (Coriolis/centrifugal) and gravity terms are moved to the
right-hand side.  A moving pivot enters as generalized forces ``Qp``.

Every expression here matches the TypeScript ``equations.ts`` term-for-term so
the two implementations integrate to the same trajectory.
"""

from __future__ import annotations

import math
from typing import Dict, Tuple

from .types import Params, State


def pivot_acceleration(params: Params, t: float) -> Tuple[float, float]:
    """Second derivative of the prescribed pivot position -> pivot acceleration."""

    p = params.pivot
    if p.mode == "none" or p.amplitude == 0:
        return (0.0, 0.0)
    w = 2 * math.pi * p.frequency
    acc = -p.amplitude * w * w * math.sin(w * t)  # d2/dt2 [A sin(w t)]
    return (acc, 0.0) if p.mode == "horizontal" else (0.0, acc)


def derivative(
    x: State,
    params: Params,
    torque: Tuple[float, float],
    pivot_acc: Tuple[float, float],
) -> State:
    """State derivative ``[w1, w2, a1, a2]``.

    Builds the 2x2 mass matrix and right-hand side, then solves for the angular
    accelerations.
    """

    th1, th2, w1, w2 = x
    m1, m2, l1, l2, g, b1, b2 = (
        params.m1,
        params.m2,
        params.l1,
        params.l2,
        params.g,
        params.b1,
        params.b2,
    )
    d = th1 - th2
    cd = math.cos(d)
    sd = math.sin(d)

    M11 = (m1 + m2) * l1 * l1
    M12 = m2 * l1 * l2 * cd
    M22 = m2 * l2 * l2

    # Generalized forces from an accelerating suspension point (pseudo-forces).
    ax, ay = pivot_acc
    Qp1 = -(m1 + m2) * l1 * (ax * math.cos(th1) - ay * math.sin(th1))
    Qp2 = -m2 * l2 * (ax * math.cos(th2) - ay * math.sin(th2))

    # RHS = external torque + pivot force - gravity - Coriolis - damping.
    rhs1 = (
        torque[0]
        + Qp1
        - (m1 + m2) * g * l1 * math.sin(th1)
        - m2 * l1 * l2 * sd * w2 * w2
        - b1 * w1
    )
    rhs2 = (
        torque[1]
        + Qp2
        - m2 * g * l2 * math.sin(th2)
        + m2 * l1 * l2 * sd * w1 * w1
        - b2 * w2
    )

    det = M11 * M22 - M12 * M12
    a1 = (M22 * rhs1 - M12 * rhs2) / det
    a2 = (M11 * rhs2 - M12 * rhs1) / det

    return (w1, w2, a1, a2)


def energy(x: State, params: Params) -> Dict[str, float]:
    """Kinetic, potential and total mechanical energy.

    Pivot at height 0, up positive.  Returns a dict with keys ``ke``, ``pe`` and
    ``total``.
    """

    th1, th2, w1, w2 = x
    m1, m2, l1, l2, g = params.m1, params.m2, params.l1, params.l2, params.g
    v1sq = l1 * l1 * w1 * w1
    v2sq = (
        l1 * l1 * w1 * w1
        + l2 * l2 * w2 * w2
        + 2 * l1 * l2 * w1 * w2 * math.cos(th1 - th2)
    )
    ke = 0.5 * m1 * v1sq + 0.5 * m2 * v2sq
    y1 = -l1 * math.cos(th1)
    y2 = -l1 * math.cos(th1) - l2 * math.cos(th2)
    pe = m1 * g * y1 + m2 * g * y2
    return {"ke": ke, "pe": pe, "total": ke + pe}


def external_power(torque: Tuple[float, float], x: State) -> float:
    """Instantaneous injected power  ``P_ext = tau1*omega1 + tau2*omega2``."""

    return torque[0] * x[2] + torque[1] * x[3]


def damping_power(x: State, params: Params) -> float:
    """Power dissipated by joint damping  ``P_damp = b1*omega1^2 + b2*omega2^2``."""

    return params.b1 * x[2] * x[2] + params.b2 * x[3] * x[3]


def positions(
    x: State, params: Params, pivot: Tuple[float, float] = (0.0, 0.0)
) -> Dict[str, float]:
    """Cartesian positions of the two bobs (pivot at origin, y up positive)."""

    th1, th2 = x[0], x[1]
    l1, l2 = params.l1, params.l2
    x1 = pivot[0] + l1 * math.sin(th1)
    y1 = pivot[1] - l1 * math.cos(th1)
    x2 = x1 + l2 * math.sin(th2)
    y2 = y1 - l2 * math.cos(th2)
    return {"x1": x1, "y1": y1, "x2": x2, "y2": y2}


__all__ = [
    "pivot_acceleration",
    "derivative",
    "energy",
    "external_power",
    "damping_power",
    "positions",
]

"""Fixed-step classical Runge-Kutta (RK4) integrator."""

from __future__ import annotations

from typing import Callable

from .types import State

# A time-dependent derivative: f(state, absolute_time) -> dState/dt.
Deriv = Callable[[State, float], State]


def _axpy(a: State, b: State, s: float) -> State:
    """Return ``a + s * b`` for two 4-vectors."""

    return (a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s, a[3] + b[3] * s)


def rk4_step(x: State, t: float, dt: float, f: Deriv) -> State:
    """One classic fourth-order Runge-Kutta step (fixed ``dt``).

    Explicitly NOT Euler: four stage evaluations combined with the standard
    1/6, 1/3, 1/3, 1/6 weights.
    """

    k1 = f(x, t)
    k2 = f(_axpy(x, k1, dt / 2), t + dt / 2)
    k3 = f(_axpy(x, k2, dt / 2), t + dt / 2)
    k4 = f(_axpy(x, k3, dt), t + dt)
    return (
        x[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
        x[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
        x[2] + (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
        x[3] + (dt / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]),
    )


__all__ = ["Deriv", "rk4_step"]

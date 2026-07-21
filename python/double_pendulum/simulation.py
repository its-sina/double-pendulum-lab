"""Fixed-step driver for one (or two) double pendulums.

Mirrors the TypeScript ``Simulation`` class: seeded/reproducible forcing,
damping, a moving pivot, user impulses, a chaos-comparison twin, and a capped
history buffer for charts and export.
"""

from __future__ import annotations

import math
from typing import Callable, List, Optional, Tuple

from .angles import state_separation
from .equations import (
    damping_power,
    derivative,
    energy,
    external_power,
    pivot_acceleration,
)
from .forcing import deterministic_torque, random_torque
from .integrator import rk4_step
from .seeded_random import mulberry32
from .types import HistoryRecord, Params, State

MAX_HISTORY = 4000      # cap retained samples to protect memory
IMPULSE_DURATION = 0.12  # seconds a torque impulse is applied


class UnstableError(Exception):
    """Raised when the integration blows up to NaN/Inf."""


class Simulation:
    def __init__(self, params: Params) -> None:
        self.params: Params = params
        self.x: State = (0.0, 0.0, 0.0, 0.0)
        self.x2: Optional[State] = None
        self.t: float = 0.0
        self.history: List[HistoryRecord] = []
        self.last_torque: Tuple[float, float] = (0.0, 0.0)

        self._rng: Callable[[], float] = mulberry32(1)
        self._impulse_value: List[float] = [0.0, 0.0]
        self._impulse_left: List[float] = [0.0, 0.0]
        self._d0: float = 1e-9

        self.reset(params)

    def reset(self, params: Optional[Params] = None) -> None:
        if params is not None:
            self.params = params
        p = self.params
        self.x = (p.theta1_0, p.theta2_0, p.omega1_0, p.omega2_0)
        self.t = 0.0
        self.history = []
        self._rng = mulberry32(p.seed)
        self._impulse_value = [0.0, 0.0]
        self._impulse_left = [0.0, 0.0]
        if p.comparison:
            self.x2 = (p.theta1_0 + p.epsilon, p.theta2_0, p.omega1_0, p.omega2_0)
            self._d0 = state_separation(self.x, self.x2) or 1e-9
        else:
            self.x2 = None
        self._record_sample((0.0, 0.0))

    def set_comparison(self, on: bool, epsilon: float) -> None:
        self.params = self.params.copy()
        self.params.comparison = on
        self.params.epsilon = epsilon
        if on:
            self.x2 = (self.x[0] + epsilon, self.x[1], self.x[2], self.x[3])
            self._d0 = state_separation(self.x, self.x2) or 1e-9
        else:
            self.x2 = None

    def apply_impulse(self, joint: int, sign: int) -> None:
        self._impulse_value[joint] = sign * self.params.impulse_magnitude
        self._impulse_left[joint] = IMPULSE_DURATION

    def step(self) -> None:
        """Advance the simulation by one fixed physics step."""

        p = self.params
        dt = p.dt
        t0 = self.t

        # Seeded random samples are drawn once per step and held constant across
        # the four RK4 stages, guaranteeing reproducibility and identical forcing
        # for both pendulums in comparison mode.
        rt1 = random_torque(p.forcing1, self._rng())
        rt2 = random_torque(p.forcing2, self._rng())
        imp0 = self._impulse_value[0] if self._impulse_left[0] > 0 else 0.0
        imp1 = self._impulse_value[1] if self._impulse_left[1] > 0 else 0.0

        def torque_at(t: float) -> Tuple[float, float]:
            return (
                deterministic_torque(p.forcing1, t) + rt1 + imp0,
                deterministic_torque(p.forcing2, t) + rt2 + imp1,
            )

        def f(x: State, t: float) -> State:
            return derivative(x, p, torque_at(t), pivot_acceleration(p, t))

        self.x = rk4_step(self.x, t0, dt, f)
        if self.x2 is not None:
            self.x2 = rk4_step(self.x2, t0, dt, f)
        self.t = t0 + dt

        self._impulse_left[0] = max(0.0, self._impulse_left[0] - dt)
        self._impulse_left[1] = max(0.0, self._impulse_left[1] - dt)

        tau = torque_at(t0)
        self.last_torque = tau

        if not self._is_finite(self.x) or (
            self.x2 is not None and not self._is_finite(self.x2)
        ):
            raise UnstableError(
                "Simulation became numerically unstable (NaN/Inf). Reduce the "
                "time step or forcing amplitude, then reset."
            )
        self._record_sample(tau)

    @staticmethod
    def _is_finite(x: State) -> bool:
        return all(math.isfinite(v) for v in x)

    def _record_sample(self, tau: Tuple[float, float]) -> None:
        p = self.params
        e = energy(self.x, p)
        pext = external_power(tau, self.x)
        pdamp = damping_power(self.x, p)

        d: Optional[float] = None
        lyap: Optional[float] = None
        if self.x2 is not None:
            d = state_separation(self.x, self.x2)
            if self.t > 0 and d > 0:
                lyap = (1 / self.t) * math.log(d / self._d0)

        self.history.append(
            HistoryRecord(
                t=self.t,
                th1=self.x[0],
                th2=self.x[1],
                w1=self.x[2],
                w2=self.x[3],
                ke=e["ke"],
                pe=e["pe"],
                e=e["total"],
                tau1=tau[0],
                tau2=tau[1],
                pext=pext,
                pdamp=pdamp,
                d=d,
                lyap=lyap,
            )
        )
        if len(self.history) > MAX_HISTORY:
            self.history.pop(0)

    def latest(self) -> HistoryRecord:
        return self.history[-1]


__all__ = ["Simulation", "UnstableError", "MAX_HISTORY", "IMPULSE_DURATION"]

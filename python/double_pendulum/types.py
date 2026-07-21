"""Shared type definitions for the double-pendulum lab (Python reference).

The state vector ordering is ``x = [theta1, theta2, omega1, omega2]`` — the same
ordering used by the TypeScript implementation that powers the live site. Angles
are measured from the downward vertical; SI units throughout.
"""

from __future__ import annotations

from dataclasses import dataclass, field, replace
from typing import List, Literal, Tuple

# A state vector [theta1, theta2, omega1, omega2].
State = Tuple[float, float, float, float]

ForcingType = Literal["none", "constant", "sine", "square", "random", "impulse"]
PivotMode = Literal["none", "horizontal", "vertical"]


@dataclass
class JointForcing:
    """External torque applied at a single joint."""

    type: ForcingType = "none"
    amplitude: float = 0.0       # A_i  (N·m)
    frequency: float = 0.0       # f_i  (Hz)
    phase: float = 0.0           # phi_i (rad)
    noise_intensity: float = 0.0  # random-forcing intensity (N·m)

    def copy(self) -> "JointForcing":
        return replace(self)


@dataclass
class PivotConfig:
    """Prescribed motion of the suspension point."""

    mode: PivotMode = "none"
    amplitude: float = 0.0  # metres
    frequency: float = 1.0  # Hz

    def copy(self) -> "PivotConfig":
        return replace(self)


@dataclass
class Params:
    """Full parameter set for a simulation run."""

    m1: float = 1.0
    m2: float = 1.0        # kg
    l1: float = 1.0
    l2: float = 1.0        # m
    g: float = 9.81        # m/s^2
    b1: float = 0.0
    b2: float = 0.0        # joint viscous damping (N·m·s)
    theta1_0: float = 0.0
    theta2_0: float = 0.0  # rad
    omega1_0: float = 0.0
    omega2_0: float = 0.0  # rad/s
    forcing1: JointForcing = field(default_factory=JointForcing)
    forcing2: JointForcing = field(default_factory=JointForcing)
    pivot: PivotConfig = field(default_factory=PivotConfig)
    dt: float = 0.005       # physics step (s)
    speed: float = 1.0      # playback multiplier
    trail_length: int = 500  # number of trail points
    seed: int = 12345       # RNG seed for random forcing
    impulse_magnitude: float = 8.0  # N·m applied over the impulse duration
    comparison: bool = False  # chaos-comparison mode
    epsilon: float = 0.001    # perturbation on theta1 for the 2nd pendulum

    def copy(self) -> "Params":
        return replace(
            self,
            forcing1=self.forcing1.copy(),
            forcing2=self.forcing2.copy(),
            pivot=self.pivot.copy(),
        )


@dataclass
class HistoryRecord:
    """One recorded sample of the simulation."""

    t: float
    th1: float
    th2: float
    w1: float
    w2: float
    ke: float
    pe: float
    e: float
    tau1: float
    tau2: float
    pext: float
    pdamp: float
    d: float | None = None     # state separation (comparison mode)
    lyap: float | None = None  # finite-time Lyapunov estimate


__all__ = [
    "State",
    "ForcingType",
    "PivotMode",
    "JointForcing",
    "PivotConfig",
    "Params",
    "HistoryRecord",
]

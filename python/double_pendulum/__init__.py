"""double_pendulum — the authoritative physics core for the Double Pendulum Lab.

This package is the *source of truth* for the simulation. The TypeScript code
that runs on the live website mirrors it module-for-module, and a parity harness
(``python -m parity.generate`` + the ``parity.test.ts`` suite) enforces that the
two produce the same trajectories to within a tight numerical tolerance.
"""

from __future__ import annotations

from .angles import state_separation, wrap_pi, wrapped_angle_delta
from .equations import (
    damping_power,
    derivative,
    energy,
    external_power,
    pivot_acceleration,
    positions,
)
from .forcing import deterministic_torque, random_torque
from .integrator import rk4_step
from .presets import Preset, default_params, presets
from .seeded_random import mulberry32
from .simulation import IMPULSE_DURATION, MAX_HISTORY, Simulation, UnstableError
from .types import (
    HistoryRecord,
    JointForcing,
    Params,
    PivotConfig,
    State,
)

__all__ = [
    "wrap_pi",
    "wrapped_angle_delta",
    "state_separation",
    "pivot_acceleration",
    "derivative",
    "energy",
    "external_power",
    "damping_power",
    "positions",
    "deterministic_torque",
    "random_torque",
    "rk4_step",
    "mulberry32",
    "Simulation",
    "UnstableError",
    "MAX_HISTORY",
    "IMPULSE_DURATION",
    "default_params",
    "presets",
    "Preset",
    "JointForcing",
    "PivotConfig",
    "Params",
    "HistoryRecord",
    "State",
]

__version__ = "1.0.0"

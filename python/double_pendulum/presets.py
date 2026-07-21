"""Default parameters and a small library of illustrative presets.

These mirror the presets shipped in the TypeScript app so the same named
scenarios exist on both sides of the parity harness.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List

from .types import JointForcing, Params, PivotConfig

D = math.pi / 180


def default_params() -> Params:
    """A fresh copy of the default parameter set."""

    return Params(
        m1=1, m2=1, l1=1, l2=1, g=9.81, b1=0, b2=0,
        theta1_0=120 * D, theta2_0=120 * D, omega1_0=0, omega2_0=0,
        forcing1=JointForcing(), forcing2=JointForcing(),
        pivot=PivotConfig(mode="none", amplitude=0, frequency=1),
        dt=0.005, speed=1, trail_length=500,
        seed=12345, impulse_magnitude=8,
        comparison=False, epsilon=0.001,
    )


@dataclass
class Preset:
    name: str
    description: str
    params: Params


def _base() -> Params:
    return default_params()


def presets() -> List[Preset]:
    small = _base()
    small.theta1_0, small.theta2_0 = 12 * D, 8 * D

    classic = _base()
    classic.theta1_0, classic.theta2_0 = 120 * D, 120 * D

    damped = _base()
    damped.theta1_0, damped.theta2_0 = 120 * D, 90 * D
    damped.b1, damped.b2 = 0.6, 0.4

    forced = _base()
    forced.theta1_0, forced.theta2_0 = 20 * D, 0
    forced.b1, forced.b2 = 0.15, 0.1
    forced.forcing1 = JointForcing(type="sine", amplitude=6, frequency=0.5, phase=0, noise_intensity=0)

    random_forced = _base()
    random_forced.theta1_0, random_forced.theta2_0 = 20 * D, 10 * D
    random_forced.b1, random_forced.b2 = 0.1, 0.08
    random_forced.forcing1 = JointForcing(type="random", amplitude=0, frequency=0, phase=0, noise_intensity=4)

    driven_damped = _base()
    driven_damped.theta1_0, driven_damped.theta2_0 = 90 * D, 45 * D
    driven_damped.b1, driven_damped.b2 = 0.05, 0.05
    driven_damped.forcing1 = JointForcing(type="sine", amplitude=8, frequency=0.66, phase=0, noise_intensity=0)

    compare = _base()
    compare.theta1_0, compare.theta2_0 = 120 * D, 120 * D
    compare.comparison = True
    compare.epsilon = 0.001

    return [
        Preset("Small-angle regular motion",
               "Tiny swings — near-linear, quasi-periodic, non-chaotic.", small),
        Preset("Classical chaotic double pendulum",
               "Large equal angles, no damping or forcing — the textbook chaos.", classic),
        Preset("Strong damping",
               "Heavy joint damping bleeds energy; motion decays to rest.", damped),
        Preset("Periodically forced system",
               "Sinusoidal torque on joint 1 drives a light, damped pendulum.", forced),
        Preset("Randomly forced system",
               "Seeded random torque — complex, but NOT necessarily chaotic.", random_forced),
        Preset("Driven-damped chaotic regime",
               "Sinusoidal drive plus light damping — sustained chaotic motion.", driven_damped),
        Preset("Nearly identical initial conditions",
               "Comparison mode on: two starts differing by epsilon diverge.", compare),
    ]


__all__ = ["D", "default_params", "Preset", "presets"]

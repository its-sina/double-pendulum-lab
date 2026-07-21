"""Angle helpers: wrapping and state-space separation."""

from __future__ import annotations

import math

from .types import State

TWO_PI = 2 * math.pi


def wrap_pi(a: float) -> float:
    """Wrap an angle into ``(-pi, pi]``."""

    x = (a + math.pi) % TWO_PI
    if x < 0:
        x += TWO_PI
    return x - math.pi


def wrapped_angle_delta(a: float, b: float) -> float:
    """Angular difference corrected across the -pi/pi boundary."""

    return wrap_pi(a - b)


def state_separation(a: State, b: State) -> float:
    """Full state-space separation.

    Uses wrapped angular distances for the two angular coordinates and raw
    differences for the angular velocities.
    """

    dth1 = wrapped_angle_delta(a[0], b[0])
    dth2 = wrapped_angle_delta(a[1], b[1])
    dw1 = a[2] - b[2]
    dw2 = a[3] - b[3]
    return math.sqrt(dth1 * dth1 + dth2 * dth2 + dw1 * dw1 + dw2 * dw2)


__all__ = ["wrap_pi", "wrapped_angle_delta", "state_separation"]

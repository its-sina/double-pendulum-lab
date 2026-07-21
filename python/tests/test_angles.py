"""Angle tests — mirror of src/__tests__/angles.test.ts."""

from __future__ import annotations

import math

from double_pendulum import state_separation, wrap_pi, wrapped_angle_delta


def test_wrap_into_range_and_preserve_angle():
    for a in [0, math.pi, 3 * math.pi, -3 * math.pi, 1.5 * math.pi, -0.3, 10]:
        w = wrap_pi(a)
        assert w >= -math.pi - 1e-9
        assert w <= math.pi + 1e-9
        assert abs(math.sin(w) - math.sin(a)) < 1e-6
        assert abs(math.cos(w) - math.cos(a)) < 1e-6
    assert abs(wrap_pi(1.5 * math.pi) - (-0.5 * math.pi)) < 1e-6


def test_boundary_difference():
    # 3.1 and -3.1 are close on the circle, not 6.2 apart.
    d = wrapped_angle_delta(3.1, -3.1)
    assert abs(d) < 0.1


def test_state_separation_wrapped():
    s = state_separation((3.1, 0, 0, 0), (-3.1, 0, 0, 0))
    assert s < 0.1
    s2 = state_separation((0, 0, 1, 0), (0, 0, 0, 0))
    assert abs(s2 - 1) < 1e-6

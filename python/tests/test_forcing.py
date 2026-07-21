"""Forcing + RNG tests — mirror of src/__tests__/forcing.test.ts."""

from __future__ import annotations

import math

from double_pendulum import deterministic_torque, mulberry32, random_torque
from double_pendulum.types import JointForcing


def test_constant_torque():
    assert deterministic_torque(JointForcing(type="constant", amplitude=3), 12.3) == 3


def test_sine_torque():
    cfg = JointForcing(type="sine", amplitude=2, frequency=1, phase=0)
    assert abs(deterministic_torque(cfg, 0)) < 1e-10
    assert abs(deterministic_torque(cfg, 0.25) - 2) < 1e-6  # quarter-period peak


def test_square_wave():
    cfg = JointForcing(type="square", amplitude=5, frequency=1, phase=0)
    assert deterministic_torque(cfg, 0.1) == 5
    assert deterministic_torque(cfg, 0.6) == -5


def test_random_torque_mapping():
    cfg = JointForcing(type="random", noise_intensity=4)
    assert abs(random_torque(cfg, 0.5)) < 1e-10
    assert abs(random_torque(cfg, 1) - 4) < 1e-10
    assert abs(random_torque(cfg, 0) + 4) < 1e-10


def test_rng_reproducible_same_seed():
    a, b = mulberry32(42), mulberry32(42)
    for _ in range(50):
        assert a() == b()


def test_rng_differs_across_seeds():
    a, b = mulberry32(1), mulberry32(2)
    assert a() != b()


def test_rng_range():
    r = mulberry32(999)
    for _ in range(1000):
        v = r()
        assert 0.0 <= v < 1.0

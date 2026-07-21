"""Physics tests — mirror of src/__tests__/physics.test.ts."""

from __future__ import annotations

import math

from double_pendulum import Simulation, derivative, energy, rk4_step
from double_pendulum.presets import default_params


def test_rk4_integrates_exp():
    """Integrates dx/dt = x to e^t with high accuracy."""
    x = (1.0, 0.0, 0.0, 0.0)
    f = lambda s, t: (s[0], 0.0, 0.0, 0.0)
    dt = 0.01
    for i in range(100):
        x = rk4_step(x, i * dt, dt, f)
    assert abs(x[0] - math.e) < 1e-4


def test_rk4_conserves_harmonic_energy():
    """q'' = -q -> state [q, q', .., ..] with f = [q', -q, 0, 0]."""
    x = (1.0, 0.0, 0.0, 0.0)
    f = lambda s, t: (s[1], -s[0], 0.0, 0.0)
    dt = 0.005
    e0 = x[0] * x[0] + x[1] * x[1]
    for i in range(2000):
        x = rk4_step(x, i * dt, dt, f)
    e1 = x[0] * x[0] + x[1] * x[1]
    assert abs(e1 - e0) < 1e-4


def test_zero_acceleration_at_equilibrium():
    p = default_params()
    p.b1 = p.b2 = 0
    d = derivative((0.0, 0.0, 0.0, 0.0), p, (0.0, 0.0), (0.0, 0.0))
    assert abs(d[2]) < 1e-10
    assert abs(d[3]) < 1e-10


def test_rest_potential_energy():
    p = default_params()
    p.b1 = p.b2 = 0
    e = energy((0.0, 0.0, 0.0, 0.0), p)
    assert abs(e["ke"]) < 1e-10
    expected = p.m1 * p.g * (-p.l1) + p.m2 * p.g * (-p.l1 - p.l2)
    assert abs(e["pe"] - expected) < 1e-8


def test_free_pendulum_energy_conservation():
    p = default_params()
    p.b1 = p.b2 = 0
    p.dt = 0.002
    sim = Simulation(p)
    e0 = sim.latest().e
    for _ in range(2500):  # 5 s
        sim.step()
    e1 = sim.latest().e
    assert abs(e1 - e0) < 1e-2

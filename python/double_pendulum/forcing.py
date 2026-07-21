"""Joint torque forcing terms (deterministic + seeded random)."""

from __future__ import annotations

import math

from .types import JointForcing


def deterministic_torque(cfg: JointForcing, t: float) -> float:
    """Deterministic part of a joint torque at absolute time ``t``.

    For the sinusoidal case ``tau_i(t) = A_i sin(2*pi*f_i*t + phi_i)``.
    """

    if cfg.type == "constant":
        return cfg.amplitude
    if cfg.type == "sine":
        return cfg.amplitude * math.sin(2 * math.pi * cfg.frequency * t + cfg.phase)
    if cfg.type == "square":
        s = math.sin(2 * math.pi * cfg.frequency * t + cfg.phase)
        return cfg.amplitude * (1.0 if s >= 0 else -1.0)
    # "none", "random", "impulse" contribute no deterministic term here.
    return 0.0


def random_torque(cfg: JointForcing, sample: float) -> float:
    """Random torque from a seeded uniform sample in ``[0, 1)``.

    Held constant over an integration step for reproducibility. Maps to
    symmetric noise in ``[-I, I]``.
    """

    return cfg.noise_intensity * (sample * 2 - 1) if cfg.type == "random" else 0.0


__all__ = ["deterministic_torque", "random_torque"]

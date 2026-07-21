import { JointForcing } from '../types';

// Deterministic part of a joint torque at absolute time t.
// tau_i(t) = A_i sin(2*pi*f_i*t + phi_i) for the sinusoidal case.
export function deterministicTorque(cfg: JointForcing, t: number): number {
  switch (cfg.type) {
    case 'constant':
      return cfg.amplitude;
    case 'sine':
      return cfg.amplitude * Math.sin(2 * Math.PI * cfg.frequency * t + cfg.phase);
    case 'square': {
      const s = Math.sin(2 * Math.PI * cfg.frequency * t + cfg.phase);
      return cfg.amplitude * (s >= 0 ? 1 : -1);
    }
    case 'none':
    case 'random':
    case 'impulse':
    default:
      return 0;
  }
}

// Random torque given a seeded uniform sample in [0,1). Held constant over an
// integration step for reproducibility. Maps to symmetric noise in [-I, I].
export function randomTorque(cfg: JointForcing, sample: number): number {
  return cfg.type === 'random' ? cfg.noiseIntensity * (sample * 2 - 1) : 0;
}

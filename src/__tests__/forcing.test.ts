import { describe, it, expect } from 'vitest';
import { deterministicTorque, randomTorque } from '../physics/forcing';
import { mulberry32 } from '../utils/seededRandom';
import { JointForcing } from '../types';

const base: JointForcing = { type: 'none', amplitude: 0, frequency: 0, phase: 0, noiseIntensity: 0 };

describe('forcing functions', () => {
  it('constant torque returns the amplitude', () => {
    expect(deterministicTorque({ ...base, type: 'constant', amplitude: 3 }, 12.3)).toBe(3);
  });

  it('sinusoidal torque follows A sin(2πft+φ)', () => {
    const cfg: JointForcing = { ...base, type: 'sine', amplitude: 2, frequency: 1, phase: 0 };
    expect(deterministicTorque(cfg, 0)).toBeCloseTo(0, 10);
    expect(deterministicTorque(cfg, 0.25)).toBeCloseTo(2, 6); // quarter period peak
  });

  it('square wave is +/- amplitude', () => {
    const cfg: JointForcing = { ...base, type: 'square', amplitude: 5, frequency: 1, phase: 0 };
    expect(deterministicTorque(cfg, 0.1)).toBe(5);
    expect(deterministicTorque(cfg, 0.6)).toBe(-5);
  });

  it('random torque maps a [0,1) sample into [-I, I]', () => {
    const cfg: JointForcing = { ...base, type: 'random', noiseIntensity: 4 };
    expect(randomTorque(cfg, 0.5)).toBeCloseTo(0, 10);
    expect(randomTorque(cfg, 1)).toBeCloseTo(4, 10);
    expect(randomTorque(cfg, 0)).toBeCloseTo(-4, 10);
  });
});

describe('seeded RNG reproducibility', () => {
  it('produces identical sequences for the same seed', () => {
    const a = mulberry32(42); const b = mulberry32(42);
    for (let i = 0; i < 50; i++) expect(a()).toBe(b());
  });
  it('differs for different seeds', () => {
    const a = mulberry32(1); const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });
});

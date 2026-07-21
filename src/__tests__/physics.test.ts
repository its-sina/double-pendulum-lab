import { describe, it, expect } from 'vitest';
import { rk4Step } from '../physics/integrator';
import { derivative, energy } from '../physics/equations';
import { Simulation } from '../physics/simulation';
import { defaultParams } from '../physics/presets';
import { State } from '../types';

describe('RK4 integrator', () => {
  it('integrates dx/dt = x to e^t with high accuracy', () => {
    let x: State = [1, 0, 0, 0];
    const f = (s: State): State => [s[0], 0, 0, 0];
    const dt = 0.01;
    for (let i = 0; i < 100; i++) x = rk4Step(x, i * dt, dt, f);
    expect(x[0]).toBeCloseTo(Math.E, 4);
  });

  it('conserves harmonic-oscillator energy', () => {
    // q'' = -q  ->  state [q, q', .., ..] with f = [q', -q, 0, 0]
    let x: State = [1, 0, 0, 0];
    const f = (s: State): State => [s[1], -s[0], 0, 0];
    const dt = 0.005;
    const e0 = x[0] * x[0] + x[1] * x[1];
    for (let i = 0; i < 2000; i++) x = rk4Step(x, i * dt, dt, f);
    const e1 = x[0] * x[0] + x[1] * x[1];
    expect(Math.abs(e1 - e0)).toBeLessThan(1e-4);
  });
});

describe('equations', () => {
  const p = { ...defaultParams, b1: 0, b2: 0 };

  it('has zero acceleration at the downward equilibrium', () => {
    const d = derivative([0, 0, 0, 0], p, [0, 0], [0, 0]);
    expect(d[2]).toBeCloseTo(0, 10);
    expect(d[3]).toBeCloseTo(0, 10);
  });

  it('computes rest potential energy correctly', () => {
    const { ke, pe } = energy([0, 0, 0, 0], p);
    expect(ke).toBeCloseTo(0, 10);
    const expected = p.m1 * p.g * (-p.l1) + p.m2 * p.g * (-p.l1 - p.l2);
    expect(pe).toBeCloseTo(expected, 8);
  });
});

describe('energy conservation of the free double pendulum', () => {
  it('keeps total energy nearly constant with RK4 and no damping/forcing', () => {
    const sim = new Simulation({ ...defaultParams, b1: 0, b2: 0, dt: 0.002 });
    const e0 = sim.latest().e;
    for (let i = 0; i < 2500; i++) sim.step(); // 5 s
    const e1 = sim.latest().e;
    expect(Math.abs(e1 - e0)).toBeLessThan(1e-2);
  });
});

import { describe, it, expect } from 'vitest';
import { wrapPi, wrappedAngleDelta, stateSeparation } from '../physics/angles';

describe('angle wrapping', () => {
  it('wraps into [-pi, pi] and preserves the angle', () => {
    for (const a of [0, Math.PI, 3 * Math.PI, -3 * Math.PI, 1.5 * Math.PI, -0.3, 10]) {
      const w = wrapPi(a);
      expect(w).toBeGreaterThanOrEqual(-Math.PI - 1e-9);
      expect(w).toBeLessThanOrEqual(Math.PI + 1e-9);
      expect(Math.sin(w)).toBeCloseTo(Math.sin(a), 6);
      expect(Math.cos(w)).toBeCloseTo(Math.cos(a), 6);
    }
    expect(wrapPi(1.5 * Math.PI)).toBeCloseTo(-0.5 * Math.PI, 6);
  });

  it('handles the boundary correctly for differences', () => {
    // 3.1 and -3.1 are close on the circle, not 6.2 apart
    const d = wrappedAngleDelta(3.1, -3.1);
    expect(Math.abs(d)).toBeLessThan(0.1);
  });

  it('state separation uses wrapped angles', () => {
    const s = stateSeparation([3.1, 0, 0, 0], [-3.1, 0, 0, 0]);
    expect(s).toBeLessThan(0.1);
    const s2 = stateSeparation([0, 0, 1, 0], [0, 0, 0, 0]);
    expect(s2).toBeCloseTo(1, 6);
  });
});

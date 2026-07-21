import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Simulation } from '../physics/simulation';
import { Params } from '../types';

// ---------------------------------------------------------------------------
// Python -> JS parity.
//
// The authoritative physics lives in the Python package under python/. Its
// `parity.generate` module runs a set of scenarios and writes the resulting
// trajectories to python/golden/golden.json. This test re-runs the identical
// scenarios through the TypeScript Simulation that ships to the browser and
// asserts the two agree to a tight tolerance — so the live site can never drift
// away from the reference physics without turning this suite red.
//
// The golden file is loaded from disk (not imported) so the ~0.8 MB of data is
// never type-checked or bundled, and so a regenerated golden is picked up with
// no code change here.
// ---------------------------------------------------------------------------

const here = dirname(fileURLToPath(import.meta.url));
const goldenPath = resolve(here, '../../python/golden/golden.json');

interface GoldenRecord {
  t: number; th1: number; th2: number; w1: number; w2: number;
  ke: number; pe: number; e: number;
  tau1: number; tau2: number; pext: number; pdamp: number;
  d: number | null; lyap: number | null;
}
interface Scenario {
  name: string;
  params: Params;
  steps: number;
  history: GoldenRecord[];
}
interface Golden { steps: number; scenarios: Scenario[] }

const golden: Golden = JSON.parse(readFileSync(goldenPath, 'utf-8'));

// Absolute + relative tolerance. Trajectories match to ~1e-9 over these
// horizons; the only source of drift is last-ULP differences between the
// Python and JS trig/exp implementations, which stay far below this bound.
const ATOL = 1e-6;
const RTOL = 1e-6;

function assertClose(
  actual: number | null,
  expected: number | null,
  field: string,
  scenario: string,
  i: number,
): void {
  if (expected === null || actual === null) {
    expect(actual, `${scenario} [${i}] ${field}: null mismatch`).toBe(expected);
    return;
  }
  expect(Number.isFinite(actual), `${scenario} [${i}] ${field} not finite`).toBe(true);
  const diff = Math.abs(actual - expected);
  const bound = ATOL + RTOL * Math.abs(expected);
  expect(
    diff <= bound,
    `${scenario} [${i}] ${field}: |${actual} - ${expected}| = ${diff} > ${bound}`,
  ).toBe(true);
}

const NUMERIC_FIELDS: (keyof GoldenRecord)[] = [
  't', 'th1', 'th2', 'w1', 'w2', 'ke', 'pe', 'e',
  'tau1', 'tau2', 'pext', 'pdamp', 'd', 'lyap',
];

describe('Python <-> JS physics parity', () => {
  it('loads a non-empty golden reference set', () => {
    expect(golden.scenarios.length).toBeGreaterThan(0);
    for (const s of golden.scenarios) {
      expect(s.history.length).toBe(s.steps + 1); // initial sample + one per step
    }
  });

  for (const scenario of golden.scenarios) {
    it(`matches the Python reference: ${scenario.name}`, () => {
      const sim = new Simulation(scenario.params);
      // history[0] is the initial sample recorded at reset(); compare it too.
      for (let i = 0; i < scenario.history.length; i++) {
        if (i > 0) sim.step();
        const got = sim.history[i];
        const want = scenario.history[i];
        for (const field of NUMERIC_FIELDS) {
          assertClose(
            got[field as keyof typeof got] as number | null,
            want[field],
            field,
            scenario.name,
            i,
          );
        }
      }
    });
  }
});

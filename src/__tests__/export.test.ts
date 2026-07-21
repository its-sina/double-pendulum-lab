import { describe, it, expect } from 'vitest';
import { historyToCSV, exportConfig, importConfig } from '../utils/export';
import { defaultParams } from '../physics/presets';
import { Simulation } from '../physics/simulation';

describe('CSV export', () => {
  it('emits a header and one row per sample', () => {
    const sim = new Simulation({ ...defaultParams });
    for (let i = 0; i < 10; i++) sim.step();
    const csv = historyToCSV(sim.history, sim.params);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toContain('theta1');
    expect(lines[0]).toContain('separation');
    expect(lines.length).toBe(sim.history.length + 1);
  });
});

describe('config round-trip', () => {
  it('import(export(p)) deep-equals p', () => {
    const json = exportConfig(defaultParams);
    const back = importConfig(json);
    expect(back).toEqual(defaultParams);
  });
  it('rejects malformed config', () => {
    expect(() => importConfig('{"m1":1}')).toThrow();
  });
});

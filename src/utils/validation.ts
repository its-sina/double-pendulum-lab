import { Params } from '../types';

// Clamp helper.
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Basic range validation + a stability heuristic for the time step. The fastest
// natural timescale scales like sqrt(L/g); we warn if dt is a large fraction of
// it, which is where explicit RK4 starts to lose accuracy on stiff swings.
export function validateParams(p: Params): { warnings: string[] } {
  const warnings: string[] = [];
  if (p.m1 <= 0 || p.m2 <= 0) warnings.push('Masses must be positive.');
  if (p.l1 <= 0 || p.l2 <= 0) warnings.push('Rod lengths must be positive.');
  if (p.g < 0) warnings.push('Gravity is negative.');

  const Lmin = Math.min(p.l1, p.l2);
  const tScale = Math.sqrt(Lmin / Math.max(p.g, 1e-6));
  if (p.dt > 0.25 * tScale) {
    warnings.push(
      `Time step dt=${p.dt.toFixed(4)}s may be too large for stability ` +
      `(recommended < ${(0.25 * tScale).toFixed(4)}s). Reduce dt if the motion blows up.`
    );
  }
  return warnings.length ? { warnings } : { warnings: [] };
}

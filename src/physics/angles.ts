import { State } from '../types';

// Wrap an angle into (-pi, pi].
export function wrapPi(a: number): number {
  let x = (a + Math.PI) % (2 * Math.PI);
  if (x < 0) x += 2 * Math.PI;
  return x - Math.PI;
}

// Correct angular difference across the -pi/pi boundary.
export function wrappedAngleDelta(a: number, b: number): number {
  return wrapPi(a - b);
}

// Full state-space separation using wrapped angle distances for the two
// angular coordinates and raw differences for the angular velocities.
export function stateSeparation(a: State, b: State): number {
  const dth1 = wrappedAngleDelta(a[0], b[0]);
  const dth2 = wrappedAngleDelta(a[1], b[1]);
  const dw1 = a[2] - b[2];
  const dw2 = a[3] - b[3];
  return Math.sqrt(dth1 * dth1 + dth2 * dth2 + dw1 * dw1 + dw2 * dw2);
}

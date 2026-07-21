import { Params, JointForcing } from '../types';

const noForce: JointForcing = { type: 'none', amplitude: 0, frequency: 0, phase: 0, noiseIntensity: 0 };
const D = Math.PI / 180;

export const defaultParams: Params = {
  m1: 1, m2: 1, l1: 1, l2: 1, g: 9.81, b1: 0, b2: 0,
  theta1_0: 120 * D, theta2_0: 120 * D, omega1_0: 0, omega2_0: 0,
  forcing1: { ...noForce }, forcing2: { ...noForce },
  pivot: { mode: 'none', amplitude: 0, frequency: 1 },
  dt: 0.005, speed: 1, trailLength: 500,
  seed: 12345, impulseMagnitude: 8,
  comparison: false, epsilon: 0.001,
};

function base(): Params {
  return JSON.parse(JSON.stringify(defaultParams));
}

export interface Preset { name: string; description: string; params: Params; }

export const presets: Preset[] = [
  {
    name: 'Small-angle regular motion',
    description: 'Tiny swings — near-linear, quasi-periodic, non-chaotic.',
    params: { ...base(), theta1_0: 12 * D, theta2_0: 8 * D },
  },
  {
    name: 'Classical chaotic double pendulum',
    description: 'Large equal angles, no damping or forcing — the textbook chaos.',
    params: { ...base(), theta1_0: 120 * D, theta2_0: 120 * D },
  },
  {
    name: 'Strong damping',
    description: 'Heavy joint damping bleeds energy; motion decays to rest.',
    params: { ...base(), theta1_0: 120 * D, theta2_0: 90 * D, b1: 0.6, b2: 0.4 },
  },
  {
    name: 'Periodically forced system',
    description: 'Sinusoidal torque on joint 1 drives a light, damped pendulum.',
    params: {
      ...base(), theta1_0: 20 * D, theta2_0: 0, b1: 0.15, b2: 0.1,
      forcing1: { type: 'sine', amplitude: 6, frequency: 0.5, phase: 0, noiseIntensity: 0 },
    },
  },
  {
    name: 'Randomly forced system',
    description: 'Seeded random torque — complex, but NOT necessarily chaotic.',
    params: {
      ...base(), theta1_0: 20 * D, theta2_0: 10 * D, b1: 0.1, b2: 0.08,
      forcing1: { type: 'random', amplitude: 0, frequency: 0, phase: 0, noiseIntensity: 4 },
    },
  },
  {
    name: 'Driven-damped chaotic regime',
    description: 'Sinusoidal drive plus light damping — sustained chaotic motion.',
    params: {
      ...base(), theta1_0: 90 * D, theta2_0: 45 * D, b1: 0.05, b2: 0.05,
      forcing1: { type: 'sine', amplitude: 8, frequency: 0.66, phase: 0, noiseIntensity: 0 },
    },
  },
  {
    name: 'Nearly identical initial conditions',
    description: 'Comparison mode on: two starts differing by epsilon diverge.',
    params: {
      ...base(), theta1_0: 120 * D, theta2_0: 120 * D,
      comparison: true, epsilon: 0.001,
    },
  },
];

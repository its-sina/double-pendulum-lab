import { useCallback, useEffect, useRef, useState } from 'react';
import { Params } from '../types';
import { Simulation, UnstableError } from '../physics/simulation';

// Owns a Simulation instance, advances it with a fixed-step accumulator driven
// by requestAnimationFrame (physics step is independent of the refresh rate),
// and exposes control methods plus a lightweight re-render "tick".
export function useSimulation(initial: Params) {
  const simRef = useRef<Simulation>(new Simulation(initial));
  const paramsRef = useRef<Params>(initial);
  const runningRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const accRef = useRef<number>(0);
  const frameRef = useRef<number>(0);

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const loop = useCallback((now: number) => {
    const sim = simRef.current;
    const p = paramsRef.current;
    if (lastRef.current === 0) lastRef.current = now;
    let dtReal = (now - lastRef.current) / 1000;
    lastRef.current = now;
    if (dtReal > 0.1) dtReal = 0.1; // avoid huge catch-up after a tab stall

    accRef.current += dtReal * p.speed;
    let steps = 0;
    try {
      while (accRef.current >= p.dt && steps < 400) {
        sim.step();
        accRef.current -= p.dt;
        steps++;
      }
    } catch (e) {
      if (e instanceof UnstableError) {
        setError(e.message);
        runningRef.current = false;
        setRunning(false);
      } else {
        throw e;
      }
    }

    // Throttle React updates (charts/readouts) to ~every 4th frame.
    frameRef.current = (frameRef.current + 1) % 4;
    if (frameRef.current === 0) setTick((t) => t + 1);

    if (runningRef.current) rafRef.current = requestAnimationFrame(loop);
  }, []);

  const start = useCallback(() => {
    if (runningRef.current) return;
    setError(null);
    runningRef.current = true;
    setRunning(true);
    lastRef.current = 0;
    accRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const pause = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const singleStep = useCallback(() => {
    setError(null);
    try {
      simRef.current.step();
    } catch (e) {
      if (e instanceof UnstableError) setError(e.message);
      else throw e;
    }
    setTick((t) => t + 1);
  }, []);

  const reset = useCallback((params?: Params) => {
    pause();
    if (params) paramsRef.current = params;
    simRef.current.reset(paramsRef.current);
    setError(null);
    setTick((t) => t + 1);
  }, [pause]);

  // Live-update physical parameters without discarding the current state.
  const setParams = useCallback((params: Params) => {
    paramsRef.current = params;
    simRef.current.params = params;
    setTick((t) => t + 1);
  }, []);

  const setComparison = useCallback((on: boolean, epsilon: number) => {
    simRef.current.setComparison(on, epsilon);
    paramsRef.current = { ...paramsRef.current, comparison: on, epsilon };
    setTick((t) => t + 1);
  }, []);

  const applyImpulse = useCallback((joint: 0 | 1, sign: 1 | -1) => {
    simRef.current.applyImpulse(joint, sign);
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  return {
    sim: simRef, running, error,
    start, pause, singleStep, reset, setParams, setComparison, applyImpulse,
  };
}

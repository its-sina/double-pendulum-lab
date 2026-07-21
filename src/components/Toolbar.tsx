interface Props {
  running: boolean;
  onStart: () => void; onPause: () => void; onReset: () => void; onStep: () => void;
  onClearTrails: () => void;
  onImpulse: (joint: 0 | 1, sign: 1 | -1) => void;
}

// Playback + impulse controls.
export default function Toolbar(p: Props) {
  return (
    <div className="toolbar">
      {!p.running
        ? <button className="primary" onClick={p.onStart}>▶ Start / Resume</button>
        : <button className="primary" onClick={p.onPause}>❚❚ Pause</button>}
      <button onClick={p.onStep} disabled={p.running}>Single-step</button>
      <button onClick={p.onReset}>↻ Reset</button>
      <button onClick={p.onClearTrails}>Clear trails</button>
      <span className="sep" />
      <button onClick={() => p.onImpulse(0, 1)}>+τ₁</button>
      <button onClick={() => p.onImpulse(0, -1)}>−τ₁</button>
      <button onClick={() => p.onImpulse(1, 1)}>+τ₂</button>
      <button onClick={() => p.onImpulse(1, -1)}>−τ₂</button>
    </div>
  );
}

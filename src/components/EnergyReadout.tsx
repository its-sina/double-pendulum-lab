import { HistoryRecord } from '../types';

// Live numeric readout of time, forcing, energy split and the instantaneous
// energy balance dE/dt ≈ P_external - P_damping (with a direction indicator).
export default function EnergyReadout({ rec }: { rec: HistoryRecord | undefined }) {
  if (!rec) return null;
  const net = rec.pext - rec.pdamp;
  const flow = net > 0.02 ? 'entering' : net < -0.02 ? 'leaving' : 'balanced';
  const flowClass = net > 0.02 ? 'in' : net < -0.02 ? 'out' : 'bal';
  return (
    <div className="readout-grid">
      <div><span className="k">time</span><span className="v">{rec.t.toFixed(2)} s</span></div>
      <div><span className="k">τ₁ / τ₂</span><span className="v">{rec.tau1.toFixed(2)} / {rec.tau2.toFixed(2)} N·m</span></div>
      <div><span className="k">KE</span><span className="v">{rec.ke.toFixed(2)} J</span></div>
      <div><span className="k">PE</span><span className="v">{rec.pe.toFixed(2)} J</span></div>
      <div><span className="k">total E</span><span className="v">{rec.e.toFixed(2)} J</span></div>
      <div><span className="k">P_ext</span><span className="v">{rec.pext.toFixed(2)} W</span></div>
      <div><span className="k">P_damp</span><span className="v">{rec.pdamp.toFixed(2)} W</span></div>
      <div><span className="k">dE/dt</span><span className={'v flow ' + flowClass}>{net.toFixed(2)} W · energy {flow}</span></div>
      {rec.d != null && <div><span className="k">separation d</span><span className="v">{rec.d.toExponential(2)}</span></div>}
      {rec.lyap != null && <div><span className="k">λ (est.)</span><span className="v">{rec.lyap.toFixed(3)}</span></div>}
    </div>
  );
}

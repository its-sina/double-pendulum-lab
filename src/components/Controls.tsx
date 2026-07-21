import { Params, JointForcing, ForcingType } from '../types';

const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;

interface Props {
  params: Params;
  onChange: (patch: Partial<Params>) => void;
}

// A labelled slider bound to a numeric field, with a numeric readout and a
// tooltip. Values are plain numbers in SI (or degrees where noted).
function Field(props: {
  label: string; value: number; min: number; max: number; step: number;
  unit?: string; tip?: string; onChange: (v: number) => void;
}) {
  return (
    <label className="field" title={props.tip}>
      <span className="field-label">
        {props.label}
        <b>{props.value.toFixed(props.step < 0.01 ? 4 : props.step < 1 ? 2 : 0)}{props.unit ? ' ' + props.unit : ''}</b>
      </span>
      <input
        type="range" min={props.min} max={props.max} step={props.step} value={props.value}
        onChange={(e) => props.onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}

function ForcingControls({ label, cfg, onChange }: {
  label: string; cfg: JointForcing; onChange: (c: JointForcing) => void;
}) {
  const set = (patch: Partial<JointForcing>) => onChange({ ...cfg, ...patch });
  return (
    <div className="forcing-block">
      <div className="forcing-head">{label}</div>
      <label className="field" title="Torque waveform applied to this joint">
        <span className="field-label">type</span>
        <select value={cfg.type} onChange={(e) => set({ type: e.target.value as ForcingType })}>
          <option value="none">none</option>
          <option value="constant">constant</option>
          <option value="sine">sinusoidal</option>
          <option value="square">square wave</option>
          <option value="random">random</option>
          <option value="impulse">impulse (buttons)</option>
        </select>
      </label>
      {(cfg.type === 'constant' || cfg.type === 'sine' || cfg.type === 'square') && (
        <Field label="amplitude A" value={cfg.amplitude} min={-20} max={20} step={0.5} unit="N·m"
          tip="Torque amplitude" onChange={(v) => set({ amplitude: v })} />
      )}
      {(cfg.type === 'sine' || cfg.type === 'square') && (
        <>
          <Field label="frequency f" value={cfg.frequency} min={0} max={3} step={0.05} unit="Hz"
            tip="Drive frequency" onChange={(v) => set({ frequency: v })} />
          <Field label="phase φ" value={cfg.phase * DEG} min={-180} max={180} step={5} unit="°"
            tip="Phase offset" onChange={(v) => set({ phase: v * RAD })} />
        </>
      )}
      {cfg.type === 'random' && (
        <Field label="noise intensity" value={cfg.noiseIntensity} min={0} max={15} step={0.5} unit="N·m"
          tip="Seeded random torque intensity" onChange={(v) => set({ noiseIntensity: v })} />
      )}
    </div>
  );
}

export default function Controls({ params, onChange }: Props) {
  const p = params;
  return (
    <div className="controls">
      <section>
        <h3>Physical parameters</h3>
        <Field label="mass m₁" value={p.m1} min={0.1} max={5} step={0.1} unit="kg" tip="Upper bob mass" onChange={(v) => onChange({ m1: v })} />
        <Field label="mass m₂" value={p.m2} min={0.1} max={5} step={0.1} unit="kg" tip="Lower bob mass" onChange={(v) => onChange({ m2: v })} />
        <Field label="length L₁" value={p.l1} min={0.2} max={2} step={0.05} unit="m" tip="Upper rod length" onChange={(v) => onChange({ l1: v })} />
        <Field label="length L₂" value={p.l2} min={0.2} max={2} step={0.05} unit="m" tip="Lower rod length" onChange={(v) => onChange({ l2: v })} />
        <Field label="gravity g" value={p.g} min={0} max={25} step={0.1} unit="m/s²" tip="Gravitational acceleration" onChange={(v) => onChange({ g: v })} />
        <Field label="damping b₁" value={p.b1} min={0} max={1} step={0.01} unit="N·m·s" tip="Joint-1 viscous damping (removes energy)" onChange={(v) => onChange({ b1: v })} />
        <Field label="damping b₂" value={p.b2} min={0} max={1} step={0.01} unit="N·m·s" tip="Joint-2 viscous damping (removes energy)" onChange={(v) => onChange({ b2: v })} />
      </section>

      <section>
        <h3>Initial conditions <span className="hint">(reset to apply)</span></h3>
        <Field label="θ₁(0)" value={p.theta1_0 * DEG} min={-180} max={180} step={1} unit="°" tip="Initial upper angle" onChange={(v) => onChange({ theta1_0: v * RAD })} />
        <Field label="θ₂(0)" value={p.theta2_0 * DEG} min={-180} max={180} step={1} unit="°" tip="Initial lower angle" onChange={(v) => onChange({ theta2_0: v * RAD })} />
        <Field label="ω₁(0)" value={p.omega1_0} min={-10} max={10} step={0.1} unit="rad/s" tip="Initial upper angular velocity" onChange={(v) => onChange({ omega1_0: v })} />
        <Field label="ω₂(0)" value={p.omega2_0} min={-10} max={10} step={0.1} unit="rad/s" tip="Initial lower angular velocity" onChange={(v) => onChange({ omega2_0: v })} />
      </section>

      <section>
        <h3>External forcing</h3>
        <ForcingControls label="Joint 1 torque τ₁(t)" cfg={p.forcing1} onChange={(c) => onChange({ forcing1: c })} />
        <ForcingControls label="Joint 2 torque τ₂(t)" cfg={p.forcing2} onChange={(c) => onChange({ forcing2: c })} />
        <Field label="random seed" value={p.seed} min={1} max={99999} step={1} tip="Seed for reproducible random forcing (reset to apply)" onChange={(v) => onChange({ seed: Math.round(v) })} />
        <Field label="impulse magnitude" value={p.impulseMagnitude} min={1} max={30} step={1} unit="N·m" tip="Torque applied by the impulse buttons" onChange={(v) => onChange({ impulseMagnitude: v })} />
      </section>

      <section>
        <h3>Moving suspension point</h3>
        <label className="field" title="Prescribed motion of the pivot">
          <span className="field-label">mode</span>
          <select value={p.pivot.mode} onChange={(e) => onChange({ pivot: { ...p.pivot, mode: e.target.value as Params['pivot']['mode'] } })}>
            <option value="none">fixed</option>
            <option value="horizontal">horizontal</option>
            <option value="vertical">vertical</option>
          </select>
        </label>
        {p.pivot.mode !== 'none' && (
          <>
            <Field label="pivot amplitude" value={p.pivot.amplitude} min={0} max={1} step={0.02} unit="m" tip="Pivot oscillation amplitude" onChange={(v) => onChange({ pivot: { ...p.pivot, amplitude: v } })} />
            <Field label="pivot frequency" value={p.pivot.frequency} min={0} max={4} step={0.05} unit="Hz" tip="Pivot oscillation frequency" onChange={(v) => onChange({ pivot: { ...p.pivot, frequency: v } })} />
          </>
        )}
      </section>

      <section>
        <h3>Numerics & display</h3>
        <Field label="time step dt" value={p.dt} min={0.001} max={0.02} step={0.001} unit="s" tip="Fixed RK4 physics step. Smaller = more stable." onChange={(v) => onChange({ dt: v })} />
        <Field label="sim speed" value={p.speed} min={0.1} max={4} step={0.1} unit="×" tip="Playback multiplier" onChange={(v) => onChange({ speed: v })} />
        <Field label="trail length" value={p.trailLength} min={0} max={2000} step={50} tip="Number of trail points for bob 2" onChange={(v) => onChange({ trailLength: Math.round(v) })} />
      </section>
    </div>
  );
}

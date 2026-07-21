import { useMemo, useRef, useState } from 'react';
import { Params } from './types';
import { defaultParams, presets } from './physics/presets';
import { useSimulation } from './hooks/useSimulation';
import { validateParams } from './utils/validation';
import { historyToCSV, download, exportConfig, importConfig } from './utils/export';
import Controls from './components/Controls';
import PendulumCanvas from './components/PendulumCanvas';
import Charts from './components/Charts';
import EnergyReadout from './components/EnergyReadout';
import EducationPanel from './components/EducationPanel';
import Toolbar from './components/Toolbar';

const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;

export default function App() {
  const [params, setParamsState] = useState<Params>(defaultParams);
  const [dark, setDark] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [clearSignal, setClearSignal] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    sim, running, error,
    start, pause, singleStep, reset, setParams, setComparison, applyImpulse,
  } = useSimulation(defaultParams);

  const warnings = useMemo(() => validateParams(params).warnings, [params]);

  const onChange = (patch: Partial<Params>) => {
    const merged = { ...params, ...patch };
    setParamsState(merged);
    setParams(merged);
    if ('comparison' in patch || 'epsilon' in patch) {
      setComparison(merged.comparison, merged.epsilon);
    }
  };

  const applyPreset = (idx: number) => {
    const pr = presets[idx];
    setParamsState(pr.params);
    reset(pr.params);
  };

  const doExportCSV = () => {
    const csv = historyToCSV(sim.current.history, params);
    download('double-pendulum-history.csv', csv, 'text/csv');
  };
  const doExportConfig = () => download('double-pendulum-config.json', exportConfig(params), 'application/json');
  const doImport = (file: File) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const cfg = importConfig(String(r.result));
        setParamsState(cfg);
        reset(cfg);
      } catch (e) {
        alert('Import failed: ' + (e as Error).message);
      }
    };
    r.readAsText(file);
  };

  const history = sim.current.history;
  const latest = history[history.length - 1];

  return (
    <div className={dark ? 'app dark' : 'app light'}>
      <header className="app-header">
        <div>
          <span className="eyebrow">Open · Forced · Damped</span>
          <h1>Double Pendulum Lab</h1>
        </div>
        <div className="header-actions">
          <select onChange={(e) => { if (e.target.value !== '') applyPreset(Number(e.target.value)); e.target.value = ''; }} defaultValue="">
            <option value="" disabled>Load preset…</option>
            {presets.map((p, i) => <option key={i} value={i} title={p.description}>{p.name}</option>)}
          </select>
          <button onClick={doExportCSV} title="Export the recorded history as CSV">Export CSV</button>
          <button onClick={doExportConfig} title="Save current parameters as JSON">Export config</button>
          <button onClick={() => fileRef.current?.click()} title="Load parameters from JSON">Import config</button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
          <button onClick={() => setDark((d) => !d)}>{dark ? '☀ Light' : '☾ Dark'}</button>
        </div>
      </header>

      {(warnings.length > 0 || error) && (
        <div className="banner">
          {error && <div className="err">⚠ {error}</div>}
          {warnings.map((w, i) => <div key={i} className="warn">⚠ {w}</div>)}
        </div>
      )}

      <div className="layout">
        <aside className={panelOpen ? 'side open' : 'side closed'}>
          <button className="collapse" onClick={() => setPanelOpen((o) => !o)}>
            {panelOpen ? '⟨ Hide controls' : '⟩'}
          </button>
          {panelOpen && <Controls params={params} onChange={onChange} />}
        </aside>

        <main className="main">
          <Toolbar
            running={running}
            onStart={start} onPause={pause} onReset={() => reset(params)} onStep={singleStep}
            onClearTrails={() => setClearSignal((c) => c + 1)}
            onImpulse={applyImpulse}
          />

          <div className="stage-row">
            <div className="canvas-wrap">
              <PendulumCanvas simRef={sim} clearTrails={clearSignal} dark={dark} />
              <div className="legend-row">
                <span className="dot" style={{ background: '#f0b34a' }} /> bob 1
                <span className="dot" style={{ background: '#46cddd' }} /> bob 2
                {params.comparison && <><span className="dot" style={{ background: '#ff6f5b' }} /> perturbed</>}
                <span className="dot" style={{ background: '#7ee081' }} /> τ₁
                <span className="dot" style={{ background: '#c98bff' }} /> τ₂
              </div>
            </div>
            <div className="side-info">
              <div className="comparison-box">
                <label title="Simulate a second pendulum with a tiny perturbation">
                  <input type="checkbox" checked={params.comparison}
                    onChange={(e) => onChange({ comparison: e.target.checked })} />
                  Chaos comparison mode
                </label>
                {params.comparison && (
                  <label className="field" title="Perturbation added to θ₁ of the second pendulum">
                    <span className="field-label">ε (θ₁ offset)<b>{params.epsilon.toExponential(1)}</b></span>
                    <input type="range" min={-4} max={-1} step={0.1}
                      value={Math.log10(params.epsilon)}
                      onChange={(e) => onChange({ epsilon: Math.pow(10, parseFloat(e.target.value)) })} />
                  </label>
                )}
              </div>
              <EnergyReadout rec={latest} />
            </div>
          </div>

          <Charts history={history.slice(-2400)} dark={dark} />
          <EducationPanel />
        </main>
      </div>
      <footer className="app-footer">
        RK4 integration · fixed physics step {params.dt.toFixed(3)} s · angles shown in degrees, integrated in radians.
      </footer>
    </div>
  );
}

export { DEG, RAD };

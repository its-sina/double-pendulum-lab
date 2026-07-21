import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { HistoryRecord } from '../types';

type ChartKey =
  | 'angles' | 'velocities' | 'energy' | 'power'
  | 'phase1' | 'phase2' | 'separation' | 'lyapunov';

const OPTIONS: { key: ChartKey; label: string }[] = [
  { key: 'angles', label: 'θ₁, θ₂ (t)' },
  { key: 'velocities', label: 'ω₁, ω₂ (t)' },
  { key: 'energy', label: 'Energy' },
  { key: 'power', label: 'Injected power' },
  { key: 'phase1', label: 'Phase (θ₁,ω₁)' },
  { key: 'phase2', label: 'Phase (θ₂,ω₂)' },
  { key: 'separation', label: 'Separation d(t)' },
  { key: 'lyapunov', label: 'Lyapunov est.' },
];

const DEG = 180 / Math.PI;
const MAX_POINTS = 600;

// Decimate to at most MAX_POINTS to keep charts responsive.
function decimate(h: HistoryRecord[]): HistoryRecord[] {
  if (h.length <= MAX_POINTS) return h;
  const stride = Math.ceil(h.length / MAX_POINTS);
  const out: HistoryRecord[] = [];
  for (let i = 0; i < h.length; i += stride) out.push(h[i]);
  return out;
}

export default function Charts({ history, dark }: { history: HistoryRecord[]; dark: boolean }) {
  const [chart, setChart] = useState<ChartKey>('angles');
  const data = useMemo(() => decimate(history), [history]);
  const axis = dark ? '#8a97a4' : '#5a6672';
  const gridc = dark ? '#1d2733' : '#e3e8f0';

  const common = (
    <>
      <CartesianGrid stroke={gridc} strokeDasharray="3 3" />
      <Tooltip contentStyle={{ background: dark ? '#131a22' : '#fff', border: `1px solid ${gridc}`, fontSize: 12 }} />
    </>
  );

  return (
    <div className="charts">
      <div className="chart-tabs">
        {OPTIONS.map((o) => (
          <button key={o.key} className={chart === o.key ? 'tab on' : 'tab'} onClick={() => setChart(o.key)}>
            {o.label}
          </button>
        ))}
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={220}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );

  function renderChart() {
    switch (chart) {
      case 'angles':
        return (
          <LineChart data={data.map((r) => ({ t: r.t, th1: r.th1 * DEG, th2: r.th2 * DEG }))}>
            {common}
            <XAxis dataKey="t" stroke={axis} tick={{ fontSize: 11 }} unit="s" />
            <YAxis stroke={axis} tick={{ fontSize: 11 }} unit="°" />
            <Legend />
            <Line dataKey="th1" name="θ₁" stroke="#f0b34a" dot={false} isAnimationActive={false} />
            <Line dataKey="th2" name="θ₂" stroke="#46cddd" dot={false} isAnimationActive={false} />
          </LineChart>
        );
      case 'velocities':
        return (
          <LineChart data={data}>
            {common}
            <XAxis dataKey="t" stroke={axis} tick={{ fontSize: 11 }} unit="s" />
            <YAxis stroke={axis} tick={{ fontSize: 11 }} />
            <Legend />
            <Line dataKey="w1" name="ω₁" stroke="#f0b34a" dot={false} isAnimationActive={false} />
            <Line dataKey="w2" name="ω₂" stroke="#46cddd" dot={false} isAnimationActive={false} />
          </LineChart>
        );
      case 'energy':
        return (
          <LineChart data={data}>
            {common}
            <XAxis dataKey="t" stroke={axis} tick={{ fontSize: 11 }} unit="s" />
            <YAxis stroke={axis} tick={{ fontSize: 11 }} unit="J" />
            <Legend />
            <Line dataKey="ke" name="KE" stroke="#7ee081" dot={false} isAnimationActive={false} />
            <Line dataKey="pe" name="PE" stroke="#c98bff" dot={false} isAnimationActive={false} />
            <Line dataKey="e" name="E" stroke="#46cddd" dot={false} isAnimationActive={false} />
          </LineChart>
        );
      case 'power':
        return (
          <LineChart data={data.map((r) => ({ t: r.t, net: r.pext - r.pdamp, pext: r.pext, pdamp: -r.pdamp }))}>
            {common}
            <XAxis dataKey="t" stroke={axis} tick={{ fontSize: 11 }} unit="s" />
            <YAxis stroke={axis} tick={{ fontSize: 11 }} unit="W" />
            <Legend />
            <Line dataKey="pext" name="P_ext" stroke="#7ee081" dot={false} isAnimationActive={false} />
            <Line dataKey="pdamp" name="-P_damp" stroke="#ff6f5b" dot={false} isAnimationActive={false} />
            <Line dataKey="net" name="dE/dt" stroke="#46cddd" dot={false} isAnimationActive={false} />
          </LineChart>
        );
      case 'phase1':
        return (
          <LineChart data={data.map((r) => ({ x: r.th1 * DEG, y: r.w1 }))}>
            {common}
            <XAxis dataKey="x" stroke={axis} tick={{ fontSize: 11 }} unit="°" name="θ₁" />
            <YAxis dataKey="y" stroke={axis} tick={{ fontSize: 11 }} name="ω₁" />
            <Line dataKey="y" stroke="#f0b34a" dot={false} isAnimationActive={false} />
          </LineChart>
        );
      case 'phase2':
        return (
          <LineChart data={data.map((r) => ({ x: r.th2 * DEG, y: r.w2 }))}>
            {common}
            <XAxis dataKey="x" stroke={axis} tick={{ fontSize: 11 }} unit="°" name="θ₂" />
            <YAxis dataKey="y" stroke={axis} tick={{ fontSize: 11 }} name="ω₂" />
            <Line dataKey="y" stroke="#46cddd" dot={false} isAnimationActive={false} />
          </LineChart>
        );
      case 'separation':
        return (
          <LineChart data={data.filter((r) => r.d != null).map((r) => ({ t: r.t, logd: Math.log10(Math.max(r.d as number, 1e-12)) }))}>
            {common}
            <XAxis dataKey="t" stroke={axis} tick={{ fontSize: 11 }} unit="s" />
            <YAxis stroke={axis} tick={{ fontSize: 11 }} name="log₁₀ d" />
            <Line dataKey="logd" name="log₁₀ d(t)" stroke="#ff6f5b" dot={false} isAnimationActive={false} />
          </LineChart>
        );
      case 'lyapunov':
        return (
          <LineChart data={data.filter((r) => r.lyap != null).map((r) => ({ t: r.t, lyap: r.lyap }))}>
            {common}
            <XAxis dataKey="t" stroke={axis} tick={{ fontSize: 11 }} unit="s" />
            <YAxis stroke={axis} tick={{ fontSize: 11 }} />
            <Line dataKey="lyap" name="λ (finite-time est.)" stroke="#c98bff" dot={false} isAnimationActive={false} />
          </LineChart>
        );
    }
  }
}

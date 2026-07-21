import { HistoryRecord, Params } from '../types';
import { positions } from '../physics/equations';

// Build a CSV string from the recorded history. Cartesian positions are
// recomputed from the angles at export time.
export function historyToCSV(history: HistoryRecord[], params: Params): string {
  const cols = [
    't', 'theta1', 'theta2', 'omega1', 'omega2',
    'x1', 'y1', 'x2', 'y2',
    'tau1', 'tau2', 'KE', 'PE', 'E', 'separation', 'lyapunov',
  ];
  const lines = [cols.join(',')];
  for (const r of history) {
    const pos = positions([r.th1, r.th2, r.w1, r.w2], params);
    lines.push([
      r.t, r.th1, r.th2, r.w1, r.w2,
      pos.x1, pos.y1, pos.x2, pos.y2,
      r.tau1, r.tau2, r.ke, r.pe, r.e,
      r.d ?? '', r.lyap ?? '',
    ].map((v) => (typeof v === 'number' ? v.toFixed(6) : v)).join(','));
  }
  return lines.join('\n');
}

export function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportConfig(params: Params): string {
  return JSON.stringify(params, null, 2);
}

// Parse + shallow-validate an imported configuration. Throws on malformed data.
export function importConfig(text: string): Params {
  const obj = JSON.parse(text);
  const required = ['m1', 'm2', 'l1', 'l2', 'g', 'dt', 'forcing1', 'forcing2', 'pivot'];
  for (const key of required) {
    if (!(key in obj)) throw new Error(`Missing field "${key}" in configuration.`);
  }
  return obj as Params;
}

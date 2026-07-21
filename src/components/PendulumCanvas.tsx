import { useEffect, useRef } from 'react';
// (params are read live from the simulation instance)
import type { Simulation } from '../physics/simulation';

interface Props {
  simRef: React.MutableRefObject<Simulation>;
  clearTrails: number;
  dark: boolean;
}

// Smoothly renders the pendulum(s) at display refresh rate by reading the live
// simulation state each frame. Maintains its own fading trail buffers, draws
// torque arrows at the joints, supports a moving pivot, and auto-scales.
export default function PendulumCanvas({ simRef, clearTrails, dark }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trail2 = useRef<Array<[number, number]>>([]);
  const trail1 = useRef<Array<[number, number]>>([]);
  const trail2b = useRef<Array<[number, number]>>([]);

  useEffect(() => {
    trail1.current = []; trail2.current = []; trail2b.current = [];
  }, [clearTrails]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const ink = dark ? '#e9eef3' : '#1a2230';
    const muted = dark ? '#8a97a4' : '#7a8694';
    const bg = dark ? '#0c111a' : '#f4f6fa';
    const grid = dark ? '#161f2b' : '#e3e8f0';

    const render = () => {
      const sim = simRef.current;
      const p = sim.params;
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // faint grid
      ctx.strokeStyle = grid; ctx.lineWidth = 1;
      for (let gx = 0; gx <= W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy <= H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

      const scale = (Math.min(W, H) * 0.40) / (p.l1 + p.l2);
      // moving pivot
      let pxp = 0, pyp = 0;
      if (p.pivot.mode !== 'none' && p.pivot.amplitude !== 0) {
        const off = p.pivot.amplitude * Math.sin(2 * Math.PI * p.pivot.frequency * sim.t) * scale;
        if (p.pivot.mode === 'horizontal') pxp = off; else pyp = off;
      }
      const ox = W / 2 + pxp, oy = H * 0.36 + pyp;

      const [th1, th2] = sim.x;
      const x1 = ox + p.l1 * scale * Math.sin(th1);
      const y1 = oy + p.l1 * scale * Math.cos(th1);
      const x2 = x1 + p.l2 * scale * Math.sin(th2);
      const y2 = y1 + p.l2 * scale * Math.cos(th2);

      trail2.current.push([x2, y2]); if (trail2.current.length > p.trailLength) trail2.current.shift();
      trail1.current.push([x1, y1]); if (trail1.current.length > p.trailLength) trail1.current.shift();

      const drawTrail = (pts: Array<[number, number]>, color: string) => {
        for (let i = 1; i < pts.length; i++) {
          const a = i / pts.length;
          ctx.strokeStyle = color.replace('ALPHA', (a * 0.7).toFixed(3));
          ctx.lineWidth = 1.5 * a + 0.3;
          ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
        }
      };
      drawTrail(trail1.current, 'rgba(240,179,74,ALPHA)');
      drawTrail(trail2.current, 'rgba(70,205,221,ALPHA)');

      // comparison pendulum
      if (sim.x2) {
        const [c1, c2] = sim.x2;
        const cx1 = ox + p.l1 * scale * Math.sin(c1);
        const cy1 = oy + p.l1 * scale * Math.cos(c1);
        const cx2 = cx1 + p.l2 * scale * Math.sin(c2);
        const cy2 = cy1 + p.l2 * scale * Math.cos(c2);
        trail2b.current.push([cx2, cy2]); if (trail2b.current.length > p.trailLength) trail2b.current.shift();
        drawTrail(trail2b.current, 'rgba(255,111,91,ALPHA)');
        ctx.strokeStyle = 'rgba(255,111,91,0.85)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(cx1, cy1); ctx.lineTo(cx2, cy2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ff6f5b';
        ctx.beginPath(); ctx.arc(cx2, cy2, 5 + p.m2, 0, 7); ctx.fill();
      }

      // main pendulum
      ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = muted; ctx.beginPath(); ctx.arc(ox, oy, 5, 0, 7); ctx.fill();
      ctx.fillStyle = '#f0b34a'; ctx.beginPath(); ctx.arc(x1, y1, 5 + p.m1 * 2, 0, 7); ctx.fill();
      ctx.fillStyle = '#46cddd'; ctx.beginPath(); ctx.arc(x2, y2, 5 + p.m2 * 2, 0, 7); ctx.fill();

      // torque arrows at joints
      drawTorqueArc(ctx, ox, oy, sim.lastTorque[0], '#7ee081');
      drawTorqueArc(ctx, x1, y1, sim.lastTorque[1], '#c98bff');

      // gravity indicator
      ctx.strokeStyle = muted; ctx.fillStyle = muted; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(24, 24); ctx.lineTo(24, 52); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(20, 46); ctx.lineTo(24, 54); ctx.lineTo(28, 46); ctx.fill();
      ctx.font = '11px system-ui'; ctx.fillText('g', 30, 44);

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [simRef, dark]);

  return <canvas ref={canvasRef} width={560} height={460} className="pendulum-canvas" />;
}

function drawTorqueArc(ctx: CanvasRenderingContext2D, x: number, y: number, tau: number, color: string) {
  if (Math.abs(tau) < 1e-3) return;
  const r = 18;
  const dir = Math.sign(tau);
  const mag = Math.min(1, Math.abs(tau) / 10);
  ctx.strokeStyle = color; ctx.lineWidth = 2 + mag * 2;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI * 0.5, -Math.PI * 0.5 + dir * (0.5 + mag * 2), dir < 0);
  ctx.stroke();
  const a = -Math.PI * 0.5 + dir * (0.5 + mag * 2);
  const ax = x + r * Math.cos(a), ay = y + r * Math.sin(a);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(ax, ay, 3, 0, 7); ctx.fill();
}

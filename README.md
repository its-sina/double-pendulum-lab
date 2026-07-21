# Double Pendulum Lab

**Live site:** https://its-sina.github.io/double-pendulum-lab/

An interactive **open / forced / damped** double-pendulum simulator. It integrates
the full coupled nonlinear equations of motion with fixed-step RK4, supports
external torques, damping and a moving pivot, and provides a chaos-comparison
mode, live charts, energy bookkeeping, presets, and CSV/JSON export.

Built with **React + TypeScript + Vite**, HTML Canvas for the animation and
**Recharts** for the plots. No backend.

The **physics is authored in Python** — the [`python/`](python/) package is the
*source of truth* for the equations of motion, the RK4 integrator, forcing,
damping, energy and the seeded RNG. The TypeScript that runs in the browser
mirrors it module-for-module, and an automated **parity harness** proves the two
produce the same trajectories (see [Python physics core](#python-physics-core-source-of-truth)).
The live site stays pure client-side JS/WASM-free so it hosts for free on GitHub
Pages; Python is where the physics is defined, verified and evolved.

## Requirements

- Node.js 18+ and npm (for the web app)
- Python 3.9+ (for the physics source of truth and its tests)

## Local setup

```bash
npm install       # install dependencies
npm run dev       # start the dev server -> http://localhost:5173
```

Other scripts:

```bash
npm run build     # type-check (tsc) + production build into dist/
npm run preview   # serve the production build locally
npm test          # run the vitest unit-test suite
```

## Directory structure

```
double-pendulum-lab/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── src/
    ├── main.tsx                 # React entry point
    ├── App.tsx                  # dashboard layout + wiring
    ├── styles.css               # dark/light dashboard styling
    ├── types.ts                 # shared TypeScript interfaces
    ├── physics/
    │   ├── equations.ts         # coupled EOM (mass matrix), energy, power, positions
    │   ├── integrator.ts        # fourth-order Runge–Kutta step
    │   ├── forcing.ts           # torque waveforms (const/sine/square/random)
    │   ├── angles.ts            # angle wrapping + wrapped state separation
    │   ├── simulation.ts        # stateful engine: stepping, history, comparison
    │   └── presets.ts           # default params + 7 experiment presets
    ├── hooks/
    │   └── useSimulation.ts      # rAF loop, fixed-step accumulator, controls
    ├── components/
    │   ├── PendulumCanvas.tsx    # animation, trails, torque arrows, moving pivot
    │   ├── Controls.tsx          # full control panel (sliders + forcing + pivot)
    │   ├── Charts.tsx            # selectable live charts (Recharts)
    │   ├── EnergyReadout.tsx     # time / torque / energy / dE/dt readout
    │   ├── EducationPanel.tsx    # open-system interpretation notes
    │   └── Toolbar.tsx           # start/pause/reset/step/impulse buttons
    ├── utils/
    │   ├── seededRandom.ts       # mulberry32 seeded PRNG
    │   ├── validation.ts         # range checks + dt stability heuristic
    │   └── export.ts             # CSV export, JSON import/export
    └── __tests__/
        ├── physics.test.ts       # RK4, equilibrium, energy conservation
        ├── angles.test.ts        # wrapping + separation
        ├── forcing.test.ts       # waveforms + seeded reproducibility
        ├── export.test.ts        # CSV shape + config round-trip
        └── parity.test.ts        # asserts JS matches the Python golden reference
```

The Python source of truth lives alongside it:

```
python/
├── pyproject.toml
├── double_pendulum/             # authoritative physics package
│   ├── types.py                 # Params / JointForcing / state dataclasses
│   ├── equations.py             # coupled EOM (mass matrix), energy, power, positions
│   ├── integrator.py            # fourth-order Runge–Kutta step
│   ├── forcing.py               # torque waveforms (const/sine/square/random)
│   ├── angles.py                # angle wrapping + wrapped state separation
│   ├── seeded_random.py         # bit-exact mulberry32 port of the JS PRNG
│   ├── simulation.py            # stateful engine: stepping, history, comparison
│   └── presets.py               # default params + the 7 experiment presets
├── parity/
│   └── generate.py              # runs scenarios -> golden/golden.json
├── golden/
│   └── golden.json              # reference trajectories the JS suite is checked against
└── tests/                       # pytest mirror of the TS unit tests
```

## The model

State vector `x = [θ₁, θ₂, ω₁, ω₂]` (angles from the downward vertical). The
dynamics are written in manipulator form

```
M(θ)·θ̈ + C(θ,θ̇) + G(θ) + D·θ̇ = τ(t)
```

with the symmetric mass matrix

```
M11 = (m₁+m₂)L₁²,   M12 = M21 = m₂L₁L₂cos(θ₁−θ₂),   M22 = m₂L₂²
```

Gravity `G`, the velocity-product (Coriolis/centrifugal) terms `C`, viscous joint
damping `D = diag(b₁,b₂)`, external joint torques `τ`, and the pseudo-forces from
an accelerating suspension point are assembled on the right-hand side; the 2×2
system is solved each RK4 stage for the angular accelerations. See
`src/physics/equations.ts` for the fully-commented derivation.

Energy: `KE = ½m₁v₁² + ½m₂v₂²`, `PE` from bob heights, and the open-system balance
`dE/dt ≈ P_ext − P_damp` with `P_ext = τ₁ω₁ + τ₂ω₂`, `P_damp = b₁ω₁² + b₂ω₂²`.

## Python physics core (source of truth)

The equations of motion, the RK4 integrator, forcing/damping, energy accounting
and the seeded RNG are defined in the Python package under [`python/`](python/).
It has no third-party dependencies (only the standard library) and mirrors the
browser code term-for-term, including a **bit-exact** port of the `mulberry32`
PRNG so seeded random forcing is reproducible across both languages.

```bash
cd python
pip install -e ".[dev]"   # installs pytest
python -m pytest -q       # run the physics unit tests
python -m parity.generate # regenerate golden/golden.json from the Python source
```

### How parity is enforced

1. `python -m parity.generate` runs a set of representative scenarios (all seven
   presets plus moving-pivot and mixed-forcing cases) through the Python core and
   writes the resulting trajectories to `python/golden/golden.json`.
2. `src/__tests__/parity.test.ts` re-runs the identical scenarios through the
   TypeScript `Simulation` that ships to the browser and asserts every recorded
   quantity matches the golden reference to a tight tolerance (`1e-6`).
3. CI closes the loop: the **Python physics** workflow regenerates the golden and
   fails if the committed file is stale, while the **deploy** workflow runs the JS
   suite (including `parity.test.ts`) before publishing. So the live site can
   never drift from the Python reference without turning the build red.

If you change the physics, edit the Python package first, run
`python -m parity.generate`, mirror the change in the corresponding `src/physics`
module, and commit both — `npm test` and `pytest` will confirm they agree.

## On chaos (important caveat)

Irregular motion under **random** forcing is not automatically deterministic
chaos, and a positive **finite-time Lyapunov estimate** is only an estimate — not
proof. Use the comparison mode and the unforced/forced presets as controls. The
in-app education panel spells this out.

## Notes

- Angles are shown in **degrees** in the UI and integrated in **radians**.
- Physics runs at a fixed `dt` independent of the display refresh rate; the
  animation renders at screen rate via `requestAnimationFrame`.
- History is capped (4000 samples) and charts are decimated to keep the UI fast.
- If the simulation goes numerically unstable (NaN/∞), it auto-pauses and shows a
  message; reduce `dt` or the forcing amplitude and reset.

## Deploy as a website (GitHub Pages)

This repo includes an automated Pages workflow at `.github/workflows/deploy.yml`.
The Vite `base` is set to `'./'` so the build works under a repo subpath.

### One-time setup
1. Create a new repository on GitHub (e.g. `double-pendulum-lab`).
2. Push this project to it (see commands below).
3. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

### Push the code
```bash
cd double-pendulum-lab
git init
git add .
git commit -m "Double Pendulum Lab"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

On every push to `main`, the workflow runs the tests, builds the site, and
publishes it. Your site will be live at:

```
https://<your-username>.github.io/<your-repo>/
```

The Actions tab shows build/deploy progress; the Pages settings page shows the
final URL once the first deploy finishes (usually 1–2 minutes).

### Alternatives
- **User/organization site** (`<user>.github.io` repo): the URL has no subpath,
  so `base: './'` still works — no change needed.
- **Vercel / Netlify / Cloudflare Pages**: import the repo, framework preset
  "Vite", build command `npm run build`, output directory `dist`. No config file
  needed; you can even set `base: '/'` for those hosts.
- **Manual**: run `npm run build` and serve the `dist/` folder from any static host.

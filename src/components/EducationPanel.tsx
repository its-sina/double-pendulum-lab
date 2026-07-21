// Concise conceptual notes on the open-system interpretation. Static content.
export default function EducationPanel() {
  return (
    <div className="education">
      <h3>Open vs. closed — how to read this</h3>
      <ul>
        <li>A <b>closed</b> ideal double pendulum conserves total mechanical energy; its motion comes purely from its internal state.</li>
        <li>An <b>open</b> double pendulum exchanges energy with its surroundings. Here that happens two ways:</li>
        <li><b>External forcing adds energy</b> — the injected power is <code>P_ext = τ₁·ω₁ + τ₂·ω₂</code>.</li>
        <li><b>Damping removes energy</b> — dissipated power is <code>P_damp = b₁·ω₁² + b₂·ω₂²</code>.</li>
        <li>The instantaneous balance is <code>dE/dt ≈ P_ext − P_damp</code>, shown live in the readout.</li>
        <li><b>Random forcing that looks complicated is not automatically deterministic chaos.</b> Irregularity can simply be injected noise.</li>
        <li>A <b>positive finite-time Lyapunov estimate alone does not prove chaos.</b> It is an estimate over a finite window and can be biased by forcing or transients.</li>
        <li>To argue for chaos, run <b>repeated experiments</b> and compare against <b>unforced</b> and <b>randomly-forced controls</b> — that is what the comparison mode and presets are for.</li>
      </ul>
    </div>
  );
}

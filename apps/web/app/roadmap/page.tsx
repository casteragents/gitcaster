const phases = [
  ["Local alpha", "route shell, local node previews, contracts, and proof gates"],
  ["Canary public", "canary.cloud, canary.api, and canary.gitcaster with rollback proof"],
  ["Dependency parity", "Legacy runtime adapters retire only after parity, rollback, and burn-in evidence"],
  ["Cutover candidate", "DNS switch only after smoke, rollback, health, and burn-in evidence"],
];

export default function RoadmapPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Roadmap</div>
        <h1>Public launch without false readiness</h1>
        <p className="lede">
          The roadmap is evidence-driven. Local work can pass locally, but
          public readiness is blocked until real operator evidence exists.
        </p>
      </div>
      <div className="grid">
        {phases.map(([phase, description]) => (
          <div className="card" key={phase}>
            <h3>{phase}</h3>
            <p>{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { sitePath } from "../../../lib/site-url";

const publicArtifacts = [
  ["Simulator package", "packages/simulator", "Deterministic local stepping for agent, app, robot, service, and asset entities."],
  ["Example world", "examples/worlds/local-agent-grid.world.json", "Portable local-agent-grid fixture for tutorials and contribution tests."],
  ["Digital twin export", "packages/simulator/src/simulator.ts", "Stable JSON export helper for local inspection and docs."]
];

const reservedArtifacts = [
  "Managed orchestration and account operations",
  "High-scale simulation cluster scheduling",
  "Enterprise fleet dashboard and private policy controls",
  "Operator secrets, custody, billing, and production deployment commands"
];

export default function SimulatorOpenSourcePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Open-core layer</div>
        <h1>Local simulator and digital twin exports</h1>
        <p className="lede">
          GitCaster now exposes a public local simulator package so developers can
          test agent/app flows and inspect deterministic digital twin exports without
          touching managed CasterCloud orchestration.
        </p>
        <div className="actions">
          <a className="button primary" href="https://github.com/casteragents/gitcaster/tree/main/packages/simulator">Simulator source</a>
          <a className="button" href="https://github.com/casteragents/gitcaster/tree/main/examples/worlds">Example worlds</a>
          <a className="button" href={sitePath("/status")}>Status proof</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Public artifacts</h2>
            <p>These are safe contribution surfaces for local development.</p>
          </div>
          <span className="pill good">public-alpha</span>
        </div>
        <div className="grid">
          {publicArtifacts.map(([name, path, description]) => (
            <div className="card" key={name}>
              <h3>{name}</h3>
              <p>{description}</p>
              <span className="pill info">{path}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Commercial boundary</h2>
            <p>The simulator package is public; the hosted platform remains reserved.</p>
          </div>
          <span className="pill warn">reserved</span>
        </div>
        <div className="grid">
          {reservedArtifacts.map((item) => (
            <div className="card" key={item}>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

import { sitePath } from "../../../lib/site-url";

const publicArtifacts = [
  ["Local node source", "apps/node", "HTTP routing, local health/status endpoints, mutation verification, route registry, and redaction helpers."],
  ["Local API smoke fixture", "examples/node/local-api-smoke.example.json", "A public fixture that documents loopback-only route checks and blocked external states."],
  ["Node API evidence", "launch/evidence/local-node-api-source.json", "Deterministic proof that the local API remains alpha-local and does not claim public federation."]
];

const localRoutes = [
  ["GET /health", "Returns alpha-local health, zero public peers, zero gossip, and unverified local storage."],
  ["GET /node/status", "Shows local node status without public network telemetry."],
  ["GET /node/registry", "Lists planned nodes as blocked with no public URLs."],
  ["GET /repos", "Reads local alpha repo state only."],
  ["POST /repos", "Requires a signed mutation envelope and blocks unsigned writes."],
  ["Storage/deploy/domain routes", "Return requires-endpoint or requires-registry until proof exists."]
];

const blockedModes = [
  "Public node federation",
  "Hosted node health proof",
  "QStorage publication",
  "CasterCloud deployment",
  "Native domain mapping",
  "Managed runtime operations"
];

export default function LocalNodeApiOpenSourcePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Open-core layer</div>
        <h1>Local node API source for GitCaster builders</h1>
        <p className="lede">
          GitCaster now publishes the local node API source as a public-alpha
          developer layer. Builders can inspect the loopback HTTP server, route
          registry, health/status responses, repo route shells, signed mutation
          checks, and redaction behavior while public federation, storage,
          deployment, domains, managed runtime, and hosted node claims stay
          blocked.
        </p>
        <div className="actions">
          <a className="button primary" href="https://github.com/casteragents/gitcaster/tree/main/apps/node">Node API source</a>
          <a className="button" href="https://github.com/casteragents/gitcaster/tree/main/examples/node">Smoke fixture</a>
          <a className="button" href={sitePath("/gitcaster-local-node-api.md")}>Markdown docs</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Public artifacts</h2>
            <p>These files are safe contribution surfaces for local node development.</p>
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
            <h2>Local route scope</h2>
            <p>The node API layer proves local behavior without claiming public infrastructure.</p>
          </div>
          <span className="pill info">alpha-local runtime</span>
        </div>
        <div className="grid">
          {localRoutes.map(([name, description]) => (
            <div className="card" key={name}>
              <h3>{name}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Blocked modes</h2>
            <p>These stay closed or blocked until deterministic proof exists.</p>
          </div>
          <span className="pill warn">blocked</span>
        </div>
        <div className="grid">
          {blockedModes.map((item) => (
            <div className="card" key={item}>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

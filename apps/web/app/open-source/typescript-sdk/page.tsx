import { sitePath } from "../../../lib/site-url";

const publicArtifacts = [
  ["SDK package", "packages/sdk-typescript", "Typed client helpers, proof-gated methods, redaction, and local clone URL helpers."],
  ["Local client example", "examples/sdk/public-alpha-client.example.ts", "A placeholder-only SDK usage example that does not mutate live state."],
  ["Example manifest", "examples/sdk/public-alpha-client.example.json", "A machine-readable boundary summary for contributors."]
];

const workflow = [
  ["Create the client", "Use the SDK without a default node URL to inspect local helper behavior."],
  ["Handle blockers", "Runtime methods return explicit blocked statuses until endpoint, signer, registry, or proof evidence exists."],
  ["Contribute safely", "Run the SDK check and public secret scan before opening changes."]
];

const reservedArtifacts = [
  "Managed signing custody",
  "Hosted orchestration and account operations",
  "Native storage verification",
  "Native domain registry operation",
  "Contract utility activation"
];

export default function TypeScriptSdkOpenSourcePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Open-core layer</div>
        <h1>TypeScript SDK for GitCaster builders</h1>
        <p className="lede">
          GitCaster now publishes its TypeScript SDK as a public-alpha developer
          layer. Builders can inspect typed client helpers, local request guards,
          redaction, and proof-gated status methods while managed runtime,
          custody, native publish, and contract utility remain blocked.
        </p>
        <div className="actions">
          <a className="button primary" href="https://github.com/casteragents/gitcaster/tree/main/packages/sdk-typescript">SDK source</a>
          <a className="button" href="https://github.com/casteragents/gitcaster/tree/main/examples/sdk">SDK examples</a>
          <a className="button" href={sitePath("/status")}>Status proof</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Public artifacts</h2>
            <p>These are safe contribution surfaces for local SDK integration planning.</p>
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
            <h2>Local workflow</h2>
            <p>The SDK helps contributors model integrations without making live claims.</p>
          </div>
          <span className="pill info">local-only</span>
        </div>
        <div className="grid">
          {workflow.map(([name, description]) => (
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
            <h2>Commercial boundary</h2>
            <p>The SDK source is public; managed operation and custody remain reserved.</p>
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

import { sitePath } from "../../../lib/site-url";

const publicArtifacts = [
  ["CLI source", "apps/cli", "Local command helpers for push payloads, issues, pull requests, MCP serve planning, and deploy-plan evidence."],
  ["Deploy plan command", "apps/cli/src/commands/deploy.ts", "A local dry-run command that reads a deploy manifest and writes redacted proof material."],
  ["Command plan fixture", "examples/cli/local-command-plan.example.json", "A placeholder-only command catalog with runtime claims blocked."],
  ["Deploy manifest fixture", "examples/deploy/local-deploy-manifest.example.json", "A safe local manifest used by the deploy-plan checker."],
  ["CLI docs", "docs-source/developer-layers/cli.md", "Contribution notes for local checks and reserved managed layers."]
];

const workflow = [
  ["Inspect commands", "Review command helpers and payload shapes before wiring a runtime."],
  ["Plan deploys locally", "Run gc deploy plan against a local manifest to generate redacted evidence for review."],
  ["Keep mutation gated", "Node writes, signing custody, storage publish, and domain deploy remain blocked until proof exists."],
  ["Run local checks", "Use the CLI check and public secret scan before opening changes."]
];

const reservedArtifacts = [
  "Global installer release",
  "Public node mutation",
  "Managed signing custody",
  "Native storage publication",
  "Native domain deployment"
];

export default function CliOpenSourcePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Open-core layer</div>
        <h1>CLI source for GitCaster builders</h1>
        <p className="lede">
          GitCaster now publishes its CLI source as a public-alpha local command
          surface. Builders can inspect command helpers for local push payloads,
          issues, pull requests, MCP serve planning, and deploy-plan evidence while installer,
          production node, signing custody, storage, and domain claims remain
          blocked.
        </p>
        <div className="actions">
          <a className="button primary" href="https://github.com/casteragents/gitcaster/tree/main/apps/cli">CLI source</a>
          <a className="button" href="https://github.com/casteragents/gitcaster/tree/main/examples/cli">Command fixture</a>
          <a className="button" href={sitePath("/open-source/cli-deploy-plan")}>Deploy plan</a>
          <a className="button" href={sitePath("/status")}>Status proof</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Public artifacts</h2>
            <p>These are safe contribution surfaces for local command development.</p>
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
            <p>The CLI layer documents command shapes without claiming live runtime access.</p>
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
            <p>The CLI source is public; managed service operation remains reserved.</p>
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

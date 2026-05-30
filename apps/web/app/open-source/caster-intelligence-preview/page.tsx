import { sitePath } from "../../../lib/site-url";

const artifacts = [
  ["Fixture", "examples/app-shells/caster-intelligence.local-shell.json"],
  ["Checker", "scripts/ecosystem/check-caster-intelligence-preview-public-alpha.cjs"],
  ["Preview JSON", "apps/web/public/gitcaster-caster-intelligence-preview.json"],
  ["Evidence", "launch/evidence/caster-intelligence-preview-public-alpha.json"]
];

const stillBlocked = [
  "source contents publication",
  "native storage publication",
  "native domain mapping",
  "managed runtime endpoint",
  "rollback verification",
  "production readiness"
];

export default function CasterIntelligencePreviewOpenSourcePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Open-core layer</div>
        <h1>Caster Intelligence preview shell</h1>
        <p className="lede">
          GitCaster now publishes a redacted public-alpha shell for Caster Intelligence
          so builders can inspect the intended product surface, safety labels, fixture,
          and proof output before any managed runtime or source release decision.
        </p>
        <div className="actions">
          <a className="button primary" href={sitePath("/ecosystem/caster-intelligence")}>Preview shell</a>
          <a className="button" href={sitePath("/gitcaster-caster-intelligence-preview.json")}>Preview JSON</a>
          <a className="button" href="https://github.com/casteragents/gitcaster/tree/main/scripts/ecosystem">Checker source</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Public artifacts</h2>
            <p>The release exposes metadata and deterministic checks, not private state.</p>
          </div>
          <span className="pill good">public-alpha</span>
        </div>
        <div className="grid">
          {artifacts.map(([name, path]) => (
            <div className="card" key={name}>
              <h3>{name}</h3>
              <p>{path}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Still blocked</h2>
            <p>Promotion is not automatic. Every stronger label needs separate proof.</p>
          </div>
          <span className="pill danger">blocked_external</span>
        </div>
        <div className="grid">
          {stillBlocked.map((item) => (
            <div className="card" key={item}>
              <p>{item}</p>
              <span className="pill danger">blocked_external</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Verification command</h2>
            <p>The checker rejects source-publication, runtime, storage, domain, rollback, and launch claims.</p>
          </div>
          <span className="pill info">deterministic</span>
        </div>
        <pre className="terminal">pnpm run caster-intelligence-preview:check</pre>
      </section>
    </div>
  );
}

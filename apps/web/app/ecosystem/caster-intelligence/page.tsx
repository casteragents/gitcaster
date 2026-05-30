import { TruthStatusPill } from "../../../components/TruthStatusPill";
import { sitePath } from "../../../lib/site-url";

const proofRows = [
  ["Shell fixture", "examples/app-shells/caster-intelligence.local-shell.json"],
  ["Preview proof", "launch/evidence/caster-intelligence-preview-public-alpha.json"],
  ["Public JSON", "apps/web/public/gitcaster-caster-intelligence-preview.json"],
  ["Catalog source", "apps/web/public/gitcaster-app-shell-catalog.json"]
];

const openScope = [
  ["Local page shape", "The public page describes the builder workflow without exposing runtime state."],
  ["Signal map", "Public copy explains intended inputs, proof status, and next review gates."],
  ["Contribution target", "Developers can review the shell, fixture, and checker before deeper source review."]
];

const blockedScope = [
  "source contents publication",
  "native storage publication",
  "native domain mapping",
  "managed runtime endpoint",
  "production readiness",
  "external audit completion"
];

export default function CasterIntelligencePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Builder tool shell</div>
        <h1>Caster Intelligence</h1>
        <p className="lede">
          Public-alpha local preview for the Caster Intelligence builder surface.
          This page publishes the shell, review labels, and proof pointers only;
          source contents, runtime state, managed endpoints, and stronger launch
          claims remain blocked until separate evidence exists.
        </p>
        <div className="actions">
          <a className="button primary" href={sitePath("/open-source/caster-intelligence-preview")}>Open-core note</a>
          <a className="button" href={sitePath("/gitcaster-caster-intelligence-preview.json")}>Preview JSON</a>
          <a className="button" href="https://github.com/casteragents/gitcaster/tree/main/examples/app-shells">Fixture</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Status</h2>
            <p>The current proof covers only redacted local preview metadata and static page output.</p>
          </div>
          <TruthStatusPill status="public-alpha" evidence="launch/evidence/caster-intelligence-preview-public-alpha.json" />
        </div>
        <div className="grid">
          {proofRows.map(([label, value]) => (
            <div className="card" key={label}>
              <h3>{label}</h3>
              <p>{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Open scope</h2>
            <p>These are safe public review surfaces for contributors.</p>
          </div>
          <span className="pill good">public-alpha</span>
        </div>
        <div className="grid">
          {openScope.map(([title, copy]) => (
            <div className="card" key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Blocked scope</h2>
            <p>These labels stay blocked until deterministic proof and rights review exist.</p>
          </div>
          <span className="pill danger">blocked_external</span>
        </div>
        <div className="grid">
          {blockedScope.map((item) => (
            <div className="card" key={item}>
              <p>{item}</p>
              <span className="pill danger">blocked_external</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

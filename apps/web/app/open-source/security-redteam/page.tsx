import { sitePath } from "../../../lib/site-url";

const publicArtifacts = [
  ["Security beta gate", "scripts/security/run-beta-gate.cjs", "Deterministic local gate for secret scans, fake live claims, hosted dependency claims, token/domain freezes, signed mutation blockers, and object-store honesty."],
  ["Redteam suite", "scripts/security/redteam/run-redteam-suite.cjs", "Local redteam runner for crypto invariants, replay attacks, capability abuse, and deployment proof abuse."],
  ["Crypto audit rehearsal", "docs/security/crypto-audit-rehearsal.md", "Contributor-facing rehearsal notes that do not replace an external security audit."],
  ["Public hardening evidence", "launch/evidence/security-redteam-public-hardening-source.json", "Public-alpha evidence tying scripts, docs, blockers, and non-claims together."]
];

const coveredChecks = [
  ["Secret scan", "Public source is scanned for private keys, credential URLs, bearer tokens, and secret-like assignments."],
  ["Fake-live claim blocking", "Unsupported QStorage, CasterCloud, .caster, production, public-node, and token utility claims are rejected or downgraded."],
  ["Hosted dependency blocking", "Hosted service references cannot be described as production, canonical, primary, deployed, or live requirements."],
  ["Capability abuse", "Mutation attempts without the needed signer, capability, or node endpoint stay blocked."],
  ["Deployment proof abuse", "Placeholder, hosted, dry-run, and fake live proofs cannot become production evidence."],
  ["Evidence integrity", "Evidence files must not carry secrets or production approval flags without proof."]
];

const blockedClaims = [
  ["External security audit completion", "blocked_external"],
  ["Production security readiness", "blocked_external"],
  ["Managed infrastructure safety", "blocked_external"],
  ["Public node federation safety", "blocked_external"],
  ["QStorage or CasterCloud live deployment safety", "blocked_external"],
  ["Automated custody or billing safety", "blocked_external"]
];

export default function SecurityRedteamOpenSourcePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Open-core layer</div>
        <h1>Security redteam hardening</h1>
        <p className="lede">
          GitCaster now publishes the local security redteam scripts, beta safety
          gate, audit rehearsal notes, and public hardening evidence as a
          public-alpha developer layer. The release proves deterministic local
          guardrails, not audit completion or production readiness.
        </p>
        <div className="actions">
          <a className="button primary" href="https://github.com/casteragents/gitcaster/tree/main/scripts/security">Security scripts</a>
          <a className="button" href="https://github.com/casteragents/gitcaster/tree/main/scripts/security/redteam">Redteam checks</a>
          <a className="button" href={sitePath("/gitcaster-security-redteam.md")}>Markdown docs</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Public artifacts</h2>
            <p>These files are safe contribution surfaces for local security hardening.</p>
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
            <h2>Deterministic coverage</h2>
            <p>The checker writes evidence for local guardrails and rejected abuse cases.</p>
          </div>
          <span className="pill good">deterministic</span>
        </div>
        <div className="grid">
          {coveredChecks.map(([name, description]) => (
            <div className="card" key={name}>
              <h3>{name}</h3>
              <p>{description}</p>
              <span className="pill info">fixture_only</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Still blocked</h2>
            <p>These claims require external proof and remain outside this public-alpha release.</p>
          </div>
          <span className="pill danger">blocked</span>
        </div>
        <div className="grid">
          {blockedClaims.map(([claim, status]) => (
            <div className="card" key={claim}>
              <h3>{claim}</h3>
              <p>No public release claim is made for this item in the current evidence set.</p>
              <span className="pill danger">{status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Verification command</h2>
            <p>The public-alpha checker runs the redteam suite, PR-27 rehearsal gate, and PR-18 beta safety gate.</p>
          </div>
          <span className="pill info">local proof</span>
        </div>
        <pre className="terminal">pnpm run security-redteam:check</pre>
      </section>
    </div>
  );
}

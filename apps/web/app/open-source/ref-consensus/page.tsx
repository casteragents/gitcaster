import { sitePath } from "../../../lib/site-url";

const publicArtifacts = [
  ["Ref consensus package", "packages/ref-consensus", "Certificate issuing, policy checks, append-only local ledger helpers, verification, conflict evidence, and double-sign detection."],
  ["Ref routes", "apps/node/src/routes/refs.ts", "Local node ref route handling with signed-mutation requirements and unsigned mutation blockers."],
  ["Local ref fixture", "examples/refs/local-ref-certificate-workflow.example.json", "Redacted public fixture for certificate, conflict, double-sign, and blocked proof shapes."],
  ["Ref consensus evidence", "launch/evidence/ref-consensus-local-certificate-source.json", "Deterministic proof for local certificates, append-only ledger verification, conflict evidence, double-sign detection, and HTTP blockers."]
];

const localProofs = [
  ["First certificate", "A local node accepts a signed update from null and issues an alpha-local ref certificate."],
  ["Second certificate", "A second update must use the current head as its from value."],
  ["Append-only ledger", "Existing local ledger entries are not mutated or removed."],
  ["Conflict evidence", "Wrong-from updates produce blocked conflict evidence for manual review."],
  ["Double-sign evidence", "Same node, same repo, same ref, same from, and different to values produce blocked node adjudication evidence."],
  ["Unsigned blocker", "Unsigned HTTP ref mutations return blocked responses instead of updating refs."]
];

const blockedModes = [
  "Public consensus",
  "Remote ref durability",
  "Normal git transport",
  "QStorage publication",
  "CasterCloud managed deployment",
  "Production runtime operations"
];

export default function RefConsensusOpenSourcePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Open-core layer</div>
        <h1>Ref-consensus local certificates for GitCaster builders</h1>
        <p className="lede">
          GitCaster now publishes the ref-consensus package and local certificate
          workflow as a public-alpha developer layer. Builders can inspect signed
          ref updates, append-only local ledgers, conflict evidence, double-sign
          detection, and blocked public consensus proofs while remote durability,
          normal git transport, managed deployment, and production runtime claims
          stay blocked.
        </p>
        <div className="actions">
          <a className="button primary" href="https://github.com/casteragents/gitcaster/tree/main/packages/ref-consensus">Ref consensus source</a>
          <a className="button" href="https://github.com/casteragents/gitcaster/tree/main/examples/refs">Fixture</a>
          <a className="button" href={sitePath("/gitcaster-ref-consensus.md")}>Markdown docs</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Public artifacts</h2>
            <p>These files are safe contribution surfaces for local ref certificate work.</p>
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
            <h2>Local certificate scope</h2>
            <p>The checker proves local ledger behavior without claiming public infrastructure.</p>
          </div>
          <span className="pill info">alpha-local runtime</span>
        </div>
        <div className="grid">
          {localProofs.map(([name, description]) => (
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
            <h2>Still blocked</h2>
            <p>These labels do not move until deterministic external proof exists.</p>
          </div>
          <span className="pill danger">blocked</span>
        </div>
        <div className="grid">
          {blockedModes.map((mode) => (
            <div className="card" key={mode}>
              <h3>{mode}</h3>
              <p>No public release claim is made for this mode in the current evidence set.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Verification command</h2>
            <p>The deterministic checker writes the public evidence file used by the status page.</p>
          </div>
          <span className="pill good">deterministic</span>
        </div>
        <pre className="terminal">pnpm run ref-consensus:check</pre>
      </section>
    </div>
  );
}

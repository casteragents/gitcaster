import { sitePath } from "../../../lib/site-url";

const publicArtifacts = [
  ["Object store package", "packages/object-store", "Local object records, deterministic hashes, local-alpha manifests, and endpoint blocker proofs."],
  ["Push-local service", "apps/node/src/services/push-local-service.ts", "Signed local path push handling, object manifest creation, local ref certificate issuance, and safety scanning."],
  ["Push-local CLI payload", "apps/cli/src/commands/push-local.ts", "Public-alpha command payload shape for local bundle inspection."],
  ["Local object fixture", "examples/push-local/local-object-manifest.example.json", "A public fixture showing local manifest and blocked endpoint states."],
  ["Push-local evidence", "launch/evidence/push-local-object-store-source.json", "Deterministic proof for local manifest creation, ref certificate records, and unsigned mutation blockers."]
];

const localScope = [
  ["Object manifest", "Local bundle file list with sha256 object hashes and deterministic root hash."],
  ["Safety scan", "Secret-risk and denied path checks run before local manifest writes."],
  ["Local ref certificate", "Ref certificate is emitted as alpha-local evidence and does not claim remote durability."],
  ["Repo events", "Local commit and ref-certificate events are written to the local event list."],
  ["Endpoint blockers", "QStorage and CasterCloud proofs stay requires-endpoint until live proof exists."],
  ["HTTP blockers", "Unsigned push-local mutations return blocked responses instead of writing objects."]
];

const blockedModes = [
  "QStorage publication",
  "Normal git push transport",
  "Remote ref durability",
  "Public object hosting",
  "CasterCloud managed deployment",
  "Production runtime operations"
];

export default function PushLocalObjectStoreOpenSourcePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Open-core layer</div>
        <h1>Push-local object manifests for GitCaster builders</h1>
        <p className="lede">
          GitCaster now publishes the object-store package and push-local manifest
          workflow as a public-alpha developer layer. Builders can inspect local
          bundle hashing, object manifests, safety scanning, ref certificate
          records, and blocked QStorage/CasterCloud proofs while QStorage
          publication, normal git transport, remote ref durability, public object
          hosting, managed deployment, and production runtime claims stay blocked.
        </p>
        <div className="actions">
          <a className="button primary" href="https://github.com/casteragents/gitcaster/tree/main/packages/object-store">Object store source</a>
          <a className="button" href="https://github.com/casteragents/gitcaster/tree/main/examples/push-local">Fixture</a>
          <a className="button" href={sitePath("/gitcaster-push-local-object-store.md")}>Markdown docs</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Public artifacts</h2>
            <p>These files are safe contribution surfaces for local object manifest work.</p>
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
            <h2>Local manifest scope</h2>
            <p>The push-local layer proves local bundle behavior without claiming public infrastructure.</p>
          </div>
          <span className="pill info">alpha-local runtime</span>
        </div>
        <div className="grid">
          {localScope.map(([name, description]) => (
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

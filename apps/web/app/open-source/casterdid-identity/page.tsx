import { sitePath } from "../../../lib/site-url";

const publicArtifacts = [
  ["DID helpers", "packages/identity/src/did-caster.ts", "Create did:caster identifiers and DID documents from local public keys."],
  ["Key helpers", "packages/identity/src/ed25519.ts", "Generate local Ed25519 key pairs and verify signatures for developer tests."],
  ["Local key paths", "packages/identity/src/key-storage.ts", "Resolve local .gitcaster identity files without publishing private key material."],
  ["Signed envelopes", "packages/identity/src/signature-envelope.ts", "Build and verify local signed mutation envelopes for repo contribution flows."],
  ["Canonical JSON", "packages/identity/src/canonical-json.ts", "Hash stable JSON payloads before signing local envelopes."],
  ["Identity fixture", "examples/identity/local-casterdid-identity.example.json", "Public-key-only fixture for local inspection."]
];

const blockedClaims = [
  "Managed signing custody",
  "Operator private keys",
  "Public runtime endpoint",
  "Public node mutation",
  "Storage publication",
  "Native domain routing",
  "Production runtime operation"
];

export default function CasterDIDIdentityOpenSourcePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Open-core layer</div>
        <h1>CasterDID identity for local GitCaster builders</h1>
        <p className="lede">
          GitCaster now publishes its contribution-safe CasterDID identity spine
          as a public-alpha developer layer. Builders can inspect DID documents,
          local key helpers, signed mutation envelopes, canonical hashes, and a
          public-key-only fixture without receiving managed custody, public node
          mutation, storage, domain, or production runtime claims.
        </p>
        <div className="actions">
          <a className="button primary" href="https://github.com/casteragents/gitcaster/tree/main/packages/identity">Identity source</a>
          <a className="button" href="https://github.com/casteragents/gitcaster/tree/main/examples/identity">Local fixture</a>
          <a className="button" href={sitePath("/gitcaster-casterdid-identity.json")}>Evidence JSON</a>
          <a className="button" href={sitePath("/gitcaster-casterdid-identity-public-smoke.json")}>Public smoke JSON</a>
          <a className="button" href={sitePath("/casterdid-identity.md")}>Identity notes</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Public artifacts</h2>
            <p>These files are safe contribution surfaces for local identity review.</p>
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
            <h2>Blocked claims</h2>
            <p>These require deterministic receipts before any stronger label.</p>
          </div>
          <span className="pill danger">blocked_external</span>
        </div>
        <div className="grid">
          {blockedClaims.map((item) => (
            <div className="card" key={item}>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Verification command</h2>
            <p>The checker generates local proof material and writes public JSON.</p>
          </div>
          <span className="pill info">deterministic</span>
        </div>
        <pre className="terminal">pnpm run casterdid-identity:check{"\n"}pnpm run casterdid-identity:public-smoke</pre>
      </section>
    </div>
  );
}

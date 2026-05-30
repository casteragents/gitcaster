import { sitePath } from "../../../lib/site-url";

const publicArtifacts = [
  ["Type contracts", "packages/protocol/src/types.ts", "Typed identities, capabilities, repo records, node health, deploy records, domains, and proof-only reward records."],
  ["Event names", "packages/protocol/src/events.ts", "Append-only event vocabulary for contributor review."],
  ["Statuses", "packages/protocol/src/status.ts", "Shared truth labels used by local and public-alpha checks."],
  ["Content types", "packages/protocol/src/content-types.ts", "Portable media types for protocol-shaped JSON."],
  ["Error codes", "packages/protocol/src/error-codes.ts", "Structured failure vocabulary for guarded flows."],
  ["Local envelope fixture", "examples/protocol/local-protocol-envelope.example.json", "Placeholder-only envelope for schema inspection."]
];

const blockedClaims = [
  "Public runtime endpoint",
  "Managed signing custody",
  "Public node mutation",
  "QStorage publication",
  "Native domain routing",
  "Production runtime operation"
];

export default function ProtocolTypesOpenSourcePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Open-core layer</div>
        <h1>Protocol types for local GitCaster builders</h1>
        <p className="lede">
          GitCaster now publishes its contribution-safe protocol vocabulary as
          a public-alpha developer layer. Builders can inspect type contracts,
          events, statuses, content types, error codes, fixture names, and a
          placeholder-only envelope without receiving a public runtime, managed
          custody, node mutation, storage, domain, or production claim.
        </p>
        <div className="actions">
          <a className="button primary" href="https://github.com/casteragents/gitcaster/tree/main/packages/protocol">Protocol source</a>
          <a className="button" href="https://github.com/casteragents/gitcaster/tree/main/examples/protocol">Local fixture</a>
          <a className="button" href={sitePath("/gitcaster-protocol-types.json")}>Evidence JSON</a>
          <a className="button" href={sitePath("/gitcaster-protocol-types-public-smoke.json")}>Public smoke JSON</a>
          <a className="button" href={sitePath("/protocol-types.md")}>Protocol notes</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Public artifacts</h2>
            <p>These files are safe contribution surfaces for protocol review.</p>
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
            <p>The checker rebuilds protocol evidence and writes public proof JSON.</p>
          </div>
          <span className="pill info">deterministic</span>
        </div>
        <pre className="terminal">pnpm run protocol-types:check{"\n"}pnpm run protocol-types:public-smoke</pre>
      </section>
    </div>
  );
}

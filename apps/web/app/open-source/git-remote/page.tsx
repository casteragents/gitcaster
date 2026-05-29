import { sitePath } from "../../../lib/site-url";

const publicArtifacts = [
  ["Remote helper source", "apps/git-remote-gitcaster", "GitCaster URL parsing, remote-helper session handling, and transport status formatting."],
  ["Blocked transport fixture", "examples/git-remote/blocked-transport-plan.example.json", "A public fixture that records which Git transport modes remain blocked."],
  ["Remote helper docs", "git-remote-gitcaster.md", "A public markdown page that keeps pack push, fetch, and clone proof blocked."]
];

const diagnostics = [
  ["Parse URLs", "Inspect gitcaster:// remote URL shape and did:caster ownership."],
  ["List refs", "Ask a configured local node for refs without claiming pack fetch."],
  ["Explain push", "Return a blocked pack-push decision with required proof names."],
  ["Explain fetch", "Return a blocked pack-fetch decision with required proof names."]
];

const blockedModes = [
  "Full Git pack push",
  "Full Git pack fetch or clone",
  "Public node mutation",
  "Native storage publication",
  "Multi-node transport evidence"
];

export default function GitRemoteOpenSourcePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Open-core layer</div>
        <h1>Git remote helper source for GitCaster builders</h1>
        <p className="lede">
          GitCaster now publishes the git-remote-gitcaster source as a
          public-alpha helper scaffold. Builders can review URL parsing,
          ref-list diagnostics, and blocked transport decisions while pack push,
          fetch, clone, public node mutation, and native storage proof remain
          blocked.
        </p>
        <div className="actions">
          <a className="button primary" href="https://github.com/casteragents/gitcaster/tree/main/apps/git-remote-gitcaster">Remote helper source</a>
          <a className="button" href="https://github.com/casteragents/gitcaster/tree/main/examples/git-remote">Blocked fixture</a>
          <a className="button" href={sitePath("/git-remote-gitcaster.md")}>Markdown docs</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Public artifacts</h2>
            <p>These files are safe contribution surfaces for remote-helper development.</p>
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
            <h2>Diagnostic scope</h2>
            <p>The helper is public for command-shape review, parser tests, and proof planning.</p>
          </div>
          <span className="pill info">diagnostic-only</span>
        </div>
        <div className="grid">
          {diagnostics.map(([name, description]) => (
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
            <p>These require deterministic transport proof before receiving a stronger label.</p>
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

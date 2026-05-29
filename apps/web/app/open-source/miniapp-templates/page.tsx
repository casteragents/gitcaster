import { sitePath } from "../../../lib/site-url";

const publicArtifacts = [
  ["Template package", "packages/playground-templates", "Typed miniapp shell metadata and deterministic status checks."],
  ["Local shell fixture", "examples/miniapps/caster-claim-miniapp.local-shell.json", "A placeholder-only manifest for reviewing the public template boundary."],
  ["Template docs", "docs-source/developer-layers/miniapp-templates.md", "Contribution notes that keep runtime, storage, and native deploy proof blocked."]
];

const workflow = [
  ["Review the shell", "Inspect the local template, assets list, and manifest shape."],
  ["Keep runtime blocked", "Do not add endpoint, storage, custody, or native deploy claims without proof."],
  ["Contribute safely", "Use the package check and public secret scan before opening changes."]
];

const reservedArtifacts = [
  "Managed runtime endpoints",
  "Native storage publication",
  "Native domain deployment",
  "Account custody and production signing",
  "Billing, orchestration, and managed service operation"
];

export default function MiniappTemplatesOpenSourcePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Open-core layer</div>
        <h1>Miniapp templates for GitCaster builders</h1>
        <p className="lede">
          GitCaster now publishes the Caster Claim miniapp shell as a public-alpha
          developer template. Builders can study the local manifest, required
          assets, and contribution checks while runtime and native publish proof
          remain explicitly blocked.
        </p>
        <div className="actions">
          <a className="button primary" href="https://github.com/casteragents/gitcaster/tree/main/packages/playground-templates">Template source</a>
          <a className="button" href="https://github.com/casteragents/gitcaster/tree/main/examples/miniapps">Miniapp fixture</a>
          <a className="button" href={sitePath("/status")}>Status proof</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Public artifacts</h2>
            <p>These are safe contribution surfaces for local app and miniapp builders.</p>
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
            <p>The template layer is for review and contribution, not live runtime mutation.</p>
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
            <p>The template shell is public; managed platform operations remain reserved.</p>
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

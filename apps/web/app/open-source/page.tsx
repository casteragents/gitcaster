import { sitePath } from "../../lib/site-url";

const openLayers = [
  ["ROS packages", "Robot and agent adapters, message bridges, sample launch files, and local development workflows."],
  ["APIs and SDKs", "Protocol types, client libraries, CLI commands, MCP tools, and signed-repo developer interfaces."],
  ["Simulators", "Local simulation harnesses, example worlds, fixtures, and deterministic proof checkers."],
  ["Digital twin exporters", "Portable scene, asset, manifest, and robot-state exporters for local inspection."],
  ["Apps and miniapps", "GO-gated public app shells, compatibility adapters, manifests, and contribution docs after leak scans pass."],
  ["Docs and examples", "Architecture notes, status pages, runbooks, templates, and public roadmap handoffs."],
];

const reservedLayers = [
  ["Managed orchestration", "The hosted control plane, deployment coordinator, scheduling service, and account operations."],
  ["Large simulation capacity", "The managed simulation cluster, pooled compute, queue allocation, and capacity tuning."],
  ["Platform optimizations", "Proprietary schedulers, placement heuristics, cost controls, and managed scaling logic."],
  ["Enterprise controls", "Organization governance, private policy packs, advanced audit workflows, and managed support."],
  ["Fleet dashboard", "The commercial dashboard for managed device groups, usage, billing, and service-level workflows."],
  ["Secrets and custody", "Operator credentials, private keys, managed signing custody, and infrastructure secrets."],
];

const releaseRules = [
  "Every public push runs the public secret scan before publication.",
  "GO-gated app and miniapp surfaces move public only after proof files show they are safe to publish.",
  "Twitter/X updates are posted from @casterchain with @gitcasterx, @CasterAI_, the GitHub repo, and the GitCaster site.",
  "Farcaster posts use the @casterchain account and contain only the X update link.",
];

export default function OpenSourcePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Open core</div>
        <h1>Build in public, keep the managed platform durable</h1>
        <p className="lede">
          GitCaster is becoming the public contribution surface for Caster developers.
          The developer layers are Apache 2.0. The managed platform remains a
          commercial service so the network can support hosted reliability, custody,
          billing, and larger-scale operations.
        </p>
        <div className="actions">
          <a className="button primary" href="https://github.com/casteragents/gitcaster">GitHub repo</a>
          <a className="button" href={sitePath("/")}>GitCaster site</a>
          <a className="button" href={sitePath("/status")}>Proof status</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Open developer layers</h2>
            <p>These are the public contribution tracks intended for builders.</p>
          </div>
          <span className="pill good">Apache 2.0</span>
        </div>
        <div className="grid">
          {openLayers.map(([name, description]) => (
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
            <h2>Reserved managed layers</h2>
            <p>These stay commercial because they operate the managed product.</p>
          </div>
          <span className="pill warn">Commercial</span>
        </div>
        <div className="grid">
          {reservedLayers.map(([name, description]) => (
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
            <h2>Publication rules</h2>
            <p>Public work needs proof before stronger labels appear.</p>
          </div>
          <span className="pill info">transparent</span>
        </div>
        <div className="grid">
          {releaseRules.map((rule) => (
            <div className="card" key={rule}>
              <p>{rule}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

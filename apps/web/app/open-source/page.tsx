import { PublicReleaseFeed } from "../../components/PublicReleaseFeed";
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
  "Casterchain app updates are posted first from @casterai with the GitCaster site and GitHub repo.",
  "Twitter/X updates are posted from @casterchain with @gitcasterx, @CasterAI_, the GitHub repo, the GitCaster site, and the Casterchain post link.",
  "Farcaster posts use the @casterchain account in /caster with the X post link and Casterchain post link.",
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
            <h2>Latest public layers</h2>
            <p>New developer layers give contributors local proof surfaces without exposing managed infrastructure.</p>
          </div>
          <span className="pill good">public-alpha</span>
        </div>
        <div className="grid">
          <div className="card">
            <h3>Repo records and issue/PR workflow</h3>
            <p>Repo IDs, append-only events, issue records, PR reviews, record-only merges, and mutation blockers are now public.</p>
            <div className="mini-list">
              <a href={sitePath("/open-source/repo-records")}>Website page</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/packages/repo-records">Source</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/examples/repo-records">Fixture</a>
            </div>
          </div>
          <div className="card">
            <h3>Local node API source</h3>
            <p>Loopback HTTP routes, local health/status, mutation blockers, and endpoint-gated storage/deploy/domain routes are now public.</p>
            <div className="mini-list">
              <a href={sitePath("/open-source/local-node-api")}>Website page</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/apps/node">Source</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/examples/node">Fixture</a>
            </div>
          </div>
          <div className="card">
            <h3>MCP source</h3>
            <p>JSON-RPC stdio server source, beta tool schemas, structured blockers, and redaction checks are now public.</p>
            <div className="mini-list">
              <a href={sitePath("/open-source/mcp-source")}>Website page</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/apps/mcp">Source</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/examples/mcp">Fixture</a>
            </div>
          </div>
          <div className="card">
            <h3>Git remote helper</h3>
            <p>Remote-helper source, URL parsing, ref-list diagnostics, and blocked transport decisions are now public.</p>
            <div className="mini-list">
              <a href={sitePath("/open-source/git-remote")}>Website page</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/apps/git-remote-gitcaster">Source</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/examples/git-remote">Fixture</a>
            </div>
          </div>
          <div className="card">
            <h3>CLI source</h3>
            <p>Local command helpers for push payloads, issues, pull requests, and MCP serve planning are now public.</p>
            <div className="mini-list">
              <a href={sitePath("/open-source/cli")}>Website page</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/apps/cli">Source</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/examples/cli">Fixture</a>
            </div>
          </div>
          <div className="card">
            <h3>TypeScript SDK</h3>
            <p>Typed client helpers, local examples, redaction, and proof-gated runtime methods are now public.</p>
            <div className="mini-list">
              <a href={sitePath("/open-source/typescript-sdk")}>Website page</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/packages/sdk-typescript">Source</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/examples/sdk">Examples</a>
            </div>
          </div>
          <div className="card">
            <h3>Miniapp templates</h3>
            <p>Local app shell metadata, miniapp manifests, and blocked-runtime checks are now public.</p>
            <div className="mini-list">
              <a href={sitePath("/open-source/miniapp-templates")}>Website page</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/packages/playground-templates">Source</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/examples/miniapps">Fixture</a>
            </div>
          </div>
          <div className="card">
            <h3>API and SDK tutorials</h3>
            <p>Local request-shape helpers, public read fixtures, and guarded agent-post examples are now public.</p>
            <div className="mini-list">
              <a href={sitePath("/open-source/api-sdk")}>Website page</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/packages/api-tutorials">Source</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/examples/api">Examples</a>
            </div>
          </div>
          <div className="card">
            <h3>ROS adapters</h3>
            <p>Local launch plans, topic schemas, bridge fixtures, and boundary checks are now public.</p>
            <div className="mini-list">
              <a href={sitePath("/open-source/ros")}>Website page</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/packages/ros-adapters">Source</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/examples/ros">Fixtures</a>
            </div>
          </div>
          <div className="card">
            <h3>Local simulator</h3>
            <p>Deterministic world stepping, an example agent/app/robot world, and digital twin JSON exports are now public.</p>
            <div className="mini-list">
              <a href={sitePath("/open-source/simulator")}>Website page</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/packages/simulator">Source</a>
              <a href="https://github.com/casteragents/gitcaster/tree/main/examples/worlds">World fixture</a>
            </div>
          </div>
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

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Public update feed</h2>
            <p>Each update keeps the repo, website, X post, and Farcaster mirror tied together.</p>
          </div>
          <span className="pill good">current</span>
        </div>
        <PublicReleaseFeed />
      </section>
    </div>
  );
}

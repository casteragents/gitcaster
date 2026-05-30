import { sitePath } from "../../../lib/site-url";

const publicArtifacts = [
  ["Tool registry", "apps/mcp/src/tool-registry.ts", "Local catalog wiring for the GitCaster MCP tool names."],
  ["Schemas", "apps/mcp/src/schemas.ts", "Beta tool input and output shapes for contributor review."],
  ["Tool handlers", "apps/mcp/src/tools", "Local handlers with structured blockers for external or custody-backed actions."],
  ["Local plan fixture", "examples/mcp/local-tool-plan.example.json", "Placeholder-only workflow proof that stays alpha-local."],
  ["Agent notes", "docs/agent-skills.md", "Human-readable scope notes for safe agent-facing contributions."]
];

const localWorkflow = [
  ["Review names", "Inspect tool naming, schema shape, and local command boundaries."],
  ["Check blockers", "Confirm storage, domain, custody, and public mutation paths stop without proof."],
  ["Use fixtures", "Run the placeholder-only local tool plan before proposing new tool behavior."],
  ["Keep receipts", "Write deterministic evidence before any stronger release label is considered."]
];

const blockedClaims = [
  "Public MCP gateway endpoint",
  "Managed signing custody",
  "Public node mutation",
  "QStorage publication",
  "Native domain routing",
  "Production runtime operation"
];

export default function AgentSkillsOpenSourcePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Open-core layer</div>
        <h1>Agent skills for local GitCaster builders</h1>
        <p className="lede">
          GitCaster now publishes the agent-facing MCP skill notes as a
          public-alpha developer layer. Builders can inspect tool names, schemas,
          local fixtures, and structured blocker behavior without receiving a
          public gateway, managed custody, node mutation, storage, domain, or
          production runtime claim.
        </p>
        <div className="actions">
          <a className="button primary" href="https://github.com/casteragents/gitcaster/tree/main/apps/mcp">MCP source</a>
          <a className="button" href="https://github.com/casteragents/gitcaster/tree/main/examples/mcp">Local fixture</a>
          <a className="button" href={sitePath("/gitcaster-agent-skills.json")}>Evidence JSON</a>
          <a className="button" href={sitePath("/agent-skills.md")}>Agent notes</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Public artifacts</h2>
            <p>These files are safe contribution surfaces for agent-tool review.</p>
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
            <p>The layer is useful for agent developers while external operations stay blocked.</p>
          </div>
          <span className="pill info">local inspection</span>
        </div>
        <div className="grid">
          {localWorkflow.map(([name, description]) => (
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
            <p>The checker rebuilds MCP evidence and writes public agent-skills proof JSON.</p>
          </div>
          <span className="pill info">deterministic</span>
        </div>
        <pre className="terminal">pnpm run agent-skills:check</pre>
      </section>
    </div>
  );
}

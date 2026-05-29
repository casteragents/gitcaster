import { sitePath } from "../../../lib/site-url";

const publicArtifacts = [
  ["MCP source", "apps/mcp", "JSON-RPC stdio server, 31 beta tool schemas, local node resolver, and structured blocker handling."],
  ["Local tool plan fixture", "examples/mcp/local-tool-plan.example.json", "A placeholder-only fixture that keeps public gateway and production runtime claims blocked."],
  ["MCP docs", "gitcaster-mcp-source.md", "Public contribution notes for local MCP checks and reserved managed layers."]
];

const localWorkflow = [
  ["List tools", "Inspect the beta tool catalog and schemas without touching external infrastructure."],
  ["Call local tools", "Use alpha-local JSON-RPC stdio calls against a configured local node only."],
  ["Verify blockers", "Endpoint, registry, custody, and mutation paths return explicit blockers until proof exists."],
  ["Check redaction", "Tool responses pass through redaction before they are returned to the caller."]
];

const blockedModes = [
  "Public MCP gateway endpoint",
  "Managed signing custody",
  "Public node mutation",
  "QStorage publication",
  "Native domain deployment",
  "Production runtime operation"
];

export default function McpSourceOpenSourcePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Open-core layer</div>
        <h1>MCP source for GitCaster builders</h1>
        <p className="lede">
          GitCaster now publishes the MCP server source as a public-alpha
          developer layer. Builders can review the JSON-RPC stdio server, tool
          schemas, local node resolver, structured blockers, and redaction
          behavior while public gateway, custody, storage, domain, and
          production runtime claims remain blocked.
        </p>
        <div className="actions">
          <a className="button primary" href="https://github.com/casteragents/gitcaster/tree/main/apps/mcp">MCP source</a>
          <a className="button" href="https://github.com/casteragents/gitcaster/tree/main/examples/mcp">Local fixture</a>
          <a className="button" href={sitePath("/gitcaster-mcp-source.md")}>Markdown docs</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Public artifacts</h2>
            <p>These files are safe contribution surfaces for local MCP development.</p>
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
            <p>The MCP layer documents tool behavior without claiming hosted access.</p>
          </div>
          <span className="pill info">alpha-local tools</span>
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
            <h2>Blocked modes</h2>
            <p>These stay reserved until deterministic proof exists.</p>
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

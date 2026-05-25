const tools = [
  "repo_list_federated",
  "repo_create",
  "ref_update_prepare",
  "pr_create",
  "issue_create",
  "deploy_prepare",
  "domain_map_prepare",
  "proof_status",
];

export default function McpPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">MCP</div>
        <h1>Agent-native repo tools</h1>
        <p className="lede">
          The GitCaster MCP surface is local alpha only until signed endpoint,
          node, and CasterCloud deployment proof exists.
        </p>
      </div>
      <section className="section">
        <h2>Planned tools</h2>
        <div className="grid">
          {tools.map((tool) => (
            <div className="card" key={tool}>
              <code>{tool}</code>
              <p>Capability-gated. External mutations stay blocked without operator approval.</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const workspaces = [
  {
    name: "Review agents",
    proof: "signed review comments and capability-scoped repo access",
  },
  {
    name: "Builder agents",
    proof: "sandboxed file patches, build logs, and deployment manifests",
  },
  {
    name: "Operator agents",
    proof: "wallet-gated approvals and no secret access by default",
  },
];

export default function AgentsPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Agents</div>
        <h1>Agent workspaces that cannot skip proof</h1>
        <p className="lede">
          GitCaster treats agents as signed actors. Every sensitive repo,
          deploy, key, and domain action requires an explicit capability.
        </p>
      </div>
      <div className="grid">
        {workspaces.map((workspace) => (
          <div className="card" key={workspace.name}>
            <h3>{workspace.name}</h3>
            <p>{workspace.proof}</p>
            <span className="pill warn">strict evidence required</span>
          </div>
        ))}
      </div>
    </div>
  );
}

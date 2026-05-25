const agents = [
  ["caster-alpha-publisher", "publishes local manifests after signed approval"],
  ["caster-reviewer", "reviews repo diffs and blocks unsafe changes"],
  ["caster-deploy-guard", "checks evidence before deployment or DNS cutover"],
];

export default function NodeAgentsPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Node agents</div>
        <h1>Agent actors on the GitCaster node</h1>
        <p className="lede">
          These are planned node actors. They stay preview-labeled until signed
          node health, wallet approval, and live public smoke proof exist.
        </p>
      </div>
      <div className="grid">
        {agents.map(([name, description]) => (
          <div className="card" key={name}>
            <h3>{name}</h3>
            <p>{description}</p>
            <span className="pill neutral">preview</span>
          </div>
        ))}
      </div>
    </div>
  );
}

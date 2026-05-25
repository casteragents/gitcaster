const layers = [
  ["Identity", "CasterDID, signed mutations, capability scopes"],
  ["Git network", "content-addressed objects and signed ref certificates"],
  ["Runtime", "CasterRPC gateway and Caster node workers"],
  ["Storage", "CStorage/QStorage-compatible bundles and snapshots"],
  ["Queues", "CQueue/QQ-style outbox and materialized cache"],
  ["Proofs", "launch envelopes, rollback evidence, and burn-in gates"],
];

export default function ArchitecturePage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Architecture</div>
        <h1>CasterCloud first, canary first</h1>
        <p className="lede">
          GitCaster moves from local contracts to public websites through a
          controlled gateway, canary domains, rollback targets, and strict proof
          envelopes.
        </p>
      </div>
      <div className="grid">
        {layers.map(([name, description]) => (
          <div className="card" key={name}>
            <h3>{name}</h3>
            <p>{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

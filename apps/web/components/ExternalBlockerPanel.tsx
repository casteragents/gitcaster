const blockers = [
  ["QStorage publication", "Endpoint, write, namespace, and verify proofs are not part of the public repo yet."],
  ["Managed CasterCloud deployment", "The commercial orchestration layer remains closed until a signed release proof exists."],
  [".caster registry", "Native domain registry and resolver proof are still operator-controlled evidence."],
  ["Public node federation", "Signed multi-node health, rollback, and burn-in evidence is still required."],
  ["Hosted installer", "Public install receipts and rollback proof are required before stronger labels."],
  ["$GITCASTER utility", "The token address is published, but utility stays proof-only until contract, governance, and audit evidence exist."],
  ["External security audit", "Security packages are open, but production security claims require independent audit evidence."],
  ["Sensitive app imports", "CasterAgents runtime state and secret-risk app folders stay closed until redaction and GO proofs pass."]
];

export function ExternalBlockerPanel() {
  return (
    <div className="grid">
      {blockers.map(([title, body]) => (
        <div className="card" key={title}>
          <h3>{title}</h3>
          <p>{body}</p>
        </div>
      ))}
    </div>
  );
}

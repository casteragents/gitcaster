import { TruthStatusPill } from "./TruthStatusPill";

const items = [
  ["CasterDID signatures", "Every action should be signed and auditable."],
  ["Capability gates", "Mutating actions require scoped authority."],
  ["Replay resistance", "Signed records track nonces and scopes."],
  ["Proof mapping", "Every public claim must map to evidence."],
  ["Security posture", "Security claims stay audit-gated."]
];

export function SecurityPosturePanel() {
  return (
    <div className="grid">
      {items.map(([title, body]) => (
        <div className="card" key={title}>
          <h3>{title}</h3>
          <p>{body}</p>
          <TruthStatusPill status={title === "Security posture" ? "requires-audit" : "alpha-local"} evidence={title === "Security posture" ? undefined : "launch/evidence"} />
        </div>
      ))}
    </div>
  );
}

import { evidenceLinks } from "../lib/evidence-links";
import { TruthStatusPill } from "./TruthStatusPill";

export function ProofPanel() {
  return (
    <div className="grid">
      {evidenceLinks.map((item) => (
        <div className="card" key={item.label}>
          <h3>{item.label}</h3>
          <p>{item.path}</p>
          <TruthStatusPill status={item.status} evidence={item.status === "alpha-local" ? item.path : undefined} />
        </div>
      ))}
    </div>
  );
}

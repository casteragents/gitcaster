import { TruthStatusPill } from "./TruthStatusPill";

export function DomainHonestyPanel() {
  return (
    <div className="grid">
      <div className="card">
        <h3>.caster namespace</h3>
        <p>Registry proof is required before any namespace assignment can receive a stronger status.</p>
        <TruthStatusPill status="requires-registry" />
      </div>
      <div className="card">
        <h3>gitcaster.casterchain</h3>
        <p>Reserved as product target language only in PR-12. Registry evidence is still required.</p>
        <TruthStatusPill status="blocked" />
      </div>
    </div>
  );
}

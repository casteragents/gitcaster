import { TruthStatusPill } from "./TruthStatusPill";

export function DeployHonestyPanel() {
  return (
    <div className="grid">
      <div className="card">
        <h3>QStorage</h3>
        <p>Requires endpoint, namespace, publish receipt, and verify receipt.</p>
        <TruthStatusPill status="requires-endpoint" />
      </div>
      <div className="card">
        <h3>CasterCloud</h3>
        <p>Requires deploy endpoint, project, release channel, and signed release evidence.</p>
        <TruthStatusPill status="requires-endpoint" />
      </div>
      <div className="card">
        <h3>Quilibrium target</h3>
        <p>Production target is CasterCloud-first and QStorage-backed once proof exists.</p>
        <TruthStatusPill status="blocked" />
      </div>
    </div>
  );
}

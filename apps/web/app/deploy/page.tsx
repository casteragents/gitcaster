import { DeployHonestyPanel } from "../../components/DeployHonestyPanel";

export default function DeployPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Deploy</div>
        <h1>CasterCloud-first path</h1>
        <p className="lede">QStorage and CasterCloud surfaces require endpoints, receipts, and signed release evidence. PR-12 shows blockers only.</p>
      </div>
      <DeployHonestyPanel />
    </div>
  );
}

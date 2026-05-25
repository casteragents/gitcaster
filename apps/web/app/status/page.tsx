import { ExternalBlockerPanel } from "../../components/ExternalBlockerPanel";
import { ProofPanel } from "../../components/ProofPanel";
import { TruthTable } from "../../components/TruthTable";

export default function StatusPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Truth table</div>
        <h1>Status and proof</h1>
        <p className="lede">Every row has evidence or a blocker. Production launch gate remains blocked until PR-32.</p>
      </div>
      <TruthTable />
      <section className="section">
        <h2>Evidence</h2>
        <ProofPanel />
      </section>
      <section className="section">
        <h2>External blockers</h2>
        <ExternalBlockerPanel />
      </section>
    </div>
  );
}

import { PRODUCT } from "../lib/caster-copy";
import { TruthStatusPill } from "./TruthStatusPill";

export function TokenHonestyPanel() {
  return (
    <div className="grid">
      <div className="card">
        <h3>{PRODUCT.token}</h3>
        <p>{PRODUCT.tokenAddress}</p>
        <TruthStatusPill status="proof-only" />
      </div>
      <div className="card">
        <h3>Utility</h3>
        <p>Planned utility requires contract, audit, and governance evidence before stronger labels appear.</p>
        <TruthStatusPill status="requires-contract" />
      </div>
      <div className="card">
        <h3>Governance</h3>
        <p>Governance is a required proof gate, not a PR-12 claim.</p>
        <TruthStatusPill status="requires-governance" />
      </div>
      <div className="card">
        <h3>Audit</h3>
        <p>Token mechanics stay claim-frozen until external audit evidence exists.</p>
        <TruthStatusPill status="requires-audit" />
      </div>
    </div>
  );
}

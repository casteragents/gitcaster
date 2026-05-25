import { TokenHonestyPanel } from "../../components/TokenHonestyPanel";

export default function TokenPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">$CASTER</div>
        <h1>Token honesty</h1>
        <p className="lede">$CASTER is shown with proof-only/planned utility in PR-12. Contract, audit, and governance proof are required before stronger claims appear.</p>
      </div>
      <TokenHonestyPanel />
    </div>
  );
}

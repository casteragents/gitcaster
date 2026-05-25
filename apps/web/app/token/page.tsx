import { TokenHonestyPanel } from "../../components/TokenHonestyPanel";
import { PRODUCT } from "../../lib/caster-copy";

export default function TokenPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">{PRODUCT.token}</div>
        <h1>Token honesty</h1>
        <p className="lede">{PRODUCT.token} is shown with proof-only/planned utility. Contract, audit, and governance proof are required before stronger claims appear.</p>
      </div>
      <TokenHonestyPanel />
    </div>
  );
}

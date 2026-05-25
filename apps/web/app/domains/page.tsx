import { DomainHonestyPanel } from "../../components/DomainHonestyPanel";

export default function DomainsPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Domains</div>
        <h1>Registry-gated names</h1>
        <p className="lede">The .caster namespace remains blocked until registry proof exists. PR-12 does not assign names.</p>
      </div>
      <DomainHonestyPanel />
    </div>
  );
}

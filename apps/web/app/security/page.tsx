import { SecurityPosturePanel } from "../../components/SecurityPosturePanel";

export default function SecurityPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Security</div>
        <h1>Proof over promises</h1>
        <p className="lede">Every public claim must map to evidence before the UI can show a stronger status.</p>
      </div>
      <SecurityPosturePanel />
    </div>
  );
}

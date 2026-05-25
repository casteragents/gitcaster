import { TruthStatusPill } from "../../../components/TruthStatusPill";

const checks = [
  ["Static entry", "index.html is imported as the alpha-local static entry."],
  ["Assets", "Required PNG assets are present in the source bundle."],
  ["Farcaster SDK", "Vendored Farcaster Miniapp SDK files are present."],
  ["Vercel", "vercel.json is reference-only and quarantined under legacy docs."],
  ["QStorage", "Blocked until publish evidence exists."],
  ["CasterCloud", "Blocked until deploy evidence exists."]
];

export default function CasterClaimMiniappPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">PR-14 miniapp import</div>
        <h1>Caster Claim Miniapp</h1>
        <p className="lede">
          First GitCaster miniapp import target. This page reports the local static import only; runtime API,
          QStorage, CasterCloud, and final Farcaster domain proof remain evidence-gated.
        </p>
      </div>
      <div className="card">
        <h2>Import status</h2>
        <TruthStatusPill status="alpha-local" evidence="launch/evidence/pr-14-claim-miniapp-import.json" />
        <p>Source: caster-claim-miniapp</p>
        <p>Evidence: launch/evidence/pr-14-claim-miniapp-import.json</p>
      </div>
      <div className="grid">
        {checks.map(([title, body]) => (
          <div className="card" key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

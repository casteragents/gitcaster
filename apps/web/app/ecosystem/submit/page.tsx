const categories = [
  "Agents",
  "Builder tools",
  "Miniapps",
  "Games",
  "Infrastructure",
  "Integrations",
  "Finance",
  "Models",
  "Collectibles",
  "Storage",
  "Security"
];

const proofRequirements = [
  "Runtime claims require endpoint evidence.",
  "Deployment claims require CasterCloud/QStorage evidence.",
  "Verification claims require review evidence.",
  "Token claims require contract, audit, and governance evidence.",
  ".caster mapping requires registry evidence."
];

const forbiddenClaims = [
  "automatic acceptance",
  "grant approval",
  "co-marketing approval",
  "private keys or API tokens",
  "hosted-platform production dependency"
];

export default function EcosystemSubmitPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Submission preview</div>
        <h1>Ecosystem submission policy</h1>
        <p className="lede">Submissions are local preview only in PR-28. Acceptance is not automatic and stronger claims require evidence.</p>
      </div>

      <section className="section">
        <h2>Allowed categories</h2>
        <div className="grid">
          {categories.map((category) => <div className="card" key={category}>{category}</div>)}
        </div>
      </section>

      <section className="section">
        <h2>Proof requirements</h2>
        <div className="card">
          <ul>
            {proofRequirements.map((requirement) => <li key={requirement}>{requirement}</li>)}
          </ul>
        </div>
      </section>

      <section className="section">
        <h2>Forbidden inputs</h2>
        <div className="card">
          <ul>
            {forbiddenClaims.map((claim) => <li key={claim}>{claim}</li>)}
          </ul>
        </div>
      </section>

      <section className="section">
        <h2>Safe example</h2>
        <div className="card">
          <p>Repo URL: <code>gitcaster://did:caster:z.../my-app</code></p>
          <p>CasterDID: <code>did:caster:z...</code></p>
          <p>No network submission endpoint is active in PR-28.</p>
        </div>
      </section>
    </div>
  );
}

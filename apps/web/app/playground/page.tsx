const templates = [
  "landing page",
  "Farcaster miniapp",
  "CasterGame",
  "agent dashboard",
  "CasterCloud static app",
  "token dashboard",
];

const flow = [
  "Prompt creates a local work plan",
  "Agent writes files in a sandboxed workspace",
  "Preview marks mock data clearly",
  "Publish creates a GitCaster repo record",
  "Deploy stays blocked until CasterCloud proof exists",
];

export default function PlaygroundPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Playground</div>
        <h1>Chat to app, with proof gates</h1>
        <p className="lede">
          The public playground target is a builder surface for apps, miniapps,
          games, and dashboards. Local preview is allowed; public deploy remains
          blocked until signed CasterCloud evidence exists.
        </p>
      </div>

      <section className="section">
        <h2>Build flow</h2>
        <div className="grid">
          {flow.map((item) => (
            <div className="card" key={item}>
              <h3>{item}</h3>
              <p>Current public status: blocked_external until canary launch proof is supplied.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Templates</h2>
        <div className="mini-list">
          {templates.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

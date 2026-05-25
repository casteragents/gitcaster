import { CasterTerminal } from "../components/CasterTerminal";
import { NodePreviewPanel } from "../components/NodePreviewPanel";
import { ProofPanel } from "../components/ProofPanel";
import { SecurityPosturePanel } from "../components/SecurityPosturePanel";
import { TruthTable } from "../components/TruthTable";
import { PRODUCT, PROOF_STRIP } from "../lib/caster-copy";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow">{PRODUCT.protocol} local alpha</div>
          <h1>{PRODUCT.line}</h1>
          <p className="lede">{PRODUCT.description}</p>
          <div className="actions">
            <a className="button primary" href="/start">Start local alpha</a>
            <a className="button" href="/status">View status</a>
            <a className="button" href="/node">Explore node preview</a>
            <a className="button" href="/console">Open CasterCloud console</a>
            <a className="button" href="/security">Read MCP docs</a>
          </div>
        </div>
        <CasterTerminal />
      </section>

      <section className="section">
        <h2>Proof strip</h2>
        <div className="grid">
          {PROOF_STRIP.map((item) => <div className="card" key={item}>{item}</div>)}
        </div>
      </section>

      <section className="section">
        <h2>Status preview</h2>
        <TruthTable compact />
      </section>

      <section className="section">
        <h2>Node preview</h2>
        <p>Public node names are planned surfaces. Signed health proof is required before stronger labels appear.</p>
        <NodePreviewPanel />
      </section>

      <section className="section">
        <h2>Agent protocol</h2>
        <div className="card">
          <h3>{PRODUCT.mcp}</h3>
          <p>MCP tools are alpha-local and capability-gated. Tools that require endpoints return blockers until evidence exists.</p>
        </div>
      </section>

      <section className="section">
        <h2>Proof panels</h2>
        <ProofPanel />
      </section>

      <section className="section">
        <h2>Security</h2>
        <SecurityPosturePanel />
      </section>

      <section className="section">
        <h2>Start local alpha</h2>
        <p>Preview data is labeled. Proof-backed data requires evidence.</p>
        <a className="button primary" href="/start">Start local alpha</a>
      </section>
    </>
  );
}

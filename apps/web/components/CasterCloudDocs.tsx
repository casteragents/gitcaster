import { appDeploymentCatalog, castercloudDocsSections } from "../lib/castercloud-docs-data";
import { consoleEndpoints, qconsoleServiceAliases, statusClass } from "../lib/castercloud-console-data";
import { sitePath } from "../lib/site-url";

export function CasterCloudDocs() {
  return (
    <div className="docs-page">
      <section className="docs-hero">
        <div>
          <div className="eyebrow">CasterCloud docs</div>
          <h1>Own the service surface.</h1>
          <p className="lede">
            These docs describe the CasterCloud console, wallet deployment flow, owned service endpoints, and app
            registry that replace manual QConsole dependency for the Caster stack.
          </p>
          <div className="actions">
            <a className="button primary" href={sitePath("/console")}>Open console</a>
            <a className="button" href="#api">API endpoints</a>
            <a className="button" href="#apps">App registry</a>
          </div>
        </div>
        <div className="docs-ledger">
          <div className="panel-row">
            <span>API contract</span>
            <span className="pill good">generated</span>
          </div>
          <div className="panel-row">
            <span>Wallet deploys</span>
            <span className="pill warn">policy gated</span>
          </div>
          <div className="panel-row">
            <span>Hosted QConsole</span>
            <span className="pill info">facade reducing</span>
          </div>
          <p>
            CasterCloud can route app operations through owned endpoints, but final production claims still wait
            for live evidence, burn-in, rollback, and retirement gates.
          </p>
        </div>
      </section>

      <section className="section docs-section-grid">
        {castercloudDocsSections.map((section) => (
          <article className="docs-section" key={section.id}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
            <ul>
              {section.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="section" id="api">
        <div className="section-heading">
          <div>
            <h2>API Endpoints</h2>
            <p>Public and wallet-gated routes served by the CasterCloud API facade.</p>
          </div>
          <span className="pill info">OpenAPI ready</span>
        </div>
        <div className="endpoint-list">
          {consoleEndpoints.map(([method, route, detail]) => (
            <div className="endpoint-row" key={`${method}-${route}`}>
              <span className="method">{method}</span>
              <code>{route}</code>
              <span>{detail}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="qconsole-aliases">
        <div className="section-heading">
          <div>
            <h2>QConsole Aliases</h2>
            <p>Compatibility names for operators moving from hosted QConsole to the CasterCloud API.</p>
          </div>
          <span className="pill warn">wallet-gated writes</span>
        </div>
        <div className="table-wrap">
          <table className="truth-table">
            <thead>
              <tr>
                <th>QConsole surface</th>
                <th>CasterCloud service</th>
                <th>Alias</th>
                <th>Canonical</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {qconsoleServiceAliases.map((alias) => (
                <tr key={`${alias.method}-${alias.alias}`}>
                  <td>{alias.qconsole}</td>
                  <td>{alias.castercloud}</td>
                  <td>{alias.method} {alias.alias}</td>
                  <td>{alias.canonical}</td>
                  <td><span className={`pill ${statusClass(alias.status)}`}>{alias.liveMutation ? "wallet gated" : alias.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" id="apps">
        <div className="section-heading">
          <div>
            <h2>App Registry</h2>
            <p>Apps and mini apps that move through CasterCloud-owned deployment control.</p>
          </div>
          <a className="button" href={sitePath("/console#app-workbench")}>Open workbench</a>
        </div>
        <div className="table-wrap">
          <table className="truth-table">
            <thead>
              <tr>
                <th>App</th>
                <th>Kind</th>
                <th>Target</th>
                <th>Status</th>
                <th>Blockers</th>
              </tr>
            </thead>
            <tbody>
              {appDeploymentCatalog.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.kind}</td>
                  <td>{item.target}</td>
                  <td><span className={`pill ${statusClass(item.status === "prepared" ? "gated" : item.status)}`}>{item.status}</span></td>
                  <td>{item.blockers.join("; ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

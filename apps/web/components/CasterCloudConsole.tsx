import {
  appDeployWorkbench,
  appDeployWorkbenchSummary,
  consoleEndpoints,
  consoleServices,
  deploymentApprovals,
  deploymentJournal,
  deploymentQueue,
  deployments,
  publicTargetWalletReadiness,
  qconsoleServiceAliases,
  statusClass,
} from "../lib/castercloud-console-data";
import { CasterCloudApprovalSigner } from "./CasterCloudApprovalSigner";
import { CasterCloudServiceActions } from "./CasterCloudServiceActions";

export function CasterCloudConsole() {
  return (
    <div className="console-page">
      <section className="console-hero">
        <div>
          <div className="eyebrow">CasterCloud control plane</div>
          <h1>Own the console, keep the evidence honest.</h1>
          <p className="lede">
            CasterCloud mirrors the QConsole service surfaces for our app stack, but points operations at our
            CasterRPC gateway, AWS node, laptop backup node, CStorage snapshots, event log, and wallet policies.
          </p>
          <div className="actions">
            <a className="button primary" href="#services">Open services</a>
            <a className="button" href="#deployments">Deployment queue</a>
            <a className="button" href="/docs">API docs</a>
          </div>
        </div>
        <div className="console-status-panel">
          <div className="panel-row">
            <span>Runtime posture</span>
            <span className="pill warn">evidence gated</span>
          </div>
          <div className="panel-row">
            <span>Primary node</span>
            <span className="pill good">AWS observed</span>
          </div>
          <div className="panel-row">
            <span>Backup node</span>
            <span className="pill warn">host check gated</span>
          </div>
          <div className="panel-row">
            <span>QConsole dependency</span>
            <span className="pill info">facade replacing</span>
          </div>
          <p>
            This console creates our own operator surface. It does not mark production migration complete until
            the same strict proof, burn-in, and retirement gates pass.
          </p>
        </div>
      </section>

      <section className="section" id="services">
        <div className="section-heading">
          <div>
            <h2>Services</h2>
            <p>QConsole-inspired services mapped to CasterCloud-owned endpoints.</p>
          </div>
          <span className="pill info">wallet gated</span>
        </div>
        <div className="service-grid">
          {consoleServices.map((service) => (
            <article className="service-tile" key={service.id}>
              <div className="service-title">
                <div>
                  <h3>{service.name}</h3>
                  <span className="muted">{service.qConsoleSurface}</span>
                </div>
                <span className={`pill ${statusClass(service.status)}`}>{service.status}</span>
              </div>
              <p>{service.description}</p>
              <div className="endpoint">{service.endpoint}</div>
              <div className="mini-list">
                <strong>Owns</strong>
                {service.owns.map((item) => <span key={item}>{item}</span>)}
              </div>
              <div className="mini-list blockers">
                <strong>Blocks</strong>
                {service.blockers.map((item) => <span key={item}>{item}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="qconsole-aliases">
        <div className="section-heading">
          <div>
            <h2>Owned QConsole aliases</h2>
            <p>QStorage, QKMS, QQ, and QPing names now route through CasterCloud-owned endpoints.</p>
          </div>
          <a className="button" href="http://127.0.0.1:8788/v1/qconsole/services">Open alias API</a>
        </div>
        <div className="alias-grid">
          {qconsoleServiceAliases.map((alias) => (
            <article className="alias-card" key={`${alias.method}-${alias.alias}`}>
              <div className="service-title">
                <div>
                  <h3>{alias.qconsole}</h3>
                  <span className="muted">{alias.castercloud}</span>
                </div>
                <span className={`pill ${statusClass(alias.status)}`}>{alias.liveMutation ? "wallet gated" : alias.status}</span>
              </div>
              <div className="endpoint">{alias.alias}</div>
              <div className="endpoint subtle">{alias.canonical}</div>
              <span className="method">{alias.method}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section console-band" id="wallet">
        <div>
          <h2>Wallet deploy flow</h2>
          <p>
            Users and operators create resources with wallet signatures. The backend only accepts actions that
            include a policy receipt, service evidence path, and rollback target.
          </p>
        </div>
        <CasterCloudServiceActions />
      </section>

      <section className="section" id="app-workbench">
        <div className="section-heading">
          <div>
            <h2>Deploy apps and miniapps</h2>
            <p>One owned workbench for GitCaster, casterchain.online, agents, miniapps, channels, and service apps.</p>
          </div>
          <a className="button" href="http://127.0.0.1:8788/v1/deployments/workbench">Open workbench API</a>
        </div>
        <div className="workbench-summary" aria-label="CasterCloud app deploy workbench summary">
          <div>
            <span>Apps</span>
            <strong>{appDeployWorkbenchSummary.apps}</strong>
          </div>
          <div>
            <span>Miniapps</span>
            <strong>{appDeployWorkbenchSummary.miniapps}</strong>
          </div>
          <div>
            <span>Dry-run ready</span>
            <strong>{appDeployWorkbenchSummary.deployableDryRun}</strong>
          </div>
          <div>
            <span>Evidence gated</span>
            <strong>{appDeployWorkbenchSummary.evidenceGated}</strong>
          </div>
          <div>
            <span>Blocked external</span>
            <strong>{appDeployWorkbenchSummary.blockedExternal}</strong>
          </div>
          <div>
            <span>Planned</span>
            <strong>{appDeployWorkbenchSummary.planned}</strong>
          </div>
        </div>
        <div className="table-wrap">
          <table className="truth-table">
            <thead>
              <tr>
                <th>App</th>
                <th>Kind</th>
                <th>Status</th>
                <th>Target</th>
                <th>Wallet action</th>
              </tr>
            </thead>
            <tbody>
              {appDeployWorkbench.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.kind}</td>
                  <td><span className={`pill ${statusClass(item.status)}`}>{item.status}</span></td>
                  <td><code>{item.target}</code></td>
                  <td>{item.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" id="target-wallet-readiness">
        <div className="section-heading">
          <div>
            <h2>Public target and wallet readiness</h2>
            <p>One owned checkpoint for public URLs, DNS target hashes, operator wallets, and deploy workbench evidence.</p>
          </div>
          <a className="button" href="http://127.0.0.1:8788/v1/public-target-wallet-readiness">Open readiness API</a>
        </div>
        <div className="table-wrap">
          <table className="truth-table">
            <thead>
              <tr>
                <th>Check</th>
                <th>Status</th>
                <th>Evidence</th>
                <th>Next action</th>
              </tr>
            </thead>
            <tbody>
              {publicTargetWalletReadiness.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td><span className={`pill ${statusClass(item.status)}`}>{item.status}</span></td>
                  <td><code>{item.evidence}</code></td>
                  <td>{item.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" id="deployments">
        <div className="section-heading">
          <div>
            <h2>App deployment queue</h2>
            <p>Everything moves through CasterCloud, but production retirement still waits for evidence.</p>
          </div>
          <span className="pill warn">not a blind cutover</span>
        </div>
        <div className="table-wrap">
          <table className="truth-table">
            <thead>
              <tr>
                <th>App</th>
                <th>Target</th>
                <th>Status</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {deployments.map((item) => (
                <tr key={item.app}>
                  <td>{item.app}</td>
                  <td>{item.target}</td>
                  <td><span className={`pill ${statusClass(item.status)}`}>{item.status}</span></td>
                  <td>{item.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CasterCloudApprovalSigner />
      </section>

      <section className="section" id="deploy-queue">
        <div className="section-heading">
          <div>
            <h2>Wallet deploy queue</h2>
            <p>Signed manifests are ready for dry-run queueing; live execution waits for strict proof.</p>
          </div>
          <a className="button" href="http://127.0.0.1:8788/v1/deployments/queue">Open queue API</a>
        </div>
        <div className="table-wrap">
          <table className="truth-table">
            <thead>
              <tr>
                <th>App</th>
                <th>Manifest</th>
                <th>Status</th>
                <th>Public target</th>
              </tr>
            </thead>
            <tbody>
              {deploymentQueue.map((item) => (
                <tr key={item.app}>
                  <td>{item.app}</td>
                  <td>{item.manifest}</td>
                  <td><span className={`pill ${statusClass(item.status)}`}>{item.status}</span></td>
                  <td>{item.publicTarget}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" id="deploy-journal">
        <div className="section-heading">
          <div>
            <h2>Wallet deployment journal</h2>
            <p>GitCaster dry-run requests are signed, hashed, and recorded before live deployment is allowed.</p>
          </div>
          <a className="button" href="http://127.0.0.1:8788/v1/deployments/journal/gitcaster">Open GitCaster entry</a>
        </div>
        <div className="table-wrap">
          <table className="truth-table">
            <thead>
              <tr>
                <th>App</th>
                <th>Request</th>
                <th>Status</th>
                <th>Wallet proof</th>
              </tr>
            </thead>
            <tbody>
              {deploymentJournal.map((item) => (
                <tr key={item.app}>
                  <td>{item.app}</td>
                  <td>{item.request}</td>
                  <td><span className={`pill ${statusClass(item.status)}`}>{item.status}</span></td>
                  <td>{item.wallet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" id="deploy-approvals">
        <div className="section-heading">
          <div>
            <h2>Operator approvals</h2>
            <p>Live deployment requires a real operator wallet signature and a clean completion sentinel.</p>
          </div>
          <a className="button" href="http://127.0.0.1:8788/v1/deployments/approvals/gitcaster">Open GitCaster approval</a>
        </div>
        <div className="table-wrap">
          <table className="truth-table">
            <thead>
              <tr>
                <th>App</th>
                <th>Approval</th>
                <th>Status</th>
                <th>Strict gate</th>
              </tr>
            </thead>
            <tbody>
              {deploymentApprovals.map((item) => (
                <tr key={item.app}>
                  <td>{item.app}</td>
                  <td>{item.approval}</td>
                  <td><span className={`pill ${statusClass(item.status)}`}>{item.status}</span></td>
                  <td>{item.strict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" id="docs">
        <div className="section-heading">
          <div>
            <h2>CasterCloud API</h2>
            <p>Local docs replace console guessing with stable endpoints for apps and mini apps.</p>
          </div>
          <a className="button" href="/docs">Open docs</a>
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
    </div>
  );
}

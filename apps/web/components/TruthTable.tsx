import { statusDescription, truthTableRows } from "../lib/status-truth";
import { TruthStatusPill } from "./TruthStatusPill";

export function TruthTable({ compact = false }: { compact?: boolean }) {
  const rows = compact ? truthTableRows().slice(0, 10) : truthTableRows();
  return (
    <div className="table-wrap">
      <table className="truth-table">
        <thead>
          <tr>
            <th>Surface</th>
            <th>Status</th>
            <th>Evidence or blocker</th>
            <th>Next proof</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.surface}>
              <td><strong>{row.surface}</strong></td>
              <td>
                <TruthStatusPill status={row.status} evidence={row.evidence} />
                <div className="muted">{statusDescription(row.status)}</div>
              </td>
              <td>{row.evidence ?? row.blocker}</td>
              <td>{row.nextProof}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { isEvidenceBackedStatus, statusLabel, statusSeverity, type GitCasterTruthStatus } from "../lib/status-truth";

export function TruthStatusPill({ status, evidence }: { status: GitCasterTruthStatus; evidence?: string }) {
  const displayStatus = isEvidenceBackedStatus(status, evidence) ? status : "blocked";
  return <span className={`pill ${statusSeverity(displayStatus)}`}>{statusLabel(displayStatus)}</span>;
}

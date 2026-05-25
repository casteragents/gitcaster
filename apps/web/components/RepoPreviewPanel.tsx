import { previewRepos } from "../lib/preview-data";
import { TruthStatusPill } from "./TruthStatusPill";

export function RepoPreviewPanel() {
  return (
    <div className="card">
      <h3>Repo preview</h3>
      <p>{previewRepos.label}</p>
      <TruthStatusPill status="preview" />
      <p>Repo count: {previewRepos.repos.length}</p>
    </div>
  );
}

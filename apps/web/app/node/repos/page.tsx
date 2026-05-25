import { RepoPreviewPanel } from "../../../components/RepoPreviewPanel";

export default function ReposPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Repos</div>
        <h1>Repo list preview</h1>
        <p className="lede">This page shows preview or alpha-local repo information only. Start a local alpha node to connect real repo data in later evidence-backed slices.</p>
      </div>
      <RepoPreviewPanel />
    </div>
  );
}

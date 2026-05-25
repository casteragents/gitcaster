import index from "../../../public/caster-punks-index.json";
import { TruthStatusPill } from "../../../components/TruthStatusPill";
import { CasterPunksGallery, type CasterPunkSample } from "../../../components/CasterPunksGallery";

type CasterPunksIndex = {
  fileCount: number;
  sampleCount: number;
  sample: CasterPunkSample[];
  rootHash: string;
  pagination: {
    pageSize: number;
    pages: number;
  };
  qstorage: {
    status: "blocked_external";
    published: boolean;
  };
};

export default function CasterPunksPage() {
  const liteIndex = index as CasterPunksIndex;
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">PR-15 lite index</div>
        <h1>Caster Punks</h1>
        <p className="lede">
          Lite collection index with a first-24 sample, batch-hashed root, lazy preview loading, and QStorage publication blocked until proof exists.
        </p>
      </div>
      <div className="grid">
        <div className="card">
          <h2>Collection proof</h2>
          <p>JPG files counted: {liteIndex.fileCount}</p>
          <p>Sample exposed: {liteIndex.sampleCount}</p>
          <p className="muted">{liteIndex.rootHash}</p>
          <TruthStatusPill status="alpha-local" evidence="launch/evidence/pr-15-caster-punks-lite-index.json" />
        </div>
        <div className="card">
          <h2>Publish status</h2>
          <p>QStorage publish is separate from PR-15.</p>
          <TruthStatusPill status="blocked" />
        </div>
      </div>
      <CasterPunksGallery sample={liteIndex.sample} pageSize={liteIndex.pagination.pageSize} />
    </div>
  );
}

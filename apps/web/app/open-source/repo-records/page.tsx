import { sitePath } from "../../../lib/site-url";

const publicArtifacts = [
  ["Repo records package", "packages/repo-records", "Repo IDs, append-only event helpers, signed records, issue records, PR records, reviews, and record-only merge models."],
  ["Issue and PR routes", "apps/node/src/routes/issues.ts; apps/node/src/routes/prs.ts", "Local alpha HTTP route shapes that require signed mutation envelopes for writes."],
  ["Local workflow fixture", "examples/repo-records/local-issue-pr-workflow.example.json", "A public fixture for repo, issue, PR, review, and record-only merge behavior."],
  ["Repo records evidence", "launch/evidence/repo-records-issue-pr-source.json", "Deterministic proof for local records, append-only events, and unsigned mutation blockers."]
];

const localRecords = [
  ["Repo", "gitcaster:// DID-based repo identity with slug validation and default branch metadata."],
  ["Event log", "Append-only local events for repo creation, issue changes, PR review, and record-only merge."],
  ["Issues", "Local open/update records guarded by signed issue:write mutation scope."],
  ["Pull requests", "Local open/view/review/merge records guarded by signed pr:write and pr:merge scopes."],
  ["Record-only merge", "Merge record is emitted while refsChanged stays false until ref proof exists."],
  ["HTTP blockers", "Unsigned issue and PR writes return blocked responses instead of mutating state."]
];

const blockedModes = [
  "Public collaboration network",
  "Remote event-log durability",
  "Normal git transport",
  "QStorage-backed object publication",
  "CasterCloud managed deployment",
  "Production runtime operations"
];

export default function RepoRecordsOpenSourcePage() {
  return (
    <div className="stack">
      <section className="section">
        <div className="eyebrow">Open-core layer</div>
        <h1>Repo records and issue/PR workflow for GitCaster builders</h1>
        <p className="lede">
          GitCaster now publishes the repo-record source and local issue/pull-request
          workflow as a public-alpha developer layer. Builders can inspect the repo
          identity model, append-only event helpers, issue records, PR review records,
          record-only merge behavior, and HTTP mutation blockers while public
          collaboration, remote durability, normal git transport, managed deployment,
          and production runtime claims stay blocked.
        </p>
        <div className="actions">
          <a className="button primary" href="https://github.com/casteragents/gitcaster/tree/main/packages/repo-records">Repo records source</a>
          <a className="button" href="https://github.com/casteragents/gitcaster/tree/main/examples/repo-records">Workflow fixture</a>
          <a className="button" href={sitePath("/gitcaster-repo-records.md")}>Markdown docs</a>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Public artifacts</h2>
            <p>These files are safe contribution surfaces for local repo collaboration records.</p>
          </div>
          <span className="pill good">public-alpha</span>
        </div>
        <div className="grid">
          {publicArtifacts.map(([name, path, description]) => (
            <div className="card" key={name}>
              <h3>{name}</h3>
              <p>{description}</p>
              <span className="pill info">{path}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Local record scope</h2>
            <p>The repo-record layer proves local data behavior without claiming public infrastructure.</p>
          </div>
          <span className="pill info">alpha-local runtime</span>
        </div>
        <div className="grid">
          {localRecords.map(([name, description]) => (
            <div className="card" key={name}>
              <h3>{name}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Blocked modes</h2>
            <p>These stay closed or blocked until deterministic proof exists.</p>
          </div>
          <span className="pill warn">blocked</span>
        </div>
        <div className="grid">
          {blockedModes.map((item) => (
            <div className="card" key={item}>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

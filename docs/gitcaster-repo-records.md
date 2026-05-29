# GitCaster Repo Records

GitCaster repo records are public-alpha source for local contribution tooling.
They model repos, append-only events, issues, pull requests, reviews, and
record-only merges.

Public artifacts:

- `packages/repo-records`
- `apps/node/src/routes/issues.ts`
- `apps/node/src/routes/prs.ts`
- `apps/node/src/services/issue-service.ts`
- `apps/node/src/services/pr-service.ts`
- `examples/repo-records/local-issue-pr-workflow.example.json`
- `launch/evidence/repo-records-issue-pr-source.json`

The checker proves local record behavior and unsigned mutation blockers. It does
not claim public collaboration, remote event-log durability, normal git
transport, QStorage publication, CasterCloud deployment, or production runtime.

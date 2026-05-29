# GitCaster Repo Records Public-Alpha Layer

This layer publishes the local repo-record data model and deterministic
issue/pull-request workflow for contributors. It is a public-alpha source layer,
not a production collaboration service.

## Public source

- `packages/repo-records` defines repo IDs, append-only event helpers, issue
  records, pull request records, review records, and record-only merge records.
- `apps/node/src/routes/issues.ts` and `apps/node/src/routes/prs.ts` expose the
  local alpha HTTP route shapes.
- `apps/node/src/services/issue-service.ts` and
  `apps/node/src/services/pr-service.ts` keep writes behind signed mutation
  verification.
- `examples/repo-records/local-issue-pr-workflow.example.json` documents the
  local-only issue and pull-request workflow.

## What is proven

- Repo IDs use `gitcaster://did:caster:...`.
- Repo creation emits `gitcaster.repo.created.v1`.
- Issues can be opened and updated as local records.
- Pull requests can be opened, reviewed, and merged in `record-only` mode.
- Record-only merge evidence does not change refs.
- Unsigned HTTP issue and PR mutations are blocked.
- The event list is append-only in the deterministic checker.

## What is not claimed

- No public collaboration network is claimed.
- No remote event-log durability is claimed.
- No normal git transport is claimed.
- No QStorage publication is claimed.
- No CasterCloud deployment is claimed.
- No production runtime is claimed.

Run:

```bash
pnpm run repo-records:check
pnpm run test:web
pnpm run secret-scan
```

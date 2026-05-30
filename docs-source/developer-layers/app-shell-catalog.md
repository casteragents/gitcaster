# GitCaster App Shell Catalog

Status: public-alpha, local preview only.

This layer publishes a proof-aware catalog for GitCaster app and miniapp shells.
It is a developer contribution surface for local inspection, manifest review,
dependency-risk labeling, and blocked native deployment claims.

## Public Artifacts

- `packages/ecosystem/src/app-shell-catalog.ts`
- `examples/app-shells/gitcaster-app-shell-catalog.local.json`
- `apps/web/public/gitcaster-app-shell-catalog.json`
- `apps/web/public/gitcaster-app-shell-local-preview-smoke.json`
- `scripts/ecosystem/check-app-shell-catalog-public-alpha.cjs`
- `scripts/ecosystem/check-app-shell-local-preview-smoke-public-alpha.cjs`
- `launch/evidence/app-shell-catalog-public-hardening-source.json`
- `launch/evidence/app-shell-local-preview-smoke-public-alpha.json`

## What Is Public

- Local preview routes under `/ecosystem`.
- Miniapp shell manifest shape for Caster Claim.
- Dependency-risk labels for runtime API, native storage, native domains,
  managed runtime, and legacy hosted references.
- Deterministic checks that keep unsupported stronger claims blocked.

## What Stays Blocked

- Native `.caster` deployment.
- QStorage publication.
- Managed runtime endpoint access.
- Production readiness.
- External security audit completion.
- Custody, billing, rollback, and managed operation proof.

## Verification

```bash
pnpm run app-shell-catalog:check
pnpm run app-shell-preview-smoke:check
pnpm run secret-scan
pnpm run test:web
```

The checker writes public evidence and regenerates the safe app-shell catalog
JSON. It must not pass if an entry claims live runtime, native deployment,
QStorage publication, `.caster` domain mapping, or production readiness.

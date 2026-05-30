# Deploy manifest intake

GitCaster deploy manifests are public-alpha local dry-run plans for app,
miniapp, website, and developer-tool releases.

This layer is intentionally not a hosted deploy system. It gives contributors a
shared shape for local release plans, checker commands, retired dependency
markers, and proof blockers before any managed runtime or native promotion can
be claimed.

## Public files

- `packages/deploy-manifests`
- `examples/deploy/local-deploy-manifest.example.json`
- `scripts/deploy/check-deploy-manifest-intake-public-alpha.cjs`
- `launch/evidence/deploy-manifest-intake-public-alpha.json`
- `apps/web/app/open-source/deploy-manifest-intake/page.tsx`

## Safety boundary

The validator only accepts local preview URLs. It rejects secret-like fields,
required legacy hosted runtime dependencies, native domain claims, native
storage claims, managed runtime claims, billing claims, custody claims, rollback
claims, and production readiness claims.

## Verification

```sh
pnpm run deploy-manifest:check
```


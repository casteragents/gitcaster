# GitCaster deploy manifest intake

Status: public-alpha, local dry-run only.

This release opens the deploy manifest schema, local fixture, validator, and
proof gate for app and miniapp release planning. It does not publish managed
runtime, native storage, native domain, custody, billing, rollback, or
production readiness evidence.

Public artifacts:

- `packages/deploy-manifests`
- `examples/deploy/local-deploy-manifest.example.json`
- `scripts/deploy/check-deploy-manifest-intake-public-alpha.cjs`
- `launch/evidence/deploy-manifest-intake-public-alpha.json`

Verification:

```sh
pnpm run deploy-manifest:check
```


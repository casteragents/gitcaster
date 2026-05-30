# Caster Intelligence Preview Shell

Status: public-alpha, local preview shell only.

This slice publishes a redacted Caster Intelligence builder-tool shell for public
review. It is meant to show contributors the intended product surface, proof
labels, and blocked promotion path without exposing source contents, runtime
state, credentials, managed endpoints, or production operations.

## Public Artifacts

- `apps/web/app/ecosystem/caster-intelligence/page.tsx`
- `apps/web/app/open-source/caster-intelligence-preview/page.tsx`
- `examples/app-shells/caster-intelligence.local-shell.json`
- `scripts/ecosystem/check-caster-intelligence-preview-public-alpha.cjs`
- `apps/web/public/gitcaster-caster-intelligence-preview.json`
- `launch/evidence/caster-intelligence-preview-public-alpha.json`

## Verification

```bash
pnpm run caster-intelligence-preview:check
pnpm run secret-scan
```

## Still Blocked

- source contents publication
- native storage publication
- native domain mapping
- managed runtime endpoint
- rollback verification
- production readiness

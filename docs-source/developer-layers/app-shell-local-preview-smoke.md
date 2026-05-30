# GitCaster App Shell Local Preview Smoke

Status: public-alpha, local preview only.

This layer checks that the static app and miniapp preview routes render from the
generated site artifact. It is a contribution surface for route review and
catalog verification, not a managed runtime or production launch signal.

## Public Artifacts

- `scripts/ecosystem/check-app-shell-local-preview-smoke-public-alpha.cjs`
- `apps/web/public/gitcaster-app-shell-local-preview-smoke.json`
- `apps/web/public/gitcaster-app-shell-local-preview-smoke.md`
- `apps/web/public/gitcaster-caster-intelligence-preview.json`
- `launch/evidence/app-shell-local-preview-smoke-public-alpha.json`
- `launch/evidence/caster-intelligence-preview-public-alpha.json`
- `apps/web/app/open-source/app-shell-local-preview-smoke/page.tsx`

## Checked Routes

- `/ecosystem`
- `/ecosystem/caster-intelligence`
- `/ecosystem/caster-claim-miniapp`
- `/open-source/app-shell-catalog`

The checker also verifies that every app-shell catalog entry can be found on its
local preview page by name.

## What Stays Blocked

- Native storage publication.
- Native domain mapping.
- Managed runtime endpoint access.
- Rollback verification.
- Production readiness.

## Verification

```bash
pnpm run app-shell-preview-smoke:check
pnpm run secret-scan
```

The checker writes public JSON and evidence files. It fails if the static export
is missing, a preview route does not render expected text, a secret-like string
appears in rendered HTML, or a preview page claims unsupported live/runtime
capabilities.

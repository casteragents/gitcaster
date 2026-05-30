# GitCaster App Shell Catalog

GitCaster publishes a public-alpha app shell catalog for local preview and
contribution review. The catalog includes local-only app and miniapp shell
metadata, dependency-risk labels, and blocked native deployment claims.

Public page: `/open-source/app-shell-catalog/`

Source:

- `packages/ecosystem/src/app-shell-catalog.ts`
- `examples/app-shells/gitcaster-app-shell-catalog.local.json`
- `apps/web/public/gitcaster-app-shell-catalog.json`
- `scripts/ecosystem/check-app-shell-catalog-public-alpha.cjs`

Still blocked:

- Native `.caster` deployment.
- QStorage publication.
- Managed runtime endpoint.
- Production readiness.
- External audit completion.

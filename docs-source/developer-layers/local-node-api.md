# Local Node API Source Layer

Status: public-alpha source, alpha-local runtime

GitCaster now publishes the local node API source as a developer contribution
surface. The public layer includes local HTTP routing, health/status endpoints,
repo and ref route shells, mutation envelope verification, redaction, and
endpoint blockers for storage, deployment, domains, and managed runtime paths.

Public artifacts:

- `apps/node`
- `examples/node/local-api-smoke.example.json`
- `apps/web/app/open-source/local-node-api/page.tsx`
- `apps/web/public/gitcaster-local-node-api.md`
- `launch/evidence/local-node-api-source.json`

Blocked until proof exists:

- Public node federation
- Hosted node health proof
- QStorage publication
- CasterCloud deployment
- Managed runtime, billing, custody, and production operations

Verification:

```bash
pnpm run node-api:check
pnpm run secret-scan
```

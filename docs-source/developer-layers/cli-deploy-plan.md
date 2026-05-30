# CLI Deploy Plan Dry-Run

Status: public-alpha

GitCaster now publishes `gc deploy plan` as a local deploy planning command.
It reads `gitcaster.deploy-manifest.v1`, validates it through
`@gitcaster/deploy-manifests`, and writes redacted evidence for review.

Public artifacts:

- `apps/cli/src/commands/deploy.ts`
- `examples/deploy/local-deploy-manifest.example.json`
- `launch/evidence/cli-deploy-plan-local-dry-run.json`
- `scripts/cli/check-cli-deploy-plan-public-alpha.cjs`
- `apps/web/app/open-source/cli-deploy-plan/page.tsx`

Blocked until proof exists:

- Installer release and user install smoke proof
- Managed runtime receipt and rollback proof
- Native storage publish/read proof
- Native domain registry and browser smoke proof
- Custody signer reference and redacted receipt
- Billing policy, abuse-control proof, security audit, and release-candidate evidence

Verification:

```bash
pnpm run cli-deploy-plan:check
pnpm run secret-scan
```

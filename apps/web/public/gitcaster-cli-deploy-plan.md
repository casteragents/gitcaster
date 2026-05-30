# GitCaster CLI Deploy Plan

Status: public-alpha

`gc deploy plan` is a local dry-run command for GitCaster deploy manifests. It
validates a local manifest, writes redacted evidence, and keeps runtime,
custody, billing, storage, domain, rollback, and release promotion blocked until
proof exists.

Run:

```bash
pnpm run cli-deploy-plan:check
```

Evidence:

- `launch/evidence/cli-deploy-plan-local-dry-run.json`
- `launch/evidence/cli-deploy-plan-public-alpha.json`
- `apps/web/public/gitcaster-cli-deploy-plan.json`

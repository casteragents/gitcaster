# GitCaster deploy manifests

Public-alpha deployment manifests describe a local dry-run app release plan
without claiming managed runtime, native storage, native domains, custody,
billing, or production readiness.

This package is safe for open-core contribution work because it only validates
local plans and deterministic blockers. The hosted control plane, production
orchestration, operator credentials, billing, custody, and managed rollout
systems remain outside this public package.

## Check

```sh
pnpm --filter @gitcaster/deploy-manifests check
```

## Boundary

The validator accepts `local-dry-run` manifests and rejects manifests that:

- mark managed runtime, native storage, native domain, custody, billing, or
  production readiness as available;
- require legacy hosted providers in the native access path;
- include secret-like fields or values;
- include public deploy endpoints instead of local preview URLs.


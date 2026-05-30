# Caster Intelligence Preview Shell

Status: public-alpha, local preview shell only.

This proof publishes redacted shell metadata and static page checks for Caster
Intelligence. It does not publish source contents, runtime state, managed
endpoints, native storage, native domains, rollback proof, or production
readiness.

## Checked Routes

- /ecosystem/caster-intelligence: passed
- /open-source/caster-intelligence-preview: passed

## Verification

```bash
pnpm run caster-intelligence-preview:check
pnpm run secret-scan
```

## Still Blocked

- source-contents-publication: blocked_external
- native-storage: blocked_external
- native-domain: blocked_external
- managed-runtime: blocked_external
- runtime-endpoint: blocked_external
- rollback: blocked_external
- production-readiness: blocked_external


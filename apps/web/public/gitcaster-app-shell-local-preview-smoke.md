# GitCaster App Shell Local Preview Smoke

Status: public-alpha, local preview only.

This proof checks the static GitCaster app and miniapp preview routes without
claiming native storage, native domains, managed runtime, rollback, or
production readiness.

## Checked Routes

- /ecosystem: passed
- /ecosystem/caster-claim-miniapp: passed
- /open-source/app-shell-catalog: passed
- /ecosystem#caster-intelligence: passed
- /ecosystem/caster-claim-miniapp: passed
- /ecosystem#casteragents: passed
- /ecosystem#casterai: passed
- /ecosystem#casterapp: passed
- /ecosystem#tapcaster: passed
- /ecosystem#casterchain-agents: passed
- /ecosystem#caster-punks: passed
- /ecosystem#castergames-xgames: passed
- /ecosystem#farcaster-miniapps: passed
- /ecosystem#agent-workspace-skills: passed

## Verification

```bash
pnpm run app-shell-preview-smoke:check
pnpm run secret-scan
```

## Still Blocked

- native-storage: blocked_external
- native-domain: blocked_external
- managed-runtime: blocked_external
- runtime-endpoint: blocked_external
- production-readiness: blocked_external
- rollback: blocked_external


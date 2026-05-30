# GitCaster Security Redteam And Hardening Proof Tooling

Status: public-alpha.

GitCaster publishes local redteam and hardening proof tooling so contributors can
inspect the safety gates before stronger claims are made.

This layer covers secret scanning, fake live claim blocking, hosted dependency
claim blocking, capability abuse checks, deployment proof abuse checks, and
evidence integrity checks.

This is not an external audit. Production security readiness, public node
federation safety, QStorage publication, CasterCloud deployment, .caster domain
mapping, custody, billing, and managed infrastructure safety remain blocked
until direct evidence exists.

Verification:

```bash
pnpm run security-redteam:check
```

Evidence:

- `launch/evidence/security-redteam-public-hardening-source.json`
- `launch/evidence/pr-18-security-gate.json`
- `launch/evidence/pr-27-security-redteam-crypto-audit.json`
- `launch/evidence/redteam-suite-result.json`


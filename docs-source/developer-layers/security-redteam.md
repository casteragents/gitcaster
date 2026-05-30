# GitCaster Security Redteam And Hardening Proof Tooling

Status: public-alpha.

This layer publishes deterministic local security checks for contributors. It
does not claim external audit completion, production readiness, managed
infrastructure safety, or live deployment safety.

## Public Files

- `scripts/security/run-beta-gate.cjs`
- `scripts/security/check-security-redteam-public-alpha.cjs`
- `scripts/security/redteam/run-redteam-suite.cjs`
- `scripts/security/redteam/check-crypto-invariants.cjs`
- `scripts/security/redteam/check-identity-replay-attacks.cjs`
- `scripts/security/redteam/check-capability-abuse.cjs`
- `scripts/security/redteam/check-deployment-proof-abuse.cjs`
- `docs/security/redteam-plan.md`
- `docs/security/crypto-audit-rehearsal.md`
- `examples/security/redteam-hardening-plan.example.json`
- `launch/evidence/security-redteam-public-hardening-source.json`

## Covered Local Checks

- Secret scan coverage.
- Fake live claim blocking.
- Hosted production dependency blocking.
- Signed mutation and capability abuse blocking.
- Deployment proof abuse blocking.
- Evidence integrity and production non-claim checks.

## Verification

```bash
pnpm run security-redteam:check
```

The command writes `launch/evidence/security-redteam-public-hardening-source.json`
and keeps `canShipProduction` false.


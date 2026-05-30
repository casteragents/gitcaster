# GitCaster Crypto Audit Rehearsal

Status: public-alpha rehearsal.

This note gives contributors a local checklist for reviewing GitCaster
cryptographic boundaries before any external audit. It does not replace a
third-party audit and does not approve production launch.

## Rehearsal Scope

- Confirm mutation envelopes require explicit signer scope.
- Confirm replay attempts are rejected or blocked.
- Confirm unsigned issue, pull-request, ref, storage, and deployment mutations
  do not alter state.
- Confirm fake live deployment proofs remain rejected.
- Confirm public evidence never upgrades fixture, dry-run, or blocked evidence
  into production readiness.

## Evidence To Inspect

- `launch/evidence/redteam-crypto-invariants.json`
- `launch/evidence/redteam-identity-replay-attacks.json`
- `launch/evidence/redteam-capability-abuse.json`
- `launch/evidence/redteam-deployment-proof-abuse.json`
- `launch/evidence/pr-27-security-redteam-crypto-audit.json`
- `launch/evidence/security-redteam-public-hardening-source.json`

## Non-Claims

This rehearsal does not claim audit completion, live node security, managed
orchestration safety, custody safety, billing safety, or production readiness.

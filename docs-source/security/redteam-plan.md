# GitCaster Security Redteam Plan

Status: public-alpha rehearsal.

This document describes local deterministic redteam coverage for GitCaster
developer-facing code. It is not an external audit, not production security
readiness, and not a claim that managed CasterCloud infrastructure is safe for
public operation.

## Covered Local Checks

- Crypto invariant checks for key, signature, and replay assumptions.
- Identity replay checks for stale nonce and duplicated action attempts.
- Capability abuse checks for unsigned or under-scoped mutation attempts.
- Deployment proof abuse checks for placeholder, dry-run, hosted, and fake live
  proofs.
- Web claim guard checks for unsupported live, production, or audit claims.
- SDK blocker checks for methods that must stay blocked without endpoints,
  signers, or custody proof.
- Sensitive-state boundary checks for protected runtime state and image bytes.
- Evidence integrity checks for public proof files.

## Required Commands

```bash
pnpm run security-redteam:check
node scripts/security/redteam/run-redteam-suite.cjs
node scripts/security/run-beta-gate.cjs
```

## Still Blocked

- External security audit completion.
- Production security readiness.
- Public node federation safety.
- QStorage, CasterCloud, and .caster live deployment safety.
- Custody, billing, rollback, and managed operation safety.

## Handoff

The next release must keep these claims blocked until deterministic external
proof exists and can be linked from public evidence.

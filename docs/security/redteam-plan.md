# GitCaster Security Redteam Hardening Plan

Status: public-alpha rehearsal. Local only.

This document describes local deterministic redteam coverage for GitCaster
developer-facing code. It is not an external audit, not production security
readiness, and not a claim that managed CasterCloud infrastructure is safe for
public operation. No production exploit disclosure is included in this
developer-facing release.

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

- External security audit completion: blocked_external.
- Production security readiness: blocked_external.
- Public node federation safety: blocked_external.
- QStorage, CasterCloud, and .caster live deployment safety: blocked_external.
- Custody, billing, rollback, and managed operation safety: blocked_external.
- Local redteam fixtures and abuse cases: fixture_only.

## Handoff

The next release must keep these claims blocked until deterministic external
proof exists and can be linked from public evidence.

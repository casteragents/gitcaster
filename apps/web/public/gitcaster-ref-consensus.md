# GitCaster Ref Consensus

Status: public-alpha source, alpha-local runtime evidence.

GitCaster now publishes the ref-consensus local certificate layer for builders who want to inspect signed ref update records without relying on managed platform internals.

Public files:

- `packages/ref-consensus`
- `apps/node/src/routes/refs.ts`
- `examples/refs/local-ref-certificate-workflow.example.json`
- `scripts/refs/check-ref-consensus-public-alpha.cjs`
- `launch/evidence/ref-consensus-local-certificate-source.json`

This layer proves local certificate issuance, append-only local ledger verification, conflict evidence, double-sign detection, and unsigned mutation blockers.

It does not claim public consensus, remote ref durability, normal git transport, QStorage publication, CasterCloud deployment, or production runtime readiness.

Run:

```bash
pnpm run ref-consensus:check
```

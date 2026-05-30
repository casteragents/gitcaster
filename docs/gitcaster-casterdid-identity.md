# GitCaster CasterDID identity layer

Status: public-alpha, local identity inspection only

This layer publishes local CasterDID helpers for contributor review.
It exposes DID documents, public-key fingerprints, local signed envelopes, and a public-key-only fixture.

Public artifacts:

- `packages/identity/src/did-caster.ts`
- `packages/identity/src/ed25519.ts`
- `packages/identity/src/key-storage.ts`
- `packages/identity/src/signature-envelope.ts`
- `packages/identity/src/canonical-json.ts`
- `examples/identity/local-casterdid-identity.example.json`
- `docs/casterdid-identity.md`

Blocked claims:

- managed signing custody
- operator private keys
- public runtime endpoint
- public node mutation
- storage publication
- native domain routing
- production runtime operation

Verification:

```bash
pnpm run casterdid-identity:check
pnpm run casterdid-identity:public-smoke
```

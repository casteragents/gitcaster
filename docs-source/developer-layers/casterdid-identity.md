# CasterDID Identity Layer

Status: public-alpha, local identity inspection only.

This layer publishes the contribution-safe CasterDID identity spine for local builders. It includes DID helpers, public-key fingerprinting, signed mutation envelopes, file-signature helpers, and placeholder-only local fixtures.

It does not publish managed signing custody, operator private keys, hosted identity services, public node mutation, storage publication, native domain routing, or production runtime operation.

## Public artifacts

- `packages/identity/src/did-caster.ts`
- `packages/identity/src/ed25519.ts`
- `packages/identity/src/key-storage.ts`
- `packages/identity/src/signature-envelope.ts`
- `packages/identity/src/canonical-json.ts`
- `examples/identity/local-casterdid-identity.example.json`
- `scripts/identity/check-casterdid-identity-public-alpha.cjs`
- `scripts/identity/check-casterdid-identity-public-smoke.cjs`

## Local check

```bash
pnpm run casterdid-identity:check
pnpm run casterdid-identity:public-smoke
```

The checker generates temporary local keys, verifies DID document creation, verifies a signed mutation envelope, confirms tamper and wrong-key failures, writes public proof JSON, and checks that committed fixtures do not include private keys.


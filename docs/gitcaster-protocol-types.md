# GitCaster protocol types layer

Status: public-alpha, local inspection only

This layer publishes GitCaster protocol vocabulary for contributor review.
It exposes typed contracts, fixture names, and a placeholder-only local envelope example.

Public artifacts:

- `packages/protocol/src/types.ts`
- `packages/protocol/src/events.ts`
- `packages/protocol/src/status.ts`
- `packages/protocol/src/content-types.ts`
- `packages/protocol/src/error-codes.ts`
- `packages/protocol/src/fixtures.ts`
- `examples/protocol/local-protocol-envelope.example.json`
- `docs/protocol-types.md`

Blocked claims:

- public runtime endpoint
- managed signing custody
- public node mutation
- QStorage publication
- native domain routing
- production runtime operation

Verification:

```bash
pnpm run protocol-types:check
pnpm run protocol-types:public-smoke
```

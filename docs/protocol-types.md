# GitCaster protocol types layer

Status: public-alpha, local inspection only

This layer documents GitCaster protocol types for contributor review.
It exposes vocabulary, fixtures, and a placeholder-only envelope example.

Public artifacts:

- `packages/protocol`
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

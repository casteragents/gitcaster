# Protocol Types Layer

Status: public-alpha, local inspection only

GitCaster publishes its contribution-safe protocol vocabulary for builders.
The public layer covers typed identities, capabilities, signed mutation
envelopes, repo records, event names, statuses, content types, error codes,
and a placeholder-only local envelope example.

Public artifacts:

- `packages/protocol/src/types.ts`
- `packages/protocol/src/events.ts`
- `packages/protocol/src/status.ts`
- `packages/protocol/src/content-types.ts`
- `packages/protocol/src/error-codes.ts`
- `packages/protocol/src/fixtures.ts`
- `examples/protocol/local-protocol-envelope.example.json`
- `apps/web/public/gitcaster-protocol-types.json`

Blocked until proof exists:

- Public runtime endpoint
- Managed signing custody
- Public node mutation
- QStorage publication
- Native domain routing and rollback
- Production runtime operation

Verification:

```bash
pnpm run protocol-types:check
pnpm run protocol-types:public-smoke
pnpm run secret-scan
```

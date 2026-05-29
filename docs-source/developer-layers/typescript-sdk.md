# TypeScript SDK Layer

Status: public-alpha

GitCaster now publishes the TypeScript SDK as a public-alpha developer layer.
The package includes typed client helpers, local clone URL construction,
redaction helpers, proof-gated status methods, and tests that prevent live or
production claims from entering the public API surface.

Public artifacts:

- `packages/sdk-typescript`
- `examples/sdk/public-alpha-client.example.ts`
- `examples/sdk/public-alpha-client.example.json`
- `apps/web/app/open-source/typescript-sdk/page.tsx`

Blocked until proof exists:

- Public node health
- Native storage verification
- Native domain registry mapping
- Managed signing custody
- Contract utility activation

Verification:

```bash
pnpm run sdk:check
pnpm run secret-scan
```

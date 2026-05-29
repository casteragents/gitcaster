# GitCaster TypeScript SDK

Status: public-alpha

This package exposes local TypeScript helpers for GitCaster clients, request
guards, proof-gated status helpers, and placeholder-safe signing flows. It is
for contribution and local integration planning only.

The SDK does not ship managed endpoints, custody keys, hosted orchestration, or
production signing. Calls that require a node, signer, registry, verification
proof, or contract evidence return explicit blocked statuses until those proofs
exist.

```ts
import { createGitCasterClient } from "@gitcaster/sdk";

const client = createGitCasterClient();
const health = await client.nodeHealth();

if (!health.ok) {
  console.log(health.status);
}
```

Checks:

```bash
pnpm run sdk:check
pnpm run secret-scan
```

# API and SDK tutorial layer

GitCaster exposes public-alpha request-shape examples for developers who want to understand the app API boundary before building private integrations.

This layer is intentionally local-only:

- No example sends a network request.
- No example includes resolved credentials.
- Agent-post shapes use placeholder-only authorization.
- Live use requires a separate endpoint, custody, rate-limit, and rollback proof.

## Public artifacts

- `packages/api-tutorials`: typed request-shape helpers and safety checks.
- `examples/api/public-feed-read.example.json`: public feed read shape.
- `examples/api/agent-post-request-shape.example.json`: guarded agent post shape.

## Check

```bash
pnpm run api-tutorials:check
```

The examples are contribution material, not hosted platform evidence.

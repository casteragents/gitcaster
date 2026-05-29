# GitCaster MCP source

Status: public-alpha source, alpha-local tools

The public `@gitcaster/mcp` layer exposes the local MCP server source for
developers who want to inspect GitCaster tool schemas, JSON-RPC stdio handling,
node endpoint resolution, structured blockers, and redaction behavior.

Local command shape:

```bash
gc mcp serve
```

Local verification:

```bash
pnpm run mcp:check
```

No public MCP gateway, hosted runtime, managed signing custody, node mutation,
QStorage publication, native domain deployment, or production readiness is
claimed by this public-alpha slice.

Required future proof:

- Public MCP gateway endpoint proof
- Managed signing custody proof
- Node mutation proof
- QStorage publication proof
- Native domain and rollback proof

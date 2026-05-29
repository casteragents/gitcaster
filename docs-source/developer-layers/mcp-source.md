# MCP Source Layer

Status: public-alpha source, alpha-local tools

GitCaster now publishes the MCP server source as a developer contribution
surface. The public layer includes JSON-RPC stdio handling, tool schemas,
structured blocker responses, local node endpoint resolution, and redaction
checks.

Public artifacts:

- `apps/mcp`
- `examples/mcp/local-tool-plan.example.json`
- `apps/web/app/open-source/mcp-source/page.tsx`
- `apps/web/public/gitcaster-mcp-source.md`

Blocked until proof exists:

- Public MCP gateway endpoint
- Managed signing custody
- Public node mutation
- QStorage publication
- Native domain deployment and rollback

Verification:

```bash
pnpm run mcp:check
pnpm run secret-scan
```

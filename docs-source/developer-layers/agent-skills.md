# Agent Skills Layer

Status: public-alpha notes, local inspection only

GitCaster now publishes the agent-facing MCP skill notes as a developer
contribution surface. The public layer includes tool naming, schema review,
structured blocker behavior, and placeholder-only local tool plan fixtures.

Public artifacts:

- `apps/mcp/src/tool-registry.ts`
- `apps/mcp/src/schemas.ts`
- `apps/mcp/src/tools`
- `examples/mcp/local-tool-plan.example.json`
- `docs/agent-skills.md`
- `apps/web/public/gitcaster-agent-skills.json`

Blocked until proof exists:

- Public MCP gateway endpoint
- Managed signing custody
- Public node mutation
- QStorage publication
- Native domain routing and rollback
- Production runtime operation

Verification:

```bash
pnpm run agent-skills:check
pnpm run secret-scan
```

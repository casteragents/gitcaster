# GitCaster agent skills layer

Status: public-alpha, local inspection only

This layer documents the agent-facing MCP skill catalog for local review.
It exposes tool names, schemas, structured blocker behavior, and a placeholder-only local tool plan.

Public artifacts:

- `apps/mcp/src/tool-registry.ts`
- `apps/mcp/src/schemas.ts`
- `apps/mcp/src/tools`
- `examples/mcp/local-tool-plan.example.json`
- `docs/agent-skills.md`

Blocked claims:

- public MCP gateway endpoint
- managed signing custody
- public node mutation
- QStorage publication
- native domain routing
- production runtime operation

Verification:

```bash
pnpm run agent-skills:check
```

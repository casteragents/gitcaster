# GitCaster agent skills

Status: public-alpha source notes

GitCaster agent-facing MCP skills are published for local inspection only. The
safe public scope is schema review, tool naming, structured blocker behavior,
and local command-shape testing.

Public source:

- `apps/mcp/src/tool-registry.ts`
- `apps/mcp/src/schemas.ts`
- `apps/mcp/src/tools`
- `examples/mcp/local-tool-plan.example.json`

Reserved managed layers:

- hosted orchestration
- managed signing custody
- production operator controls
- billing and account operations
- private credentials and runtime secrets

Run the local check before contributing:

```bash
pnpm run agent-skills:check
pnpm run agent-skills:public-smoke
```

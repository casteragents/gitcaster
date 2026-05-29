# CLI Layer

Status: public-alpha

GitCaster now publishes the CLI source as a local command-shape surface. The
public layer includes command helpers for local push payloads, issues, pull
requests, and MCP serve planning.

Public artifacts:

- `apps/cli`
- `examples/cli/local-command-plan.example.json`
- `apps/web/app/open-source/cli/page.tsx`

Blocked until proof exists:

- Global installer release
- Public node mutation
- Managed signing custody
- Native storage publication
- Native domain deployment

Verification:

```bash
pnpm run cli:check
pnpm run secret-scan
```

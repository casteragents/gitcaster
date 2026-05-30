# CLI Layer

Status: public-alpha

GitCaster now publishes the CLI source as a local command-shape surface. The
public layer includes command helpers for local push payloads, issues, pull
requests, MCP serve planning, and deploy-plan evidence.

Public artifacts:

- `apps/cli`
- `apps/cli/src/commands/deploy.ts`
- `examples/cli/local-command-plan.example.json`
- `examples/deploy/local-deploy-manifest.example.json`
- `launch/evidence/cli-deploy-plan-local-dry-run.json`
- `launch/evidence/cli-deploy-plan-public-alpha.json`
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
pnpm run cli-deploy-plan:check
pnpm run secret-scan
```

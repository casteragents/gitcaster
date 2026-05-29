# Miniapp Template Layer

Status: public-alpha

GitCaster now publishes the Caster Claim miniapp as a local template shell. The
public layer includes the manifest shape, local assets list, local vendor file
expectations, and deterministic checks that keep runtime claims blocked until
proof exists.

Public artifacts:

- `packages/playground-templates`
- `examples/miniapps/caster-claim-miniapp.local-shell.json`
- `apps/web/app/open-source/miniapp-templates/page.tsx`

Reserved or blocked:

- Managed runtime endpoints
- Native storage publication
- Native domain deployment
- Account custody and production signing

Verification:

```bash
pnpm run miniapp-templates:check
pnpm run secret-scan
```

# GitCaster Push-Local Object Store Public-Alpha Layer

This layer publishes the local object-manifest and push-local workflow for
contributors. It is public-alpha source for local development only.

## Public source

- `packages/object-store` creates local object records, deterministic root
  hashes, local-alpha manifests, and endpoint blocker proofs.
- `apps/node/src/services/push-local-service.ts` converts a signed local path
  push into a local object manifest, a local ref certificate, and repo events.
- `apps/node/src/routes/push-local.ts` exposes the local route shape behind
  signed mutation verification.
- `apps/cli/src/commands/push-local.ts` documents the public-alpha command
  payload shape.
- `examples/push-local/local-object-manifest.example.json` documents the local
  fixture without any private path or secret values.

## What is proven

- Local object records use `sha256:` hashes.
- Local manifests compute a deterministic `sha256:` root hash.
- Ignored and secret-risk paths are excluded or blocked before manifest writes.
- Push-local emits a local `gitcaster.commit.pushed.v1` event.
- Push-local emits a local `gitcaster.ref.certificate.issued.v1` event.
- Recorded ref certificates remain `alpha-local`.
- Unsigned HTTP push-local mutations are blocked.
- QStorage and CasterCloud proofs remain `requires-endpoint`.

## What is not claimed

- No QStorage publication is claimed.
- No normal git push transport is claimed.
- No remote ref durability is claimed.
- No public object hosting is claimed.
- No CasterCloud deployment is claimed.
- No production runtime is claimed.

Run:

```bash
pnpm run push-local-object-store:check
pnpm run test:web
pnpm run secret-scan
```

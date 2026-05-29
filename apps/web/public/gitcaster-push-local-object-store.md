# GitCaster Push-Local Object Store

GitCaster push-local object store is public-alpha source for local app bundle
inspection. It creates local object records, local manifests, local ref
certificates, and blocked endpoint proofs.

Public artifacts:

- `packages/object-store`
- `apps/node/src/services/push-local-service.ts`
- `apps/node/src/routes/push-local.ts`
- `apps/cli/src/commands/push-local.ts`
- `examples/push-local/local-object-manifest.example.json`
- `launch/evidence/push-local-object-store-source.json`

The checker proves local manifest behavior, local-only push records, and
unsigned mutation blockers. It does not claim QStorage publication, normal git
push transport, remote ref durability, public object hosting, CasterCloud
deployment, or production runtime.

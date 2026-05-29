# GitCaster local node API source

Status: public-alpha source, alpha-local runtime

The public `@gitcaster/node` layer exposes the local node API source for
developers who want to inspect local HTTP routes, route matching, health/status
responses, repo/ref route shells, signed mutation envelope verification, and
redaction behavior.

Local verification:

```bash
pnpm run node-api:check
```

The local smoke check starts a loopback-only node and confirms that health,
status, registry, repo list, QStorage, CasterCloud, and domain routes return
honest alpha-local or blocked states.

This public repo does not claim public node federation, hosted node health,
QStorage publication, CasterCloud deployment, native domain mapping, managed
runtime, billing, custody, or production operations.

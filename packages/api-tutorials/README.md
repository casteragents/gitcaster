# @gitcaster/api-tutorials

Local-only API and SDK tutorial request shapes for GitCaster builders.

This package is public-alpha documentation code. It does not call a remote service, does not include live credentials, and does not claim managed endpoint readiness. Use it to inspect the shape of public read requests and guarded agent-post examples before wiring a private server-side integration.

## Included examples

- Public feed read request shape.
- Guarded agent post request shape with placeholder-only credential material.
- Safety checks that reject secret-looking input before tutorial fixtures are published.

## Check

```bash
pnpm --filter @gitcaster/api-tutorials check
```

The examples remain local fixtures until a separate endpoint proof exists.

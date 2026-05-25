# GitCaster Public Alpha

GitCaster is the CasterChain-native repo, agent, miniapp, and CasterCloud deployment network.

This public repository is intentionally scoped for contribution and website visibility. The live/static website artifact is in `docs/` so GitHub Pages can serve it from the main branch after repository Pages is enabled.

## What is included

- `apps/web`: static GitCaster website source.
- `docs`: generated static website export for public browsing.
- `apps/cli`, `apps/node`, `apps/mcp`, and `apps/git-remote-gitcaster`: alpha GitCaster app surfaces.
- `packages/*`: protocol, identity, object, repo, security, SDK, and supporting packages.

## Local checks

```bash
pnpm install
pnpm run build:web
pnpm run test:web
pnpm run secret-scan
```

## Status

This is an alpha public contribution repo. Preview data is labeled. Production CasterCloud, QStorage, native .caster routing, token utility, and public node claims require proof gates before stronger labels are used.

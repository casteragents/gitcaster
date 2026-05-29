# GitCaster Simulator Layer

The simulator layer is the first public developer-friendly robotics/agent layer
in the GitCaster open-core track.

## Public scope

- `packages/simulator`: deterministic local simulation and digital twin export helpers.
- `examples/worlds/local-agent-grid.world.json`: portable example world fixture.
- Website status rows that mark this layer as `public-alpha`, not production.

## Not included

- Managed CasterCloud orchestration.
- High-scale simulation cluster scheduling.
- Enterprise fleet dashboard.
- Secrets, signing custody, billing, or production deployment controls.

## Verification

Run:

```bash
pnpm --filter @gitcaster/simulator check
pnpm run test:web
pnpm run secret-scan
```

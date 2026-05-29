# GitCaster ROS Adapter Layer

The ROS adapter layer is a public developer-friendly robotics bridge for local
GitCaster workflows.

## Public scope

- `packages/ros-adapters`: local launch plan, topic, and message helpers.
- `examples/ros/local-agent-bridge.launch.json`: portable local bridge fixture.
- `examples/ros/local-agent-bridge.messages.json`: deterministic message fixture.
- Website status rows that mark this layer as `public-alpha`, not production.

## Not included

- Managed CasterCloud orchestration.
- High-scale simulation cluster scheduling.
- Enterprise fleet dashboard.
- Custody, billing, private operator controls, or production deployment logic.
- Physical robot command execution.

## Verification

Run:

```bash
pnpm --filter @gitcaster/ros-adapters check
pnpm run test:web
pnpm run secret-scan
```

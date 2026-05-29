# @gitcaster/ros-adapters

Local ROS-style adapter helpers for GitCaster developer workflows.

This package is part of the Apache 2.0 open-core layer. It is intentionally
local-only: it creates launch plan descriptions, topic schemas, and bridge
messages for developer tests. It does not connect to hosted orchestration,
managed scheduling, custody, billing, external robot controllers, or production
deployment systems.

## What is included

- Local launch plan helpers for agent/app/robot bridge development.
- Topic and message schema helpers for deterministic tests.
- Example bridge fixtures under `examples/ros`.
- No network calls and no operator credentials.

## Local check

```bash
pnpm --filter @gitcaster/ros-adapters check
```

## Boundary

Open: local adapter helpers, schemas, launch fixtures, and docs.

Reserved: the managed CasterCloud orchestration plane, high-scale simulation
cluster, enterprise controls, production scheduling, and managed fleet dashboard.

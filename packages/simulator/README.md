# @gitcaster/simulator

Deterministic local simulator utilities for GitCaster developer workflows.

This package is part of the Apache 2.0 open-core layer. It is intentionally local
and does not include hosted orchestration, managed scheduling, fleet dashboards,
custody, billing, or production deployment logic.

## What is included

- Deterministic world stepping for local agent/app simulations.
- Example world loading helpers.
- Digital twin export helpers for portable scene inspection.
- No network calls and no operator secrets.

## Local check

```bash
pnpm --filter @gitcaster/simulator check
```

## Boundary

Open: local simulation primitives, examples, schemas, and digital twin exports.

Reserved: the managed CasterCloud orchestration plane, high-scale simulation
cluster, enterprise controls, production scheduling, and managed fleet dashboard.

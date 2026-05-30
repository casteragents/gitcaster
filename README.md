# GitCaster Public Alpha

GitCaster is the CasterChain-native repo, agent, miniapp, and CasterCloud deployment network.

This public repository is intentionally scoped for contribution and website visibility. The live/static website artifact is in `docs/` so GitHub Pages can serve it from the main branch after repository Pages is enabled.

## What is included

- `apps/web`: static GitCaster website source.
- `docs`: generated static website export for public browsing.
- `apps/cli`, `apps/node`, `apps/mcp`, and `apps/git-remote-gitcaster`: alpha GitCaster app surfaces.
- `packages/*`: protocol, identity, object, repo, security, SDK, and supporting packages.
- `packages/simulator` and `examples/worlds`: local deterministic simulator, example world, and digital twin export helpers.
- `packages/ros-adapters` and `examples/ros`: local ROS-style launch, topic, and message bridge helpers.
- `packages/api-tutorials` and `examples/api`: local API and SDK request-shape tutorials with placeholder-only auth examples.
- `packages/playground-templates` and `examples/miniapps`: local miniapp shell templates, manifests, and blocked-runtime proof fixtures.
- `packages/ecosystem`, `examples/app-shells`, and `apps/web/app/ecosystem`: public-alpha app and miniapp shell catalog, Caster Intelligence redacted shell fixture, and local preview smoke proof.
- `packages/sdk-typescript` and `examples/sdk`: public-alpha TypeScript client helpers with proof-gated runtime methods.
- `apps/cli` and `examples/cli`: public-alpha local command helpers for payload building, MCP serve planning, and redacted deploy-plan dry-runs.
- `apps/git-remote-gitcaster` and `examples/git-remote`: public-alpha remote-helper source and blocked transport fixtures.
- `apps/mcp`, `docs/agent-skills.md`, and `examples/mcp`: public-alpha agent-facing MCP skill notes, schemas, local tool plans, and structured blocker proof.
- `packages/deploy-manifests` and `examples/deploy`: public-alpha local deploy manifest intake, retired dependency markers, and proof blockers.

## Open-core boundary

GitCaster is the public open-core contribution surface for Caster developers.

Open under Apache 2.0:

- ROS packages, adapters, local launch files, and robot/agent bridges.
- APIs, SDKs, protocol types, CLI surfaces, MCP tools, and signed repo interfaces.
- Local simulators, example worlds, fixtures, deterministic proof checkers, and digital twin exporters.
- GO-gated app and miniapp shells, manifests, compatibility adapters, and contribution docs after leak scans pass.
- Public docs, examples, templates, status pages, and roadmap handoffs.

Reserved for the commercial platform:

- Managed orchestration, hosted control plane, deployment coordinator, and account operations.
- Large simulation capacity, pooled compute, scheduling, and managed scaling.
- Proprietary schedulers, placement heuristics, cost controls, and platform optimizations.
- Enterprise controls, private policy packs, support workflows, and managed fleet dashboard.
- Operator secrets, private keys, managed signing custody, billing, and service-level workflows.

See `OPEN_CORE_BOUNDARY.md`, `LICENSE`, and `COMMERCIAL_LICENSE.md`.

## Public update policy

Every public GitCaster push should first post a Casterchain app update from `@casterai`, then post from `@casterchain` on X with `@gitcasterx`, `@CasterAI_`, the GitHub repo, the GitCaster site, and the Casterchain post link. The matching Farcaster update from `@casterchain` should go to `/caster` with the X post link and Casterchain post link.

## Local checks

```bash
pnpm install
pnpm run api-tutorials:check
pnpm run miniapp-templates:check
pnpm run app-shell-preview-smoke:check
pnpm run caster-intelligence-preview:check
pnpm run sdk:check
pnpm run cli:check
pnpm run cli-deploy-plan:check
pnpm run git-remote:check
pnpm run agent-skills:check
pnpm run agent-skills:public-smoke
pnpm run deploy-manifest:check
pnpm run simulator:check
pnpm run ros:check
pnpm run build:web
pnpm run test:web
pnpm run secret-scan
```

## Status

This is an alpha public contribution repo. Preview data is labeled. Production CasterCloud, QStorage, native .caster routing, token utility, and public node claims require proof gates before stronger labels are used.

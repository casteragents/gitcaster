# GitCaster Open-Core Boundary

GitCaster is the public contribution layer for the Caster developer ecosystem.
The intent is to let builders inspect, run, extend, and improve the developer
surfaces while keeping the managed service operations commercially controlled.

## Apache 2.0 Public Layers

The following categories are intended for Apache 2.0 publication in this repo:

- ROS packages, robot adapters, message bridges, local launch files, and sample robot workflows.
- APIs, SDKs, protocol types, CLI commands, MCP tools, and signed-repo developer interfaces.
- Local simulators, example worlds, fixtures, deterministic proof checkers, and digital twin exporters.
- GO-gated app and miniapp shells, manifests, compatibility adapters, and contribution docs after leak scans pass.
- Public docs, examples, templates, status pages, and roadmap handoffs.

## Commercial Platform Layers

The following categories are reserved for the managed Caster platform:

- Managed cloud orchestration, hosted control plane, deployment coordinator, and account operations.
- Large simulation capacity, pooled compute, scheduling, queue allocation, and capacity tuning.
- Proprietary schedulers, placement heuristics, cost controls, and managed scaling logic.
- Enterprise controls, private policy packs, support workflows, and managed fleet dashboard.
- Operator secrets, private keys, managed signing custody, billing, and service-level workflows.

## Publication Rules

- No secrets, private keys, bearer tokens, credential URLs, signing material, or operator-only receipts are committed.
- GO-gated apps and miniapps move public only after proof files show they are safe to publish.
- Public claims must stay tied to proof artifacts or explicit blockers.
- Every public GitCaster push should be announced from `@casterchain` on X with `@gitcasterx`, `@CasterAI_`, the GitHub repo, and the GitCaster website.
- Farcaster announcements should be posted from `@casterchain` and contain only the X post link.

## Contribution Focus

The best first contributions are developer-facing improvements: docs, examples,
local simulators, SDK ergonomics, MCP tool coverage, miniapp compatibility,
digital twin exporters, test fixtures, and proof checkers.

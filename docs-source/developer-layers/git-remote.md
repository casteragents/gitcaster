# Git Remote Helper Layer

Status: public-alpha

GitCaster publishes the `git-remote-gitcaster` source so builders can inspect
the URL parser, ref-list wiring, blocked push/fetch decisions, and Git remote
helper protocol scaffold.

Public artifacts:

- `apps/git-remote-gitcaster`
- `examples/git-remote/blocked-transport-plan.example.json`
- `apps/web/app/open-source/git-remote/page.tsx`
- `apps/web/public/git-remote-gitcaster.md`

Blocked until proof exists:

- Full Git pack push
- Full Git pack fetch or clone
- Public node mutation
- Native storage publication
- Multi-node transport evidence

Verification:

```bash
pnpm run git-remote:check
pnpm run secret-scan
```

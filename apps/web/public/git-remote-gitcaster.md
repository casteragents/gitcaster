# git-remote-gitcaster

Status: public-alpha source, blocked transport

The public `git-remote-gitcaster` layer exposes the Git remote helper scaffold,
GitCaster URL parsing, local ref-list diagnostics, and explicit blocked
decisions for pack push and pack fetch.

Working local contribution path:

```bash
gc repo push-local gitcaster://did:caster:z.../hello-gitcaster --path ./hello-gitcaster
```

Diagnostic-only remote helper examples:

```bash
git-remote-gitcaster --parse gitcaster://did:caster:z.../hello-gitcaster
git-remote-gitcaster --status gitcaster://did:caster:z.../hello-gitcaster
git-remote-gitcaster --explain-push gitcaster://did:caster:z.../hello-gitcaster
git-remote-gitcaster --explain-fetch gitcaster://did:caster:z.../hello-gitcaster
```

No normal `git push` success is claimed in PR-09. Full Git pack transport stays
blocked until PR-22 evidence passes.

Required future proof:

- Pack receive proof
- Object bundle proof
- Ref certificate proof
- Object download proof
- Public node transport smoke proof
- Rollback proof

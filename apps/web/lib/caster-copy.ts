export const PRODUCT = {
  name: "GitCaster",
  line: "Build apps. Run agents. Own the repo.",
  description: "GitCaster is the CasterChain-native repo, agent, miniapp, and CasterCloud deployment network.",
  protocol: "gitcaster://",
  cli: "gc",
  remoteHelper: "git-remote-gitcaster",
  mcp: "gc mcp serve",
  identity: "did:caster:z...",
  localIdentityDir: "~/.gitcaster",
  storage: "CasterCloud / QStorage / Quilibrium",
  token: "$GITCASTER",
  tokenAddress: "0x6de4da2ef9b1260142cd3d1f34a0cdf11bb5dba3",
  nodes: ["node.gitcaster.casterchain", "node2.gitcaster.casterchain", "node3.gitcaster.casterchain"]
};

export const PROOF_STRIP = [
  "CasterDID",
  "signed mutations",
  "signed ref certificates",
  "local alpha node",
  "object manifests",
  "MCP tools",
  "CasterCloud/QStorage blockers",
  "$GITCASTER proof-only utility"
];

export const LOCAL_ALPHA_COMMANDS = [
  "$ gc identity new",
  "ok CasterDID created locally",
  "$ gc repo create hello-gitcaster",
  "ok repo created on local alpha node",
  "$ gc repo push-local hello-gitcaster --path ./hello-gitcaster",
  "ok local object manifest written",
  "ok signed ref certificate issued",
  "! QStorage requires endpoint",
  "! CasterCloud requires endpoint"
];

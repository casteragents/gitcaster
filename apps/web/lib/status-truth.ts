export type GitCasterTruthStatus =
  | "verified"
  | "live"
  | "alpha-local"
  | "public-alpha"
  | "preview"
  | "proof-only"
  | "blocked"
  | "requires-endpoint"
  | "requires-contract"
  | "requires-audit"
  | "requires-governance"
  | "requires-registry"
  | "legacy-reference"
  | "error";

export type TruthSeverity = "good" | "info" | "warn" | "danger" | "neutral";

export type TruthTableRow = {
  surface: string;
  status: GitCasterTruthStatus;
  evidence?: string;
  blocker?: string;
  nextProof: string;
};

export const TRUTH_STATUSES: GitCasterTruthStatus[] = [
  "verified",
  "live",
  "alpha-local",
  "public-alpha",
  "preview",
  "proof-only",
  "blocked",
  "requires-endpoint",
  "requires-contract",
  "requires-audit",
  "requires-governance",
  "requires-registry",
  "legacy-reference",
  "error"
];

export function statusLabel(status: GitCasterTruthStatus): string {
  return status;
}

export function statusDescription(status: GitCasterTruthStatus): string {
  const descriptions: Record<GitCasterTruthStatus, string> = {
    verified: "Direct evidence exists for this claim.",
    live: "Direct current evidence exists for this online surface.",
    "alpha-local": "Available in the local alpha workflow only.",
    "public-alpha": "Public alpha evidence exists.",
    preview: "Preview data only; not canonical state.",
    "proof-only": "Tracked as proof material without settled utility.",
    blocked: "Blocked until the named proof or external input exists.",
    "requires-endpoint": "Requires a configured endpoint and proof.",
    "requires-contract": "Requires deployed and audited contract evidence.",
    "requires-audit": "Requires external security review evidence.",
    "requires-governance": "Requires governance evidence.",
    "requires-registry": "Requires registry proof.",
    "legacy-reference": "Reference only; not GitCaster identity.",
    error: "Evidence or configuration is invalid."
  };
  return descriptions[status];
}

export function statusSeverity(status: GitCasterTruthStatus): TruthSeverity {
  if (status === "verified" || status === "live" || status === "public-alpha") return "good";
  if (status === "alpha-local" || status === "preview" || status === "proof-only") return "info";
  if (status.startsWith("requires-") || status === "legacy-reference") return "warn";
  if (status === "blocked" || status === "error") return "danger";
  return "neutral";
}

export function isEvidenceBackedStatus(status: GitCasterTruthStatus, evidence?: string): boolean {
  if (status === "verified" || status === "live" || status === "public-alpha") return Boolean(evidence);
  return true;
}

export function truthTableRows(): TruthTableRow[] {
  return [
    { surface: "website static build", status: "alpha-local", evidence: "launch/evidence/pr-12-web-status-proof-ui.json", nextProof: "Static export build output" },
    { surface: "QStorage publish", status: "requires-endpoint", blocker: "CASTER_QSTORAGE_ENDPOINT and write/verify proof missing", nextProof: "QStorage endpoint publish evidence" },
    { surface: "CasterCloud deploy", status: "requires-endpoint", blocker: "CasterCloud deploy endpoint and release proof missing", nextProof: "CasterCloud release evidence" },
    { surface: "local alpha node", status: "alpha-local", evidence: "launch/evidence/pr-04-local-alpha-node.json", nextProof: "Signed local node smoke evidence" },
    { surface: "node.gitcaster.casterchain", status: "blocked", blocker: "No signed public node health proof yet", nextProof: "Signed node health proof" },
    { surface: "node2.gitcaster.casterchain", status: "blocked", blocker: "No signed public node health proof yet", nextProof: "Signed node health proof" },
    { surface: "node3.gitcaster.casterchain", status: "blocked", blocker: "No signed public node health proof yet", nextProof: "Signed node health proof" },
    { surface: "CLI", status: "alpha-local", evidence: "launch/evidence/pr-08-push-local.json", nextProof: "Release installer evidence" },
    { surface: "git-remote-gitcaster", status: "alpha-local", evidence: "launch/evidence/pr-09-git-remote-helper.json", nextProof: "Git transport RC evidence" },
    { surface: "push-local", status: "alpha-local", evidence: "launch/evidence/pr-08-push-local.json", nextProof: "QStorage-backed push evidence" },
    { surface: "ref certificates", status: "alpha-local", evidence: "launch/evidence/pr-07-ref-consensus.json", nextProof: "Remote ref consensus proof" },
    { surface: "object store", status: "alpha-local", evidence: "launch/evidence/pr-06-object-store.json", nextProof: "QStorage object verification proof" },
    { surface: "MCP", status: "alpha-local", evidence: "launch/evidence/pr-11-mcp-tools.json", nextProof: "Public MCP gateway proof" },
    { surface: "SDK TS", status: "blocked", blocker: "SDK TypeScript package is not implemented in PR-12", nextProof: "SDK package evidence" },
    { surface: "SDK Python", status: "blocked", blocker: "SDK Python package is not implemented in PR-12", nextProof: "SDK package evidence" },
    { surface: "ecosystem manifest", status: "preview", blocker: "Canonical ecosystem manifest is PR-13", nextProof: "PR-13 canonical manifest evidence" },
    { surface: "Claim Miniapp", status: "preview", blocker: "Claim Miniapp migration is not PR-12", nextProof: "Dedicated miniapp migration evidence" },
    { surface: "Caster Punks", status: "preview", blocker: "Image indexing is not PR-12", nextProof: "Public index-only proof" },
    { surface: "CasterAgents", status: "blocked", blocker: "Runtime state is protected and not read by PR-12", nextProof: "Safety-lock evidence" },
    { surface: "token utility", status: "proof-only", blocker: "$GITCASTER utility remains planned/proof-only here", nextProof: "Contract and audit evidence" },
    { surface: "token contracts", status: "requires-contract", blocker: "Audited contract evidence missing", nextProof: "Contract deployment and audit proof" },
    { surface: "domains", status: "requires-registry", blocker: ".caster registry proof missing", nextProof: "Domain registry evidence" },
    { surface: "installer", status: "blocked", blocker: "Hosted installer proof missing", nextProof: "Installer release evidence" },
    { surface: "security gate", status: "requires-audit", blocker: "External audit evidence missing", nextProof: "Security audit report" },
    { surface: "production QA", status: "blocked", blocker: "Production QA gate is not evaluated in PR-12", nextProof: "Production QA acceptance evidence" },
    { surface: "production launch gate", status: "blocked", blocker: "Production launch gate is blocked until PR-32", nextProof: "PR-32 launch gate evidence" }
  ];
}

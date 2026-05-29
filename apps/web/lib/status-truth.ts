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

export const TRUTH_SURFACES = [
  "GitHub repo",
  "GitHub Pages website",
  "open-core boundary",
  "Apache 2.0 license",
  "commercial boundary notice",
  "public update policy",
  "website static build",
  "developer package workspace",
  "protocol package",
  "identity package",
  "capabilities package",
  "repo records package",
  "object store package",
  "ref consensus package",
  "security package",
  "audit package",
  "observability package",
  "TypeScript SDK source",
  "CLI source",
  "git-remote-gitcaster source",
  "MCP source",
  "local node API source",
  "local alpha workflow",
  "ecosystem manifest",
  "Claim Miniapp template",
  "Caster Punks index",
  "CasterAgents",
  "$GITCASTER token address",
  "$GITCASTER utility",
  "QStorage publish",
  "CasterCloud deploy",
  ".caster domains",
  "public node federation",
  "hosted installer",
  "security audit",
  "production QA",
  "production launch gate"
] as const;

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
    { surface: "GitHub repo", status: "live", evidence: "https://github.com/casteragents/gitcaster", nextProof: "Signed release tag and package checks" },
    { surface: "GitHub Pages website", status: "live", evidence: "https://casteragents.github.io/gitcaster/", nextProof: "Independent uptime and browser smoke evidence" },
    { surface: "open-core boundary", status: "verified", evidence: "OPEN_CORE_BOUNDARY.md", nextProof: "Per-layer GO proof before each larger import" },
    { surface: "Apache 2.0 license", status: "verified", evidence: "LICENSE", nextProof: "Third-party license inventory for each new imported layer" },
    { surface: "commercial boundary notice", status: "verified", evidence: "COMMERCIAL_LICENSE.md", nextProof: "Commercial service terms outside the public repo" },
    { surface: "public update policy", status: "verified", evidence: "README.md", nextProof: "Automated social receipt checker" },
    { surface: "website static build", status: "verified", evidence: "launch/evidence/pr-12-web-status-proof-ui.json", nextProof: "Fresh browser smoke after every public push" },
    { surface: "developer package workspace", status: "public-alpha", evidence: "packages", nextProof: "Package-level release manifests" },
    { surface: "protocol package", status: "alpha-local", evidence: "packages/protocol", nextProof: "Published package artifact" },
    { surface: "identity package", status: "alpha-local", evidence: "packages/identity", nextProof: "Published package artifact and key custody review" },
    { surface: "capabilities package", status: "alpha-local", evidence: "packages/capabilities", nextProof: "Capability abuse test evidence" },
    { surface: "repo records package", status: "alpha-local", evidence: "packages/repo-records", nextProof: "Remote Caster event-log proof" },
    { surface: "object store package", status: "alpha-local", evidence: "packages/object-store", nextProof: "QStorage object verification proof" },
    { surface: "ref consensus package", status: "alpha-local", evidence: "packages/ref-consensus", nextProof: "Remote ref consensus proof" },
    { surface: "security package", status: "alpha-local", evidence: "packages/security", nextProof: "External audit evidence" },
    { surface: "audit package", status: "alpha-local", evidence: "packages/audit", nextProof: "License and data-rights review evidence" },
    { surface: "observability package", status: "alpha-local", evidence: "packages/observability", nextProof: "Live incident drill evidence" },
    { surface: "TypeScript SDK source", status: "alpha-local", evidence: "packages/sdk-typescript", nextProof: "SDK packaging and npm release proof" },
    { surface: "CLI source", status: "alpha-local", evidence: "apps/cli", nextProof: "Installer release evidence" },
    { surface: "git-remote-gitcaster source", status: "alpha-local", evidence: "apps/git-remote-gitcaster", nextProof: "Git transport RC evidence" },
    { surface: "MCP source", status: "alpha-local", evidence: "apps/mcp", nextProof: "Public MCP gateway proof" },
    { surface: "local node API source", status: "alpha-local", evidence: "apps/node", nextProof: "Signed public node health proof" },
    { surface: "local alpha workflow", status: "alpha-local", evidence: "apps/web/app/start/page.tsx", nextProof: "End-to-end local install smoke" },
    { surface: "ecosystem manifest", status: "preview", evidence: "docs/gitcaster-ecosystem.canonical.json", nextProof: "GO-gated import proof for each public app" },
    { surface: "Claim Miniapp template", status: "alpha-local", evidence: "packages/playground-templates/src/caster-claim-miniapp.ts", nextProof: "Dedicated miniapp migration evidence" },
    { surface: "Caster Punks index", status: "preview", evidence: "docs/caster-punks-index.json", nextProof: "Rights-reviewed public index-only proof" },
    { surface: "CasterAgents", status: "blocked", blocker: "Runtime state remains protected; only safe interfaces can be imported after review.", nextProof: "Safety-lock and redaction evidence" },
    { surface: "$GITCASTER token address", status: "proof-only", evidence: "apps/web/app/token/page.tsx", nextProof: "Contract, governance, and audit evidence" },
    { surface: "$GITCASTER utility", status: "proof-only", blocker: "$GITCASTER utility remains planned/proof-only in this public repo.", nextProof: "Contract and audit evidence" },
    { surface: "QStorage publish", status: "requires-endpoint", blocker: "QStorage endpoint/write/verify proof is not included in the public repo.", nextProof: "QStorage endpoint publish evidence" },
    { surface: "CasterCloud deploy", status: "requires-endpoint", blocker: "Managed CasterCloud deployment proof is not included in the public repo.", nextProof: "CasterCloud release evidence" },
    { surface: ".caster domains", status: "requires-registry", blocker: ".caster registry proof is not included in the public repo.", nextProof: "Domain registry evidence" },
    { surface: "public node federation", status: "blocked", blocker: "No signed public multi-node health proof is included here.", nextProof: "Signed node health proof" },
    { surface: "hosted installer", status: "blocked", blocker: "Hosted installer proof is not included in the public repo.", nextProof: "Installer release evidence" },
    { surface: "security audit", status: "requires-audit", blocker: "External security audit evidence is not included in the public repo.", nextProof: "Security audit report" },
    { surface: "production QA", status: "blocked", blocker: "Production QA acceptance evidence is not included in the public repo.", nextProof: "Production QA acceptance evidence" },
    { surface: "production launch gate", status: "blocked", blocker: "Production launch remains blocked until release-candidate, audit, deployment, rollback, and public-node evidence are all present.", nextProof: "Production launch gate evidence" }
  ];
}

import { createHash } from "node:crypto";

export type GitCasterHealthSurface =
  | "local-node"
  | "public-node-1"
  | "public-node-2"
  | "public-node-3"
  | "federation"
  | "qstorage"
  | "castercloud"
  | "web"
  | "git-transport"
  | "mcp"
  | "cli"
  | "sdk-typescript"
  | "sdk-python"
  | "ecosystem-directory"
  | "claim-guard"
  | "security-gate"
  | "evidence-integrity"
  | "token"
  | "domains";

export type GitCasterHealthStatus =
  | "alpha-local"
  | "planned"
  | "blocked"
  | "manual-required"
  | "requires-endpoint"
  | "requires-health-proof"
  | "requires-federation-proof"
  | "requires-verification-proof"
  | "requires-deployment-proof"
  | "monitored"
  | "verified"
  | "error";

export type GitCasterHealthProbe = {
  type: "gitcaster.ops.health-probe.v1";
  surface: GitCasterHealthSurface;
  status: GitCasterHealthStatus;
  endpoint: string | null;
  method: "evidence-only" | "GET" | "manual";
  enabled: boolean;
  liveClaimAllowed: boolean;
  evidence: string[];
  requiredProof: string[];
  blockers: string[];
  secretValuesPrinted: false;
};

export type GitCasterHealthMonitorPlan = {
  type: "gitcaster.ops.health-monitor-plan.v1";
  status: "planned" | "blocked" | "manual-required" | "monitored";
  createdAt: string;
  probes: GitCasterHealthProbe[];
  summary: Record<string, number>;
  rootHash: string;
  canClaimLiveMonitoring: false;
  canShipProduction: false;
};

export function createHealthProbe(args: Omit<GitCasterHealthProbe, "type" | "secretValuesPrinted" | "liveClaimAllowed"> & {
  liveClaimAllowed?: boolean;
}): GitCasterHealthProbe {
  const liveClaimAllowed = isLiveHealthStatusAllowed(args.status, args.evidence) && Boolean(args.liveClaimAllowed);
  return redactHealthProbe({
    type: "gitcaster.ops.health-probe.v1",
    secretValuesPrinted: false,
    liveClaimAllowed,
    ...args
  });
}

export function createHealthMonitorPlan(args: {
  createdAt?: string;
  probes: GitCasterHealthProbe[];
  status?: "planned" | "blocked" | "manual-required" | "monitored";
}): GitCasterHealthMonitorPlan {
  const plan = {
    type: "gitcaster.ops.health-monitor-plan.v1" as const,
    status: args.status ?? "planned",
    createdAt: args.createdAt ?? new Date().toISOString(),
    probes: args.probes.map(redactHealthProbe),
    summary: summarizeHealthMonitorPlan({ probes: args.probes }),
    canClaimLiveMonitoring: false as const,
    canShipProduction: false as const
  };
  return { ...plan, rootHash: healthMonitorPlanRootHash(plan) };
}

export function summarizeHealthMonitorPlan(plan: Pick<GitCasterHealthMonitorPlan, "probes">): Record<string, number> {
  return {
    probesTotal: plan.probes.length,
    blocked: plan.probes.filter((probe) => probe.status === "blocked" || probe.blockers.length > 0).length,
    requiresEndpoint: plan.probes.filter((probe) => probe.status === "requires-endpoint").length,
    requiresProof: plan.probes.filter((probe) => probe.status.includes("proof")).length,
    monitored: plan.probes.filter((probe) => probe.status === "monitored").length
  };
}

export function healthMonitorPlanRootHash(plan: Omit<GitCasterHealthMonitorPlan, "rootHash"> | GitCasterHealthMonitorPlan): string {
  return `sha256:${createHash("sha256").update(stable({ ...plan, rootHash: undefined })).digest("hex")}`;
}

export function redactHealthProbe(probe: GitCasterHealthProbe): GitCasterHealthProbe {
  return {
    ...probe,
    endpoint: probe.endpoint && /token|secret|key=|password/i.test(probe.endpoint) ? null : probe.endpoint,
    evidence: probe.evidence.map((item) => item.replace(/(token|secret|key)=\S+/gi, "$1=[redacted]")),
    secretValuesPrinted: false,
    liveClaimAllowed: false
  };
}

export function isLiveHealthStatusAllowed(status: GitCasterHealthStatus, evidence: string[]): boolean {
  if (status === "monitored" || status === "verified") return evidence.length > 0;
  return false;
}

export function defaultHealthProbes(): GitCasterHealthProbe[] {
  const surfaces: GitCasterHealthSurface[] = [
    "local-node",
    "public-node-1",
    "public-node-2",
    "public-node-3",
    "federation",
    "qstorage",
    "castercloud",
    "web",
    "git-transport",
    "mcp",
    "cli",
    "sdk-typescript",
    "sdk-python",
    "ecosystem-directory",
    "claim-guard",
    "security-gate",
    "evidence-integrity",
    "token",
    "domains"
  ];
  return surfaces.map((surface) => createHealthProbe({
    surface,
    status: statusForSurface(surface),
    endpoint: null,
    method: "evidence-only",
    enabled: false,
    evidence: [],
    requiredProof: requiredProofForSurface(surface),
    blockers: [`${surface} monitoring requires proof before stronger claims.`]
  }));
}

function statusForSurface(surface: GitCasterHealthSurface): GitCasterHealthStatus {
  if (surface === "local-node") return "alpha-local";
  if (surface.startsWith("public-node")) return "requires-health-proof";
  if (surface === "federation") return "requires-federation-proof";
  if (surface === "qstorage") return "requires-verification-proof";
  if (surface === "castercloud") return "requires-deployment-proof";
  if (surface === "token" || surface === "domains") return "manual-required";
  return "planned";
}

function requiredProofForSurface(surface: GitCasterHealthSurface): string[] {
  if (surface.startsWith("public-node") || surface === "federation") return ["launch/evidence/pr-24-public-node-ops-federation.json"];
  if (surface === "qstorage" || surface === "castercloud") return ["launch/evidence/pr-23-castercloud-qstorage-live-gate.json"];
  if (surface === "git-transport") return ["launch/evidence/pr-22-git-transport-rc.json"];
  if (surface === "claim-guard") return ["launch/evidence/pr-25-web-production-hardening.json"];
  if (surface === "security-gate") return ["launch/evidence/pr-27-security-redteam-crypto-audit.json"];
  return [];
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => `${JSON.stringify(key)}:${stable(val)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

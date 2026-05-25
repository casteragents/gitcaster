import { createHash } from "node:crypto";

export type GitCasterRollbackSurface =
  | "web-static-export"
  | "deployment-manifest"
  | "qstorage-proof"
  | "castercloud-release"
  | "public-node-registry"
  | "ecosystem-directory"
  | "sdk-package"
  | "cli-installer"
  | "claim-guard"
  | "evidence-bundle"
  | "token-copy"
  | "domain-copy";

export type GitCasterRollbackStatus = "planned" | "blocked" | "dry-run-passed" | "dry-run-failed" | "requires-deployment-proof" | "requires-rollback-proof" | "manual-required" | "error";

export type GitCasterRollbackStep = {
  type: "gitcaster.ops.rollback-step.v1";
  surface: GitCasterRollbackSurface;
  status: GitCasterRollbackStatus;
  description: string;
  dryRunOnly: true;
  destructive: false;
  externalCall: false;
  evidence: string[];
};

export type GitCasterRollbackCheck = {
  type: "gitcaster.ops.rollback-check.v1";
  surface: GitCasterRollbackSurface;
  status: GitCasterRollbackStatus;
  requiredProof: string[];
  blockers: string[];
};

export type GitCasterRollbackPlan = {
  type: "gitcaster.ops.rollback-plan.v1";
  status: "planned" | "blocked" | "dry-run-passed" | "dry-run-failed" | "manual-required" | "error";
  createdAt: string;
  surfaces: GitCasterRollbackSurface[];
  steps: GitCasterRollbackStep[];
  checks: GitCasterRollbackCheck[];
  rootHash: string;
  rollbackExecuted: false;
  rollbackVerified: false;
  canShipProduction: false;
};

export function createRollbackStep(args: Omit<GitCasterRollbackStep, "type" | "dryRunOnly" | "destructive" | "externalCall">): GitCasterRollbackStep {
  return {
    type: "gitcaster.ops.rollback-step.v1",
    dryRunOnly: true,
    destructive: false,
    externalCall: false,
    ...args
  };
}

export function createRollbackCheck(args: Omit<GitCasterRollbackCheck, "type">): GitCasterRollbackCheck {
  return { type: "gitcaster.ops.rollback-check.v1", ...args };
}

export function createRollbackPlan(args: { createdAt?: string; surfaces?: GitCasterRollbackSurface[]; status?: GitCasterRollbackPlan["status"] }): GitCasterRollbackPlan {
  const surfaces = args.surfaces ?? REQUIRED_ROLLBACK_SURFACES;
  const steps = surfaces.map((surface) => createRollbackStep({
    surface,
    status: "planned",
    description: `Dry-run rollback readiness check for ${surface}.`,
    evidence: []
  }));
  const checks = surfaces.map((surface) => createRollbackCheck({
    surface,
    status: statusForSurface(surface),
    requiredProof: requiredProofForSurface(surface),
    blockers: [`${surface} rollback requires proof before execution.`]
  }));
  const plan = {
    type: "gitcaster.ops.rollback-plan.v1" as const,
    status: args.status ?? "manual-required",
    createdAt: args.createdAt ?? new Date().toISOString(),
    surfaces,
    steps,
    checks,
    rollbackExecuted: false as const,
    rollbackVerified: false as const,
    canShipProduction: false as const
  };
  return { ...plan, rootHash: rollbackPlanRootHash(plan) };
}

export function summarizeRollbackPlan(plan: Pick<GitCasterRollbackPlan, "steps" | "checks">): Record<string, number> {
  return {
    stepsTotal: plan.steps.length,
    checksTotal: plan.checks.length,
    dryRunOnly: plan.steps.filter((step) => step.dryRunOnly).length,
    blocked: plan.checks.filter((check) => check.status === "blocked" || check.blockers.length > 0).length,
    destructive: plan.steps.filter((step) => step.destructive).length,
    externalCalls: plan.steps.filter((step) => step.externalCall).length
  };
}

export function rollbackPlanRootHash(plan: Omit<GitCasterRollbackPlan, "rootHash"> | GitCasterRollbackPlan): string {
  return `sha256:${createHash("sha256").update(stable({ ...plan, rootHash: undefined })).digest("hex")}`;
}

export function redactRollbackPlan(plan: GitCasterRollbackPlan): GitCasterRollbackPlan {
  const redacted = {
    ...plan,
    steps: plan.steps.map((step) => ({ ...step, destructive: false as const, externalCall: false as const })),
    rollbackExecuted: false as const,
    rollbackVerified: false as const,
    canShipProduction: false as const
  };
  return { ...redacted, rootHash: rollbackPlanRootHash(redacted) };
}

export function canExecuteRollback(plan: GitCasterRollbackPlan, evidence: string[]): boolean {
  return false && plan.rollbackExecuted && evidence.length > 0;
}

export const REQUIRED_ROLLBACK_SURFACES: GitCasterRollbackSurface[] = [
  "web-static-export",
  "deployment-manifest",
  "qstorage-proof",
  "castercloud-release",
  "public-node-registry",
  "ecosystem-directory",
  "sdk-package",
  "cli-installer",
  "claim-guard",
  "evidence-bundle",
  "token-copy",
  "domain-copy"
];

function statusForSurface(surface: GitCasterRollbackSurface): GitCasterRollbackStatus {
  if (surface === "qstorage-proof" || surface === "castercloud-release" || surface === "deployment-manifest") return "requires-deployment-proof";
  return "manual-required";
}

function requiredProofForSurface(surface: GitCasterRollbackSurface): string[] {
  if (surface === "qstorage-proof" || surface === "castercloud-release") return ["launch/evidence/pr-23-castercloud-qstorage-live-gate.json"];
  if (surface === "public-node-registry") return ["launch/evidence/pr-24-public-node-ops-federation.json"];
  if (surface === "ecosystem-directory") return ["launch/evidence/pr-28-ecosystem-rc-import.json"];
  return ["rollback dry-run evidence"];
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => `${JSON.stringify(key)}:${stable(val)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

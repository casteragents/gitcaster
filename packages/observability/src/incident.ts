import { createHash } from "node:crypto";

export type GitCasterIncidentSeverity = "sev1-critical" | "sev2-high" | "sev3-medium" | "sev4-low";
export type GitCasterIncidentStatus = "planned" | "manual-required" | "blocked" | "drill-passed" | "drill-failed" | "requires-runbook" | "requires-owner" | "requires-evidence";
export type GitCasterIncidentScenario =
  | "public-node-outage"
  | "federation-mismatch"
  | "qstorage-proof-failure"
  | "castercloud-deploy-failure"
  | "web-claim-guard-bypass"
  | "secret-leak"
  | "casteragents-state-leak"
  | "caster-punks-bundle-bloat"
  | "git-transport-false-claim"
  | "replay-attack"
  | "capability-escalation"
  | "token-overclaim"
  | "domain-overclaim"
  | "ecosystem-submission-abuse"
  | "evidence-corruption"
  | "rollback-failure";

export type GitCasterIncidentRunbook = {
  type: "gitcaster.ops.incident-runbook.v1";
  scenario: GitCasterIncidentScenario;
  severity: GitCasterIncidentSeverity;
  status: GitCasterIncidentStatus;
  owner: "security" | "ops" | "web" | "protocol" | "ecosystem" | "release";
  detection: string[];
  containment: string[];
  rollback: string[];
  communication: string[];
  evidenceToCollect: string[];
  postIncident: string[];
  secretsIncluded: false;
  runtimeStateIncluded: false;
};

export type GitCasterIncidentResponsePlan = {
  type: "gitcaster.ops.incident-response-plan.v1";
  status: "planned" | "manual-required" | "blocked";
  createdAt: string;
  runbooks: GitCasterIncidentRunbook[];
  summary: Record<string, number>;
  rootHash: string;
  incidentResponseCompleteClaimed: false;
  publicSlaClaimed: false;
  canShipProduction: false;
};

export function createIncidentScenario(args: { scenario: GitCasterIncidentScenario; severity?: GitCasterIncidentSeverity; owner?: GitCasterIncidentRunbook["owner"] }): GitCasterIncidentRunbook {
  return createIncidentRunbook({
    scenario: args.scenario,
    severity: args.severity ?? severityForScenario(args.scenario),
    owner: args.owner ?? ownerForScenario(args.scenario),
    status: "manual-required",
    detection: [`Collect redacted evidence for ${args.scenario}.`],
    containment: [`Contain ${args.scenario} before any stronger public claim.`],
    rollback: [`Evaluate rollback decision for ${args.scenario}.`],
    communication: ["Use operator-approved status copy only."],
    evidenceToCollect: ["redacted logs", "root hash", "operator note"],
    postIncident: ["file follow-up issue", "update proof gate"]
  });
}

export function createIncidentRunbook(args: Omit<GitCasterIncidentRunbook, "type" | "secretsIncluded" | "runtimeStateIncluded">): GitCasterIncidentRunbook {
  return redactIncidentRunbook({
    type: "gitcaster.ops.incident-runbook.v1",
    secretsIncluded: false,
    runtimeStateIncluded: false,
    ...args
  });
}

export function createIncidentResponsePlan(args: { createdAt?: string; runbooks?: GitCasterIncidentRunbook[]; status?: "planned" | "manual-required" | "blocked" }): GitCasterIncidentResponsePlan {
  const runbooks = args.runbooks ?? REQUIRED_SCENARIOS.map((scenario) => createIncidentScenario({ scenario }));
  const plan = {
    type: "gitcaster.ops.incident-response-plan.v1" as const,
    status: args.status ?? "manual-required",
    createdAt: args.createdAt ?? new Date().toISOString(),
    runbooks: runbooks.map(redactIncidentRunbook),
    summary: summarizeIncidentResponsePlan({ runbooks }),
    incidentResponseCompleteClaimed: false as const,
    publicSlaClaimed: false as const,
    canShipProduction: false as const
  };
  return { ...plan, rootHash: incidentResponsePlanRootHash(plan) };
}

export function summarizeIncidentResponsePlan(plan: Pick<GitCasterIncidentResponsePlan, "runbooks">): Record<string, number> {
  return {
    runbooksTotal: plan.runbooks.length,
    manualRequired: plan.runbooks.filter((runbook) => runbook.status === "manual-required").length,
    blocked: plan.runbooks.filter((runbook) => runbook.status === "blocked").length,
    critical: plan.runbooks.filter((runbook) => runbook.severity === "sev1-critical").length
  };
}

export function incidentResponsePlanRootHash(plan: Omit<GitCasterIncidentResponsePlan, "rootHash"> | GitCasterIncidentResponsePlan): string {
  return `sha256:${createHash("sha256").update(stable({ ...plan, rootHash: undefined })).digest("hex")}`;
}

export function redactIncidentRunbook(runbook: GitCasterIncidentRunbook): GitCasterIncidentRunbook {
  return {
    ...runbook,
    detection: runbook.detection.map(redact),
    containment: runbook.containment.map(redact),
    rollback: runbook.rollback.map(redact),
    communication: runbook.communication.map(redact),
    evidenceToCollect: runbook.evidenceToCollect.map(redact),
    postIncident: runbook.postIncident.map(redact),
    secretsIncluded: false,
    runtimeStateIncluded: false
  };
}

export const REQUIRED_SCENARIOS: GitCasterIncidentScenario[] = [
  "public-node-outage",
  "federation-mismatch",
  "qstorage-proof-failure",
  "castercloud-deploy-failure",
  "web-claim-guard-bypass",
  "secret-leak",
  "casteragents-state-leak",
  "caster-punks-bundle-bloat",
  "git-transport-false-claim",
  "replay-attack",
  "capability-escalation",
  "token-overclaim",
  "domain-overclaim",
  "ecosystem-submission-abuse",
  "evidence-corruption",
  "rollback-failure"
];

function severityForScenario(scenario: GitCasterIncidentScenario): GitCasterIncidentSeverity {
  if (["secret-leak", "casteragents-state-leak", "replay-attack", "capability-escalation"].includes(scenario)) return "sev1-critical";
  if (["public-node-outage", "qstorage-proof-failure", "castercloud-deploy-failure", "rollback-failure"].includes(scenario)) return "sev2-high";
  return "sev3-medium";
}

function ownerForScenario(scenario: GitCasterIncidentScenario): GitCasterIncidentRunbook["owner"] {
  if (scenario.includes("secret") || scenario.includes("capability") || scenario.includes("replay")) return "security";
  if (scenario.includes("claim") || scenario.includes("punks")) return "web";
  if (scenario.includes("ecosystem")) return "ecosystem";
  if (scenario.includes("rollback")) return "release";
  return "ops";
}

function redact(value: string): string {
  const bearer = new RegExp("Authorization:\\s*Bearer\\s+\\S+", "gi");
  const secretPrefix = new RegExp(`\\b${"s"}${"k"}-[A-Za-z0-9_-]{12,}`, "g");
  return value.replace(bearer, "authorization redacted").replace(secretPrefix, "secret redacted");
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => `${JSON.stringify(key)}:${stable(val)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

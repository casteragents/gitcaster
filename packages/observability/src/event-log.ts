import { createHash } from "node:crypto";

export type GitCasterOpsEventSeverity = "info" | "warning" | "high" | "critical";
export type GitCasterOpsEventKind =
  | "build"
  | "deploy"
  | "verify"
  | "node-health"
  | "federation"
  | "git-transport"
  | "qstorage"
  | "castercloud"
  | "security"
  | "secret-scan"
  | "fake-claim"
  | "sensitive-state"
  | "caster-punks-bundle"
  | "incident"
  | "rollback"
  | "audit"
  | "release"
  | "manual-review";

export type GitCasterOpsEventStatus = "passed" | "failed" | "blocked" | "manual-required" | "requires-endpoint" | "error";

export type GitCasterOpsEvent = {
  type: "gitcaster.ops.event.v1";
  id: string;
  kind: GitCasterOpsEventKind;
  severity: GitCasterOpsEventSeverity;
  status: GitCasterOpsEventStatus;
  title: string;
  summary: string;
  source: string;
  evidence: string[];
  redacted: true;
  createdAt: string;
  secretValuesPrinted: false;
};

export type GitCasterOpsEventLog = {
  type: "gitcaster.ops.event-log.v1";
  createdAt: string;
  events: GitCasterOpsEvent[];
  rootHash: string;
  redacted: true;
  canShipProduction: false;
};

export function createOpsEvent(args: Omit<GitCasterOpsEvent, "type" | "id" | "createdAt" | "redacted" | "secretValuesPrinted"> & {
  id?: string;
  createdAt?: string;
}): GitCasterOpsEvent {
  assertNoSensitiveOpsValue(args);
  const createdAt = args.createdAt ?? new Date().toISOString();
  return redactOpsEvent({
    type: "gitcaster.ops.event.v1",
    id: args.id ?? `ops-${createHash("sha256").update(`${args.kind}:${args.title}:${createdAt}`).digest("hex").slice(0, 16)}`,
    createdAt,
    redacted: true,
    secretValuesPrinted: false,
    ...args
  });
}

export function createOpsEventLog(events: GitCasterOpsEvent[], createdAt = new Date().toISOString()): GitCasterOpsEventLog {
  const log = {
    type: "gitcaster.ops.event-log.v1" as const,
    createdAt,
    events: events.map(redactOpsEvent),
    redacted: true as const,
    canShipProduction: false as const
  };
  return { ...log, rootHash: opsEventLogRootHash(log) };
}

export function redactOpsEvent(event: GitCasterOpsEvent): GitCasterOpsEvent {
  return {
    ...event,
    title: redactText(event.title),
    summary: redactText(event.summary),
    source: redactText(event.source),
    evidence: event.evidence.map(redactText),
    redacted: true,
    secretValuesPrinted: false
  };
}

export function redactOpsEventLog(log: GitCasterOpsEventLog): GitCasterOpsEventLog {
  const redacted = {
    ...log,
    events: log.events.map(redactOpsEvent),
    redacted: true as const,
    canShipProduction: false as const
  };
  return { ...redacted, rootHash: opsEventLogRootHash(redacted) };
}

export function opsEventRootHash(event: GitCasterOpsEvent): string {
  return `sha256:${createHash("sha256").update(stable({ ...redactOpsEvent(event), rootHash: undefined })).digest("hex")}`;
}

export function opsEventLogRootHash(log: Omit<GitCasterOpsEventLog, "rootHash"> | GitCasterOpsEventLog): string {
  return `sha256:${createHash("sha256").update(stable({ ...log, rootHash: undefined })).digest("hex")}`;
}

export function assertNoSensitiveOpsValue(value: unknown): void {
  const text = JSON.stringify(value);
  if (/BEGIN (OPENSSH |)PRIVATE KEY|Authorization:\s*Bearer\s+\S+|sk-[A-Za-z0-9_-]{12,}|OPENAI_API_KEY=\S+|CASTER_QSTORAGE_WRITE_TOKEN=\S+|CASTER_CLOUD_DEPLOY_TOKEN=\S+|FARCASTER_TOKEN=\S+|HYPERSNAP\S*=\S+|mnemonic|seed phrase|data:image\//i.test(text)) {
    throw new Error("sensitive value detected");
  }
  if (/balances\.json|processed_ids|pending-posts|ranking|tipping-state|casteragents-runtime/i.test(text)) {
    throw new Error("CasterAgents runtime value detected");
  }
  if (/[A-Za-z0-9+/]{500,}={0,2}/.test(text)) throw new Error("long encoded blob detected");
}

function redactText(value: string): string {
  return value
    .replace(/Authorization:\s*Bearer\s+\S+/gi, "Authorization: Bearer [redacted]")
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, "sk-[redacted]")
    .replace(/(OPENAI_API_KEY|CASTER_QSTORAGE_WRITE_TOKEN|CASTER_CLOUD_DEPLOY_TOKEN|FARCASTER_TOKEN|HYPERSNAP\w*)=\S+/g, "$1=[redacted]")
    .replace(/BEGIN (OPENSSH |)PRIVATE KEY[\s\S]*?END (OPENSSH |)PRIVATE KEY/g, "[redacted-private-key]");
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${JSON.stringify(key)}:${stable(val)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

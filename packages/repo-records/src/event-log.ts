import { createHash } from "node:crypto";
import type { GitCasterEvent } from "../../protocol/dist/types.js";
import type { RepoCreatePayload } from "./repo.js";

function canonicalize(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (typeof value === "object" && value) {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .filter((key) => typeof record[key] !== "undefined")
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
      .join(",")}}`;
  }
  throw new TypeError("Unsupported canonical value");
}

export function eventIdFor(eventPayload: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalize(eventPayload)).digest("hex")}`;
}

export function createRepoCreatedEvent(args: { actor: string; repoId: string; payload: RepoCreatePayload; signature?: string | null; timestamp?: string }): GitCasterEvent {
  const timestamp = args.timestamp || new Date().toISOString();
  const payload = {
    name: args.payload.name,
    description: args.payload.description || "",
    visibility: args.payload.visibility || "public",
    defaultBranch: args.payload.defaultBranch || "main",
  };
  return {
    type: "gitcaster.repo.created.v1",
    id: eventIdFor({ type: "gitcaster.repo.created.v1", actor: args.actor, repo: args.repoId, payload, timestamp }),
    actor: args.actor,
    repo: args.repoId,
    payload,
    timestamp,
    signature: args.signature || null,
    status: "alpha-local",
  };
}

export function appendRepoEvent(events: GitCasterEvent[], event: GitCasterEvent): GitCasterEvent[] {
  return [...events, { ...event, payload: { ...event.payload } }];
}

export function listRepoEvents(events: GitCasterEvent[], repoId: string): GitCasterEvent[] {
  return events.filter((event) => event.repo === repoId).map((event) => ({ ...event, payload: { ...event.payload } }));
}

export function assertAppendOnlyEventLog(previous: GitCasterEvent[], next: GitCasterEvent[]): void {
  if (next.length < previous.length) throw new Error("event log shrank");
  for (let index = 0; index < previous.length; index += 1) {
    if (JSON.stringify(previous[index]) !== JSON.stringify(next[index])) throw new Error("event log mutated existing event");
  }
}

import type { GitCasterStatus } from "../../protocol/dist/types.js";

export const REQUIRED_QSTORAGE_ENV = ["CASTER_QSTORAGE_ENDPOINT", "CASTER_QSTORAGE_WRITE_TOKEN", "CASTER_QSTORAGE_VERIFY_ENDPOINT", "CASTER_QSTORAGE_NAMESPACE"] as const;
export const REQUIRED_CASTER_CLOUD_ENV = ["CASTER_CLOUD_DEPLOY_ENDPOINT", "CASTER_CLOUD_DEPLOY_TOKEN", "CASTER_CLOUD_PROJECT", "CASTER_CLOUD_RELEASE_CHANNEL", "CASTER_DEPLOY_SIGNING_KEY_PATH"] as const;

export interface LocalAlphaProof {
  type: "gitcaster.object.local-alpha.proof.v1";
  status: "alpha-local";
  rootHash: string;
  objectCount: number;
  createdAt: string;
  notice: string;
}

export interface BlockerProof {
  type: "gitcaster.qstorage.blocker.v1" | "gitcaster.castercloud.blocker.v1";
  status: "requires-endpoint" | "blocked";
  verified: false;
  requiredEnv: readonly string[];
  blocker: string;
  createdAt: string;
}

export interface DeploymentManifestPlaceholder {
  type: "gitcaster.castercloud.deployment-manifest.v1";
  status: GitCasterStatus;
  target: "castercloud-quilibrium";
  rootHash: string;
  fileCount: number;
  signed: false;
  signature: null;
  createdAt: string;
  notice: string;
}

export function createLocalAlphaProof(args: { rootHash: string; objectCount: number; createdAt?: string }): LocalAlphaProof {
  return {
    type: "gitcaster.object.local-alpha.proof.v1",
    status: "alpha-local",
    rootHash: args.rootHash,
    objectCount: args.objectCount,
    createdAt: args.createdAt || new Date().toISOString(),
    notice: "Local-alpha proof only. Not QStorage or CasterCloud verification.",
  };
}

export function createQStorageBlockerProof(args: { createdAt?: string; status?: "requires-endpoint" | "blocked"; blocker?: string } = {}): BlockerProof {
  return {
    type: "gitcaster.qstorage.blocker.v1",
    status: args.status || "requires-endpoint",
    verified: false,
    requiredEnv: REQUIRED_QSTORAGE_ENV,
    blocker: args.blocker || "QStorage endpoint or credentials missing.",
    createdAt: args.createdAt || new Date().toISOString(),
  };
}

export function createCasterCloudBlockerProof(args: { createdAt?: string; status?: "requires-endpoint" | "blocked"; blocker?: string } = {}): BlockerProof {
  return {
    type: "gitcaster.castercloud.blocker.v1",
    status: args.status || "requires-endpoint",
    verified: false,
    requiredEnv: REQUIRED_CASTER_CLOUD_ENV,
    blocker: args.blocker || "CasterCloud deployment endpoint or credentials missing.",
    createdAt: args.createdAt || new Date().toISOString(),
  };
}

export function createDeploymentManifestPlaceholder(args: { rootHash: string; fileCount: number; createdAt?: string }): DeploymentManifestPlaceholder {
  return {
    type: "gitcaster.castercloud.deployment-manifest.v1",
    status: "requires-endpoint",
    target: "castercloud-quilibrium",
    rootHash: args.rootHash,
    fileCount: args.fileCount,
    signed: false,
    signature: null,
    createdAt: args.createdAt || new Date().toISOString(),
    notice: "Deployment manifest placeholder only. Not a verified deployment.",
  };
}

export function redactProof(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(/(CASTER_QSTORAGE_WRITE_TOKEN|CASTER_CLOUD_DEPLOY_TOKEN)=\S+/g, "$1=[redacted]")
      .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]");
  }
  if (Array.isArray(value)) return value.map(redactProof);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, /token|secret|authorization/i.test(key) ? "[redacted]" : redactProof(item)]));
  }
  return value;
}

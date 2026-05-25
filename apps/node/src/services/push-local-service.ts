import path from "node:path";
import type { GitCasterEvent, GitCasterObjectManifest, SignedMutationEnvelope } from "../../../../packages/protocol/dist/types.js";
import { createCasterCloudBlockerProof, createLocalAlphaDriver, createQStorageBlockerProof, sha256Object } from "../../../../packages/object-store/dist/index.js";
import { adjudicateRefUpdate, getCurrentHead } from "../../../../packages/ref-consensus/dist/index.js";
import type { GitCasterNodeConfig } from "../config.js";
import type { NodeMutationVerificationResult } from "./mutation-verify.js";
import {
  appendRefCertificateToStore,
  appendRepoEventToStore,
  getLatestObjectManifestForRepo,
  getRefLedger,
  getRepoById,
  recordPushResult,
  storeObjectManifestForRepo,
  storeRepoTreeForRepo,
  type LocalAlphaStore,
} from "./local-alpha-store.js";
import { isDeniedPushPath, scanPathForSecrets, type SecretRiskFinding } from "./secret-scan-lite.js";

export interface PushLocalPayload {
  type: "gitcaster.repo.push-local.payload.v1";
  repo: string;
  rootPath: string;
  branch: string;
  message?: string;
}

export interface PushLocalResult {
  statusCode: number;
  body: unknown;
}

function errorResult(statusCode: number, error: string, reason: string, extra: Record<string, unknown> = {}): PushLocalResult {
  return { statusCode, body: { type: "gitcaster.repo.push-local.error.v1", status: "blocked", error, reason, ...extra } };
}

function normalizePayload(payload: Record<string, unknown>): PushLocalPayload | null {
  if (payload.type !== "gitcaster.repo.push-local.payload.v1") return null;
  if (typeof payload.repo !== "string") return null;
  if (typeof payload.rootPath !== "string") return null;
  if (typeof payload.branch !== "string") return null;
  return {
    type: "gitcaster.repo.push-local.payload.v1",
    repo: payload.repo,
    rootPath: payload.rootPath,
    branch: payload.branch,
    message: typeof payload.message === "string" ? payload.message : undefined,
  };
}

function isLocalhost(host: string): boolean {
  return ["127.0.0.1", "localhost", "::1"].includes(host);
}

function validateLocalPath(rootPath: string, config: GitCasterNodeConfig): string | null {
  const allowLocalPathPush = (config as GitCasterNodeConfig & { allowLocalPathPush?: boolean }).allowLocalPathPush !== false;
  if (config.storageMode !== "local-alpha" || !allowLocalPathPush || !isLocalhost(config.host)) {
    return "Local path push is only available for local alpha nodes. Production uses bundle or git transport.";
  }
  const resolved = path.resolve(rootPath);
  const repoRoot = process.cwd();
  if (isDeniedPushPath(resolved)) return "Path is not allowed for local alpha push.";
  if (resolved === repoRoot || repoRoot.startsWith(resolved + path.sep) || resolved.startsWith(repoRoot + path.sep)) return "Path is not allowed for local alpha push.";
  if (resolved.length < 6) return "Path is not allowed for local alpha push.";
  return null;
}

function branchToRef(branch: string): string | null {
  if (!/^[A-Za-z0-9._/-]+$/.test(branch)) return null;
  if (branch.includes("..") || branch.startsWith("/") || branch.endsWith("/")) return null;
  return `refs/heads/${branch}`;
}

export function safeFileListFromManifest(manifest: GitCasterObjectManifest) {
  return manifest.objects.map((object) => ({ path: object.path, hash: object.hash, size: object.size, mime: object.mime })).sort((a, b) => a.path.localeCompare(b.path));
}

export function pushLocalHeadFromManifest(manifest: GitCasterObjectManifest): string {
  return sha256Object({ type: "gitcaster.push-local.head.v1", rootHash: manifest.rootHash, objects: manifest.objects.map((object) => ({ path: object.path, hash: object.hash, size: object.size })) });
}

export function createCommitPushedEvent(args: { repo: string; actor: string; branch: string; head: string; manifest: GitCasterObjectManifest; message?: string; timestamp?: string; signature?: string | null }): GitCasterEvent {
  return {
    type: "gitcaster.commit.pushed.v1",
    id: `event-commit-${sha256Object({ repo: args.repo, branch: args.branch, head: args.head }).slice("sha256:".length, "sha256:".length + 16)}`,
    actor: args.actor,
    repo: args.repo,
    payload: {
      branch: args.branch,
      head: args.head,
      objectManifestRootHash: args.manifest.rootHash,
      objectCount: args.manifest.objects.length,
      message: args.message || null,
    },
    timestamp: args.timestamp || new Date().toISOString(),
    signature: args.signature || null,
    status: "alpha-local",
  };
}

export function createRefCertificateIssuedEvent(args: { repo: string; actor: string; certificate: unknown; timestamp?: string; signature?: string | null }): GitCasterEvent {
  return {
    type: "gitcaster.ref.certificate.issued.v1",
    id: `event-ref-cert-${sha256Object(args.certificate).slice("sha256:".length, "sha256:".length + 16)}`,
    actor: args.actor,
    repo: args.repo,
    payload: { certificate: args.certificate },
    timestamp: args.timestamp || new Date().toISOString(),
    signature: args.signature || null,
    status: "alpha-local",
  };
}

function secretRiskResponse(findings: SecretRiskFinding[]): PushLocalResult {
  return {
    statusCode: 409,
    body: {
      type: "gitcaster.repo.push-local.error.v1",
      status: "blocked",
      error: "secret_risk",
      findings,
    },
  };
}

export async function handlePushLocal(store: LocalAlphaStore, envelope: SignedMutationEnvelope, verification: NodeMutationVerificationResult, config: GitCasterNodeConfig): Promise<PushLocalResult> {
  if (!verification.ok || verification.scope !== "repo:write") return errorResult(403, "verification_failed", "Signed repo:write mutation verification is required.");
  const payload = normalizePayload(envelope.payload);
  if (!payload) return errorResult(400, "invalid_payload", "Push-local payload type, repo, rootPath, and branch are required.");
  const repo = getRepoById(store, payload.repo);
  if (!repo) return errorResult(404, "repo_not_found", "Repo must exist before push-local.");
  if (repo.owner !== envelope.actor && envelope.capability?.scope !== "repo:write") return errorResult(403, "repo_owner_required", "Actor must own repo or hold repo:write capability.");
  const ref = branchToRef(payload.branch);
  if (!ref) return errorResult(400, "invalid_branch", "Branch must be slug-safe.");
  const deniedReason = validateLocalPath(payload.rootPath, config);
  if (deniedReason) return errorResult(409, "denied_path", deniedReason);
  const secretScan = await scanPathForSecrets(payload.rootPath);
  if (secretScan.status === "blocked") return secretRiskResponse(secretScan.findings);
  const objectDriver = createLocalAlphaDriver({ stateDir: path.join(config.stateDir, "object-store") });
  const objectResult = await objectDriver.writeBundle({
    repo: repo.id,
    commit: envelope.payloadHash,
    rootPath: payload.rootPath,
    signedBy: envelope.actor,
  });
  if (!objectResult.manifest) return errorResult(500, "object_manifest_missing", "Local object manifest was not created.");
  const manifest = objectResult.manifest;
  const head = pushLocalHeadFromManifest(manifest);
  const ledger = getRefLedger(store, repo.id, ref);
  const currentHead = getCurrentHead(ledger, repo.id, ref);
  const actorRecord = store.identities.get(envelope.actor);
  const adjudication = await adjudicateRefUpdate({
    ledger,
    repo: repo.id,
    ref,
    from: currentHead,
    to: head,
    objectCids: [manifest.rootHash],
    actor: envelope.actor,
    node: config.nodeDid,
    timestamp: envelope.timestamp,
    nonce: `push-${envelope.nonce}`,
    capability: envelope.capability,
    actorSignature: envelope.signature,
    nodePrivateKeyPem: store.nodeKeys.privateKeyPem,
    explicitProtectedOverride: envelope.capability?.scope === "repo:write",
  });
  if (!adjudication.ok || !adjudication.certificate) {
    return {
      statusCode: 409,
      body: {
        type: "gitcaster.repo.push-local.error.v1",
        status: "blocked",
        error: "ref_adjudication_failed",
        errors: adjudication.errors,
        conflictEvidence: adjudication.conflictEvidence,
        doubleSignEvidence: adjudication.doubleSignEvidence,
      },
    };
  }
  storeObjectManifestForRepo(store, repo.id, manifest);
  const fileList = safeFileListFromManifest(manifest);
  storeRepoTreeForRepo(store, repo.id, fileList);
  appendRefCertificateToStore(store, repo.id, ref, adjudication.certificate);
  const commitEvent = createCommitPushedEvent({ repo: repo.id, actor: envelope.actor, branch: payload.branch, head, manifest, message: payload.message, timestamp: envelope.timestamp, signature: envelope.signature });
  const refEvent = createRefCertificateIssuedEvent({ repo: repo.id, actor: envelope.actor, certificate: adjudication.certificate, timestamp: envelope.timestamp, signature: envelope.signature });
  appendRepoEventToStore(store, repo.id, commitEvent);
  appendRepoEventToStore(store, repo.id, refEvent);
  const body = {
    type: "gitcaster.repo.push-local.result.v1",
    status: "alpha-local",
    repo: repo.id,
    branch: payload.branch,
    head,
    objectManifest: {
      type: manifest.type,
      rootHash: manifest.rootHash,
      objectCount: manifest.objects.length,
      status: manifest.storage.status,
    },
    refCertificate: {
      type: adjudication.certificate.type,
      ref: adjudication.certificate.ref,
      from: adjudication.certificate.from,
      to: adjudication.certificate.to,
      status: adjudication.certificate.status,
    },
    events: [commitEvent.type, refEvent.type],
    proofs: {
      localAlpha: {
        status: "alpha-local",
        rootHash: manifest.rootHash,
      },
      qstorage: createQStorageBlockerProof({}),
      castercloud: createCasterCloudBlockerProof({}),
    },
    safetyScan: {
      status: secretScan.status,
      findings: secretScan.findings,
      scannedFiles: secretScan.scannedFiles,
      skippedFiles: secretScan.skippedFiles,
    },
    files: fileList,
    notice: "Local alpha push only. No public-network claim is made.",
  };
  recordPushResult(store, repo.id, body);
  return { statusCode: 200, body };
}

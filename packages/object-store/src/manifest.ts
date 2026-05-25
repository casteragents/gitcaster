import type { GitCasterObjectManifest, GitCasterStatus, QStorageObject } from "../../protocol/dist/types.js";
import { createRootHash, sha256Object } from "./checksums.js";

export interface ObjectManifestInput {
  repo: string;
  commit: string;
  objects: QStorageObject[];
  signedBy: string;
  mode?: "local-alpha" | "qstorage" | "castercloud";
  signature?: string | null;
  createdAt?: string;
}

export interface ObjectManifestValidationResult {
  ok: boolean;
  status: GitCasterStatus;
  errors: string[];
}

export function createQStorageObjectRecord(args: { path: string; hash: string; size: number; mime: string; createdAt?: string; status?: GitCasterStatus; cid?: string | null }): QStorageObject {
  return {
    type: "gitcaster.qstorage.object.v1",
    cid: args.cid ?? null,
    hash: args.hash.startsWith("sha256:") ? args.hash : `sha256:${args.hash}`,
    size: args.size,
    mime: args.mime,
    path: args.path.replace(/\\/g, "/"),
    proof: null,
    createdAt: args.createdAt || new Date().toISOString(),
    status: args.status || "alpha-local",
  };
}

export function createObjectManifest(args: ObjectManifestInput): GitCasterObjectManifest {
  const mode = args.mode || "local-alpha";
  const status: GitCasterStatus = mode === "local-alpha" ? "alpha-local" : "requires-endpoint";
  return {
    type: "gitcaster.object.manifest.v1",
    repo: args.repo,
    commit: args.commit,
    objects: [...args.objects].sort((a, b) => a.path.localeCompare(b.path)),
    rootHash: createRootHash(args.objects.map((object) => ({ path: object.path, hash: object.hash, size: object.size }))),
    createdAt: args.createdAt || new Date().toISOString(),
    signedBy: args.signedBy,
    signature: args.signature ?? null,
    storage: {
      mode,
      status,
      cid: null,
      blocker: mode === "local-alpha" ? null : "Endpoint proof is not present in PR-06.",
    },
  };
}

export function validateObjectManifest(manifest: GitCasterObjectManifest): ObjectManifestValidationResult {
  const errors: string[] = [];
  if (manifest.type !== "gitcaster.object.manifest.v1") errors.push("manifest type mismatch");
  if (!manifest.repo.startsWith("gitcaster://did:caster:")) errors.push("repo must use gitcaster protocol and Caster DID");
  if (!manifest.signedBy.startsWith("did:caster:")) errors.push("signedBy must use Caster DID");
  if (!manifest.rootHash.startsWith("sha256:")) errors.push("root hash must be sha256-prefixed");
  for (const object of manifest.objects) {
    if (object.type !== "gitcaster.qstorage.object.v1") errors.push(`object type mismatch for ${object.path}`);
    if (!object.hash.startsWith("sha256:")) errors.push(`object hash is not sha256-prefixed for ${object.path}`);
  }
  const expectedRootHash = createRootHash(manifest.objects.map((object) => ({ path: object.path, hash: object.hash, size: object.size })));
  if (manifest.rootHash !== expectedRootHash) errors.push("root hash mismatch");
  if (manifest.storage.mode === "local-alpha" && manifest.storage.status !== "alpha-local") errors.push("local-alpha manifest must use alpha-local status");
  if ((manifest.storage.mode === "qstorage" || manifest.storage.mode === "castercloud") && manifest.storage.status !== "requires-endpoint") errors.push("endpoint modes require endpoint proof in PR-06");
  return { ok: errors.length === 0, status: errors.length === 0 ? "alpha-local" : "error", errors };
}

export function redactObjectManifest(manifest: GitCasterObjectManifest): GitCasterObjectManifest {
  return {
    ...manifest,
    signature: manifest.signature ? "[redacted-signature]" : null,
    objects: manifest.objects.map((object) => ({ ...object })),
  };
}

export function manifestHash(manifest: GitCasterObjectManifest): string {
  return sha256Object(redactObjectManifest(manifest));
}

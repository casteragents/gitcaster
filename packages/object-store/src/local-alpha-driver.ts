import { copyFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GitCasterObjectManifest } from "../../protocol/dist/types.js";
import { sha256File } from "./checksums.js";
import { createObjectManifest, createQStorageObjectRecord } from "./manifest.js";
import { detectMime, isIgnoredObjectPath } from "./mime.js";
import { createLocalAlphaProof, type LocalAlphaProof } from "./proof.js";
import type { ObjectStoreDriver, ObjectStoreWriteInput, ObjectStoreWriteResult, ObjectStoreVerifyResult } from "./driver.js";

async function walk(rootPath: string, currentPath = rootPath): Promise<string[]> {
  const entries = await readdir(currentPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);
    const rel = path.relative(rootPath, fullPath).replace(/\\/g, "/");
    if (isIgnoredObjectPath(rel)) continue;
    if (entry.isDirectory()) files.push(...(await walk(rootPath, fullPath)));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

export interface LocalAlphaWriteResult extends ObjectStoreWriteResult {
  mode: "local-alpha";
  status: "alpha-local";
  manifest: GitCasterObjectManifest;
  manifestPath: string;
  proof: LocalAlphaProof;
  objectPaths: string[];
}

export function createLocalAlphaDriver(args: { stateDir: string }): ObjectStoreDriver {
  return {
    mode: "local-alpha",
    async writeBundle(input: ObjectStoreWriteInput): Promise<LocalAlphaWriteResult> {
      const stateDir = input.stateDir || args.stateDir;
      const objectsDir = path.join(stateDir, "objects");
      const manifestsDir = path.join(stateDir, "manifests");
      await mkdir(objectsDir, { recursive: true });
      await mkdir(manifestsDir, { recursive: true });
      const files = (await walk(input.rootPath)).sort((a, b) => path.relative(input.rootPath, a).localeCompare(path.relative(input.rootPath, b)));
      const objectPaths: string[] = [];
      const objects = [];
      for (const fullPath of files) {
        const rel = path.relative(input.rootPath, fullPath).replace(/\\/g, "/");
        const hash = await sha256File(fullPath);
        const hex = hash.replace(/^sha256:/, "");
        const outputPath = path.join(objectsDir, hex);
        await copyFile(fullPath, outputPath);
        objectPaths.push(outputPath);
        const info = await stat(fullPath);
        objects.push(createQStorageObjectRecord({ path: rel, hash, size: info.size, mime: detectMime(rel) }));
      }
      const manifest = createObjectManifest({
        repo: input.repo,
        commit: input.commit,
        signedBy: input.signedBy,
        objects,
        mode: "local-alpha",
      });
      const manifestPath = path.join(manifestsDir, `${manifest.rootHash.replace(/^sha256:/, "")}.json`);
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
      return {
        mode: "local-alpha",
        status: "alpha-local",
        manifest,
        manifestPath,
        proof: createLocalAlphaProof({ rootHash: manifest.rootHash, objectCount: objects.length, createdAt: manifest.createdAt }),
        objectPaths,
      };
    },
    async verify(manifest: GitCasterObjectManifest): Promise<ObjectStoreVerifyResult> {
      return { mode: "local-alpha", status: "alpha-local", verified: false, manifest, notice: "Local-alpha verification only. No endpoint proof." };
    },
    async status(): Promise<Record<string, unknown>> {
      return { type: "gitcaster.object-store.status.v1", mode: "local-alpha", status: "alpha-local", verified: false };
    },
  };
}

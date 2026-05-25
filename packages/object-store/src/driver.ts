import type { GitCasterObjectManifest, GitCasterStatus } from "../../protocol/dist/types.js";
import { createCasterCloudDriver } from "./castercloud-driver.js";
import { createLocalAlphaDriver } from "./local-alpha-driver.js";
import { createQStorageDriver } from "./qstorage-driver.js";

export type ObjectStoreMode = "local-alpha" | "qstorage" | "castercloud";

export interface ObjectStoreWriteInput {
  repo: string;
  commit: string;
  rootPath: string;
  signedBy: string;
  stateDir?: string;
}

export interface ObjectStoreWriteResult {
  mode: ObjectStoreMode;
  status: GitCasterStatus;
  verified?: boolean;
  manifest?: GitCasterObjectManifest;
  manifestPath?: string;
  proof?: unknown;
  [key: string]: unknown;
}

export interface ObjectStoreVerifyResult {
  mode: ObjectStoreMode;
  status: GitCasterStatus;
  verified: boolean;
  manifest?: GitCasterObjectManifest;
  proof?: unknown;
  notice?: string;
  [key: string]: unknown;
}

export interface ObjectStoreDriver {
  mode: ObjectStoreMode;
  writeBundle(input: ObjectStoreWriteInput): Promise<ObjectStoreWriteResult>;
  verify(manifest: GitCasterObjectManifest): Promise<ObjectStoreVerifyResult>;
  status(): Promise<Record<string, unknown>>;
}

export function createObjectStoreDriver(args: { mode: ObjectStoreMode; stateDir?: string; env?: NodeJS.ProcessEnv }): ObjectStoreDriver {
  if (args.mode === "local-alpha") {
    if (!args.stateDir) throw new Error("stateDir is required for local-alpha object store");
    return createLocalAlphaDriver({ stateDir: args.stateDir });
  }
  if (args.mode === "qstorage") return createQStorageDriver({ env: args.env });
  return createCasterCloudDriver({ env: args.env });
}

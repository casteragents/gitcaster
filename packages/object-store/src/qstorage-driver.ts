import type { GitCasterObjectManifest } from "../../protocol/dist/types.js";
import { createQStorageBlockerProof, REQUIRED_QSTORAGE_ENV, redactProof } from "./proof.js";
import type { ObjectStoreDriver, ObjectStoreWriteInput, ObjectStoreWriteResult, ObjectStoreVerifyResult } from "./driver.js";

export function qstorageEnvStatus(env: NodeJS.ProcessEnv = process.env): { status: "requires-endpoint" | "blocked"; verified: false; missingEnv: string[]; requiredEnv: readonly string[]; tokenRedacted: true; blocker: string } {
  const missingEnv = REQUIRED_QSTORAGE_ENV.filter((name) => !env[name]);
  return {
    status: missingEnv.length ? "requires-endpoint" : "blocked",
    verified: false,
    missingEnv,
    requiredEnv: REQUIRED_QSTORAGE_ENV,
    tokenRedacted: true,
    blocker: missingEnv.length ? "QStorage endpoint or credentials missing." : "QStorage endpoint integration is deferred until deploy pipeline PR.",
  };
}

export function createQStorageDriver(args: { env?: NodeJS.ProcessEnv } = {}): ObjectStoreDriver {
  const env = args.env || process.env;
  return {
    mode: "qstorage",
    async writeBundle(_input: ObjectStoreWriteInput): Promise<ObjectStoreWriteResult> {
      const status = qstorageEnvStatus(env);
      return redactProof({
        mode: "qstorage",
        status: status.status,
        verified: false,
        proof: createQStorageBlockerProof({ status: status.status, blocker: status.blocker }),
        tokenRedacted: true,
      }) as ObjectStoreWriteResult;
    },
    async verify(manifest: GitCasterObjectManifest): Promise<ObjectStoreVerifyResult> {
      const status = qstorageEnvStatus(env);
      return redactProof({ mode: "qstorage", status: status.status, verified: false, manifest, proof: createQStorageBlockerProof({ status: status.status, blocker: status.blocker }) }) as ObjectStoreVerifyResult;
    },
    async status(): Promise<Record<string, unknown>> {
      return qstorageEnvStatus(env);
    },
  };
}

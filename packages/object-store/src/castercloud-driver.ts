import type { GitCasterObjectManifest } from "../../protocol/dist/types.js";
import { createCasterCloudBlockerProof, createDeploymentManifestPlaceholder, REQUIRED_CASTER_CLOUD_ENV, redactProof } from "./proof.js";
import type { ObjectStoreDriver, ObjectStoreWriteInput, ObjectStoreWriteResult, ObjectStoreVerifyResult } from "./driver.js";

export function casterCloudEnvStatus(env: NodeJS.ProcessEnv = process.env): { status: "requires-endpoint" | "blocked"; verified: false; missingEnv: string[]; requiredEnv: readonly string[]; tokenRedacted: true; blocker: string } {
  const missingEnv = REQUIRED_CASTER_CLOUD_ENV.filter((name) => !env[name]);
  return {
    status: missingEnv.length ? "requires-endpoint" : "blocked",
    verified: false,
    missingEnv,
    requiredEnv: REQUIRED_CASTER_CLOUD_ENV,
    tokenRedacted: true,
    blocker: missingEnv.length ? "CasterCloud deployment endpoint or credentials missing." : "CasterCloud endpoint integration is deferred until deploy pipeline PR.",
  };
}

export function createCasterCloudDriver(args: { env?: NodeJS.ProcessEnv } = {}): ObjectStoreDriver {
  const env = args.env || process.env;
  return {
    mode: "castercloud",
    async writeBundle(input: ObjectStoreWriteInput): Promise<ObjectStoreWriteResult> {
      const status = casterCloudEnvStatus(env);
      return redactProof({
        mode: "castercloud",
        status: status.status,
        verified: false,
        proof: createCasterCloudBlockerProof({ status: status.status, blocker: status.blocker }),
        deploymentManifest: createDeploymentManifestPlaceholder({ rootHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000", fileCount: 0 }),
        tokenRedacted: true,
        requestedRepo: input.repo,
      }) as ObjectStoreWriteResult;
    },
    async verify(manifest: GitCasterObjectManifest): Promise<ObjectStoreVerifyResult> {
      const status = casterCloudEnvStatus(env);
      return redactProof({
        mode: "castercloud",
        status: status.status,
        verified: false,
        manifest,
        proof: createCasterCloudBlockerProof({ status: status.status, blocker: status.blocker }),
        deploymentManifest: createDeploymentManifestPlaceholder({ rootHash: manifest.rootHash, fileCount: manifest.objects.length }),
      }) as ObjectStoreVerifyResult;
    },
    async status(): Promise<Record<string, unknown>> {
      return casterCloudEnvStatus(env);
    },
  };
}

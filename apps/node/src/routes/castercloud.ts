import type { RouteRegistry } from "../services/route-registry.js";
import { casterCloudEnvStatus, createCasterCloudBlockerProof, createDeploymentManifestPlaceholder } from "../../../../packages/object-store/dist/index.js";

function casterCloudRouteStatus() {
  const status = casterCloudEnvStatus(process.env);
  return {
    type: "gitcaster.castercloud.status.v1",
    status: status.status,
    verified: false,
    requiredEnv: status.requiredEnv,
    missingEnv: status.missingEnv,
    tokenRedacted: true,
    blocker: status.blocker,
    notice: "CasterCloud endpoint integration is deferred until deploy pipeline PR.",
  };
}

export function registerCasterCloudRoutes(registry: RouteRegistry): void {
  registry.add("GET", "/castercloud/status", () => ({ statusCode: 200, body: casterCloudRouteStatus() }));
  registry.add("POST", "/castercloud/deploy", () => {
    const status = casterCloudEnvStatus(process.env);
    return {
      statusCode: 409,
      body: {
        ...createCasterCloudBlockerProof({ status: status.status, blocker: status.blocker }),
        deploymentManifest: createDeploymentManifestPlaceholder({ rootHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000", fileCount: 0 }),
      },
    };
  });
  registry.add("POST", "/castercloud/verify", () => {
    const status = casterCloudEnvStatus(process.env);
    return { statusCode: 409, body: createCasterCloudBlockerProof({ status: status.status, blocker: status.blocker }) };
  });
}

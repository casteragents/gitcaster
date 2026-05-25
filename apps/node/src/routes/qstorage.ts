import type { RouteRegistry } from "../services/route-registry.js";
import { createQStorageBlockerProof, qstorageEnvStatus } from "../../../../packages/object-store/dist/index.js";

function qstorageRouteStatus() {
  const status = qstorageEnvStatus(process.env);
  return {
    type: "gitcaster.qstorage.status.v1",
    status: status.status,
    mode: "local-alpha",
    verified: false,
    requiredEnv: status.requiredEnv,
    missingEnv: status.missingEnv,
    tokenRedacted: true,
    blocker: status.blocker,
    notice: "QStorage endpoint integration is deferred until deploy pipeline PR.",
  };
}

export function registerQStorageRoutes(registry: RouteRegistry): void {
  registry.add("GET", "/qstorage/status", () => ({ statusCode: 200, body: qstorageRouteStatus() }));
  registry.add("POST", "/qstorage/publish", () => {
    const status = qstorageEnvStatus(process.env);
    return { statusCode: 409, body: createQStorageBlockerProof({ status: status.status, blocker: status.blocker }) };
  });
  registry.add("POST", "/qstorage/verify", () => {
    const status = qstorageEnvStatus(process.env);
    return { statusCode: 409, body: createQStorageBlockerProof({ status: status.status, blocker: status.blocker }) };
  });
}

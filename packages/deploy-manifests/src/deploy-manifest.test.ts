import {
  REQUIRED_BLOCKED_CAPABILITIES,
  RETIRED_NATIVE_RUNTIME_DEPENDENCIES,
  createLocalDeployManifest,
  redactDeployManifest,
  validateDeployManifest
} from "./deploy-manifest.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const manifest = createLocalDeployManifest({
  id: "deploy-manifest-gitcaster-studio-local",
  appId: "gitcaster-studio",
  name: "GitCaster Studio",
  layer: "app",
  sourcePath: "apps/web"
});

const validation = validateDeployManifest(manifest);
assert(validation.status === "passed", "local dry-run manifest should pass");
assert(validation.localDryRunAccepted === true, "local dry-run should be accepted");
assert(validation.productionReadiness === "blocked_external", "production readiness must remain blocked");
assert(validation.requiredRuntimeDependencies.length === 0, "retired runtime dependencies must not be required");
assert(manifest.blockedCapabilities.length === REQUIRED_BLOCKED_CAPABILITIES.length, "all capability blockers should be present");
assert(manifest.dependencies.length === RETIRED_NATIVE_RUNTIME_DEPENDENCIES.length, "all dependency retirement markers should be present");

const unsafeProductionClaim = JSON.parse(JSON.stringify(manifest)) as {
  claims: { productionReady: boolean };
};
unsafeProductionClaim.claims.productionReady = true;
assert(validateDeployManifest(unsafeProductionClaim).status === "failed", "production claim should fail");

const unsafeRuntimeDependency = JSON.parse(JSON.stringify(manifest)) as {
  dependencies: Array<{ id: string; requiredRuntime: boolean }>;
};
const retiredDependency = unsafeRuntimeDependency.dependencies.find((dependency) => dependency.id === "vercel");
if (!retiredDependency) throw new Error("retired dependency should exist");
retiredDependency.requiredRuntime = true;
assert(validateDeployManifest(unsafeRuntimeDependency).status === "failed", "retired required runtime dependency should fail");

const unsafePublicTarget = JSON.parse(JSON.stringify(manifest)) as {
  target: { previewUrl: string };
};
unsafePublicTarget.target.previewUrl = "https://example.com";
assert(validateDeployManifest(unsafePublicTarget).status === "failed", "public target should fail without ingress proof");

const unsafeSecret = {
  ...manifest,
  operatorToken: "operator-token-placeholder"
};
assert(validateDeployManifest(unsafeSecret).status === "failed", "secret-like fields should fail");
const redacted = redactDeployManifest(unsafeSecret);
assert(JSON.stringify(redacted).includes("[redacted]"), "redaction should hide secret-like fields");

console.log(JSON.stringify({ status: "passed", package: "@gitcaster/deploy-manifests", manifest: manifest.id }));

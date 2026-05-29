import { buildCasterClaimMiniappReleaseBundle, casterClaimMiniappTemplate } from "./index.js";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(casterClaimMiniappTemplate.status === "public-alpha", "miniapp template shell should be public-alpha");
assert(casterClaimMiniappTemplate.runtimeApiStatus === "blocked_external", "runtime API must remain blocked");
assert(casterClaimMiniappTemplate.qstorageStatus === "blocked_external", "storage publish must remain blocked");
assert(casterClaimMiniappTemplate.castercloudStatus === "blocked_external", "native deploy must remain blocked");
assert(casterClaimMiniappTemplate.requiredAssets.length >= 4, "template should document public asset requirements");
assert(casterClaimMiniappTemplate.requiredVendorFiles.every((file) => file.startsWith("vendor/")), "vendor files must be local fixtures");

const bundle = buildCasterClaimMiniappReleaseBundle();
assert(bundle.format === "gitcaster.miniapp-template-release.v1", "release bundle format should be stable");
assert(bundle.status === "public-alpha", "release bundle should be public-alpha");
assert(bundle.safety.noSecretsRequired, "release bundle should not require secrets");
assert(bundle.safety.noNetworkCalls, "release bundle should not make network calls");
assert(bundle.safety.noManagedRuntimeClaim, "release bundle should avoid managed runtime claims");
assert(bundle.safety.legacyHostIsReferenceOnly, "legacy host path must stay reference-only");
assert(bundle.blockedRuntimeClaims.length >= 3, "release bundle should keep runtime blockers visible");

console.log(JSON.stringify({ status: "passed", package: "@gitcaster/playground-templates", template: casterClaimMiniappTemplate.id }));

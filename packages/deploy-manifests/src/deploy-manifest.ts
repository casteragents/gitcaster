import type {
  BlockedCapabilityId,
  DeployLayer,
  DeployManifestValidation,
  GitCasterDeployManifest,
  ManagedDependencyId
} from "./types.js";

export const REQUIRED_BLOCKED_CAPABILITIES: BlockedCapabilityId[] = [
  "managed-runtime",
  "native-storage",
  "native-domain",
  "custody",
  "billing",
  "rollback",
  "production-readiness"
];

export const RETIRED_NATIVE_RUNTIME_DEPENDENCIES: ManagedDependencyId[] = [
  "vercel",
  "cloudflare",
  "supabase",
  "redis",
  "r2",
  "qconsole"
];

const secretKeyPattern = /(secret|token|password|private.?key|mnemonic|seed|bearer|api.?key|access.?key|wallet|github)/i;
const secretValuePattern =
  /(BEGIN (OPENSSH )?PRIVATE KEY|Authorization:\s*Bearer\s+\S+|ghp_[A-Za-z0-9_]+|sk-[A-Za-z0-9_-]+|mnemonic|seed phrase)/i;

export function createLocalDeployManifest(input: {
  id: string;
  appId: string;
  name: string;
  layer: DeployLayer;
  sourcePath: string;
  previewUrl?: string;
}): GitCasterDeployManifest {
  return {
    type: "gitcaster.deploy-manifest.v1",
    id: input.id,
    appId: input.appId,
    name: input.name,
    layer: input.layer,
    createdAt: "2026-05-30T00:00:00.000Z",
    source: {
      kind: "local-fixture",
      path: input.sourcePath,
      repository: "https://github.com/casteragents/gitcaster"
    },
    target: {
      mode: "local-dry-run",
      previewUrl: input.previewUrl ?? "http://127.0.0.1:3000",
      publicHost: null,
      nativeDomain: null,
      storageTarget: null,
      managedRuntime: null
    },
    checks: [
      {
        id: "static-export-build",
        command: "pnpm run build:web",
        expectedStatus: "passed",
        scope: "local"
      },
      {
        id: "public-secret-scan",
        command: "pnpm run secret-scan",
        expectedStatus: "passed",
        scope: "local"
      },
      {
        id: "native-runtime-proof",
        command: "operator proof required before promotion",
        expectedStatus: "blocked_external",
        scope: "proof-gate"
      }
    ],
    dependencies: RETIRED_NATIVE_RUNTIME_DEPENDENCIES.map((id) => ({
      id,
      requiredRuntime: false,
      retirementStatus: "not-required-for-native-path"
    })),
    blockedCapabilities: REQUIRED_BLOCKED_CAPABILITIES.map((id) => ({
      id,
      status: "blocked_external",
      requiredProof: requiredProofForCapability(id)
    })),
    claims: {
      localDryRunOnly: true,
      managedRuntimeAvailable: false,
      nativeStoragePublished: false,
      nativeDomainMapped: false,
      custodyProvisioned: false,
      billingEnabled: false,
      rollbackVerified: false,
      productionReady: false
    }
  };
}

export function validateDeployManifest(input: unknown): DeployManifestValidation {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const manifest = input as Partial<GitCasterDeployManifest>;

  if (!isRecord(input)) {
    return failure(["manifest must be an object"]);
  }

  if (manifest.type !== "gitcaster.deploy-manifest.v1") blockers.push("manifest type must be gitcaster.deploy-manifest.v1");
  if (!isNonEmptyString(manifest.id)) blockers.push("manifest id is required");
  if (!isNonEmptyString(manifest.appId)) blockers.push("appId is required");
  if (!isNonEmptyString(manifest.name)) blockers.push("name is required");
  if (!["app", "miniapp", "developer-tool", "website"].includes(String(manifest.layer))) blockers.push("layer is invalid");
  if (manifest.source?.kind !== "local-fixture") blockers.push("source.kind must be local-fixture");
  if (manifest.source?.repository !== "https://github.com/casteragents/gitcaster") blockers.push("source.repository must be the public GitCaster repo");
  if (manifest.target?.mode !== "local-dry-run") blockers.push("target.mode must be local-dry-run");
  if (!isLocalPreviewUrl(manifest.target?.previewUrl)) blockers.push("target.previewUrl must be a local preview URL");
  if (manifest.target?.publicHost !== null) blockers.push("target.publicHost must stay null until public ingress proof exists");
  if (manifest.target?.nativeDomain !== null) blockers.push("target.nativeDomain must stay null until native domain proof exists");
  if (manifest.target?.storageTarget !== null) blockers.push("target.storageTarget must stay null until native storage proof exists");
  if (manifest.target?.managedRuntime !== null) blockers.push("target.managedRuntime must stay null until managed runtime proof exists");

  const missingCapabilities = REQUIRED_BLOCKED_CAPABILITIES.filter(
    (id) => !manifest.blockedCapabilities?.some((capability) => capability.id === id && capability.status === "blocked_external")
  );
  if (missingCapabilities.length > 0) blockers.push(`missing blocked capability gates: ${missingCapabilities.join(", ")}`);

  const requiredRuntimeDependencies = (manifest.dependencies ?? [])
    .filter((dependency) => Boolean((dependency as { requiredRuntime?: unknown }).requiredRuntime))
    .map((dependency) => dependency.id)
    .filter((id): id is ManagedDependencyId => RETIRED_NATIVE_RUNTIME_DEPENDENCIES.includes(id as ManagedDependencyId));
  if (requiredRuntimeDependencies.length > 0) {
    blockers.push(`native path must not require retired runtime dependencies: ${requiredRuntimeDependencies.join(", ")}`);
  }

  for (const dependencyId of RETIRED_NATIVE_RUNTIME_DEPENDENCIES) {
    const dependency = manifest.dependencies?.find((item) => item.id === dependencyId);
    if (!dependency) blockers.push(`missing dependency retirement marker: ${dependencyId}`);
    if (dependency && dependency.requiredRuntime !== false) blockers.push(`${dependencyId} requiredRuntime must be false`);
  }

  const claims = manifest.claims;
  if (!claims || claims.localDryRunOnly !== true) blockers.push("claims.localDryRunOnly must be true");
  for (const [key, value] of Object.entries(claims ?? {})) {
    if (key !== "localDryRunOnly" && value !== false) blockers.push(`claim ${key} must remain false without proof`);
  }

  const secretFindings = findSecretLikeFields(input);
  if (secretFindings.length > 0) blockers.push(`secret-like manifest fields found: ${secretFindings.join(", ")}`);

  const localDryRunAccepted = blockers.length === 0;
  if (!localDryRunAccepted) warnings.push("manifest was rejected before any runtime action");

  return {
    status: blockers.length === 0 ? "passed" : "failed",
    manifestId: isNonEmptyString(manifest.id) ? manifest.id : undefined,
    appId: isNonEmptyString(manifest.appId) ? manifest.appId : undefined,
    blockers,
    warnings,
    productionReadiness: "blocked_external",
    localDryRunAccepted,
    managedRuntimeRequired: false,
    requiredRuntimeDependencies
  };
}

export function redactDeployManifest<T>(input: T): T {
  return redactValue(input) as T;
}

function requiredProofForCapability(id: BlockedCapabilityId): string {
  const proofs: Record<BlockedCapabilityId, string> = {
    "managed-runtime": "signed managed runtime deploy receipt, smoke proof, and rollback proof",
    "native-storage": "native storage publish receipt, public read proof, and rollback proof",
    "native-domain": "native domain registry receipt and browser smoke proof",
    custody: "QKMS or signer custody reference with redacted receipt",
    billing: "subscription contract, billing policy, and abuse-control proof",
    rollback: "bounded rollback path and post-rollback smoke proof",
    "production-readiness": "release candidate, security audit, node health, storage, deploy, domain, and rollback evidence"
  };
  return proofs[id];
}

function failure(blockers: string[]): DeployManifestValidation {
  return {
    status: "failed",
    blockers,
    warnings: ["manifest was rejected before any runtime action"],
    productionReadiness: "blocked_external",
    localDryRunAccepted: false,
    managedRuntimeRequired: false,
    requiredRuntimeDependencies: []
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isLocalPreviewUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/.*)?$/i.test(value);
}

function findSecretLikeFields(value: unknown, path = "manifest"): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findSecretLikeFields(item, `${path}[${index}]`));
  }
  if (!isRecord(value)) {
    return typeof value === "string" && secretValuePattern.test(value) ? [path] : [];
  }
  return Object.entries(value).flatMap(([key, child]) => {
    const childPath = `${path}.${key}`;
    if (secretKeyPattern.test(key) && child !== null && child !== undefined && child !== "[redacted]") return [childPath];
    return findSecretLikeFields(child, childPath);
  });
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => redactValue(item));
  if (!isRecord(value)) return typeof value === "string" && secretValuePattern.test(value) ? "[redacted]" : value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      secretKeyPattern.test(key) && child !== null && child !== undefined ? "[redacted]" : redactValue(child)
    ])
  );
}

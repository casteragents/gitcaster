export type GitCasterDeployManifestType = "gitcaster.deploy-manifest.v1";

export type DeployLayer = "app" | "miniapp" | "developer-tool" | "website";

export type DeployMode = "local-dry-run";

export type ManifestStatus = "passed" | "blocked_external" | "failed";

export type BlockedCapabilityId =
  | "managed-runtime"
  | "native-storage"
  | "native-domain"
  | "custody"
  | "billing"
  | "rollback"
  | "production-readiness";

export type ManagedDependencyId =
  | "vercel"
  | "cloudflare"
  | "supabase"
  | "redis"
  | "r2"
  | "qconsole";

export type DeployManifestSource = {
  kind: "local-fixture";
  path: string;
  repository: "https://github.com/casteragents/gitcaster";
};

export type DeployManifestTarget = {
  mode: DeployMode;
  previewUrl: string;
  publicHost: null;
  nativeDomain: null;
  storageTarget: null;
  managedRuntime: null;
};

export type DeployManifestCheck = {
  id: string;
  command: string;
  expectedStatus: ManifestStatus;
  scope: "local" | "proof-gate";
};

export type DeployManifestDependency = {
  id: ManagedDependencyId;
  requiredRuntime: false;
  retirementStatus: "not-required-for-native-path";
};

export type DeployManifestBlockedCapability = {
  id: BlockedCapabilityId;
  status: "blocked_external";
  requiredProof: string;
};

export type DeployManifestClaims = {
  localDryRunOnly: true;
  managedRuntimeAvailable: false;
  nativeStoragePublished: false;
  nativeDomainMapped: false;
  custodyProvisioned: false;
  billingEnabled: false;
  rollbackVerified: false;
  productionReady: false;
};

export type GitCasterDeployManifest = {
  type: GitCasterDeployManifestType;
  id: string;
  appId: string;
  name: string;
  layer: DeployLayer;
  createdAt: string;
  source: DeployManifestSource;
  target: DeployManifestTarget;
  checks: DeployManifestCheck[];
  dependencies: DeployManifestDependency[];
  blockedCapabilities: DeployManifestBlockedCapability[];
  claims: DeployManifestClaims;
};

export type DeployManifestValidation = {
  status: ManifestStatus;
  manifestId?: string;
  appId?: string;
  blockers: string[];
  warnings: string[];
  productionReadiness: "blocked_external";
  localDryRunAccepted: boolean;
  managedRuntimeRequired: false;
  requiredRuntimeDependencies: ManagedDependencyId[];
};


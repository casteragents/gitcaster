import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  REQUIRED_BLOCKED_CAPABILITIES,
  RETIRED_NATIVE_RUNTIME_DEPENDENCIES,
  redactDeployManifest,
  validateDeployManifest,
  type GitCasterDeployManifest
} from "@gitcaster/deploy-manifests";

export const DEPLOY_COMMAND_HELP = [
  "gc deploy plan --manifest examples/deploy/local-deploy-manifest.example.json --out launch/evidence/deploy-plan-local-dry-run.json",
  "Reads a gitcaster.deploy-manifest.v1 local dry-run manifest.",
  "Writes redacted local deploy-plan evidence and refuses managed runtime, native storage, native domain, custody, billing, rollback, and production claims.",
  "This public-alpha command does not deploy, publish, bill, sign custody material, or touch external infrastructure."
].join("\n");

export interface BuildDeployPlanArgs {
  manifest: GitCasterDeployManifest;
  generatedAt?: string;
  evidencePath?: string;
}

export interface DeployPlanCliArgs {
  manifestPath: string;
  outPath: string;
}

export function buildDeployPlanEvidence(args: BuildDeployPlanArgs) {
  const validation = validateDeployManifest(args.manifest);
  const redactedManifest = redactDeployManifest(args.manifest);
  return {
    type: "gitcaster.deploy-plan.local-dry-run.v1" as const,
    generatedAt: args.generatedAt || "2026-05-30T00:00:00.000Z",
    status: validation.status === "passed" ? "public-alpha" : "failed",
    manifestId: validation.manifestId || args.manifest.id,
    appId: validation.appId || args.manifest.appId,
    evidencePath: args.evidencePath,
    localDryRunOnly: true,
    validation,
    redactedManifest,
    blockedCapabilities: REQUIRED_BLOCKED_CAPABILITIES.map((id) => ({
      id,
      status: "blocked_external" as const
    })),
    retiredRuntimeDependencies: RETIRED_NATIVE_RUNTIME_DEPENDENCIES.map((id) => ({
      id,
      requiredRuntime: false as const
    })),
    claims: {
      managedRuntimeAvailable: false,
      nativeStoragePublished: false,
      nativeDomainMapped: false,
      custodyProvisioned: false,
      billingEnabled: false,
      rollbackVerified: false,
      productionReady: false
    },
    nextProofRequired: [
      "managed runtime deploy receipt and rollback proof",
      "native storage publish/read proof",
      "native domain registry and browser smoke proof",
      "custody signer reference with redacted receipt",
      "billing policy and abuse-control proof",
      "release candidate, audit, node health, and production acceptance evidence"
    ]
  };
}

export function parseDeployPlanArgs(argv: string[]): DeployPlanCliArgs {
  const manifestPath = valueAfter(argv, "--manifest");
  const outPath = valueAfter(argv, "--out") || "launch/evidence/deploy-plan-local-dry-run.json";
  if (!manifestPath) throw new Error("--manifest is required");
  return { manifestPath, outPath };
}

export function runDeployPlanCommand(argv: string[]): string {
  const args = parseDeployPlanArgs(argv);
  const manifest = JSON.parse(readFileSync(args.manifestPath, "utf8")) as GitCasterDeployManifest;
  const evidence = buildDeployPlanEvidence({
    manifest,
    generatedAt: new Date().toISOString(),
    evidencePath: args.outPath
  });
  mkdirSync(dirname(args.outPath), { recursive: true });
  writeFileSync(args.outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return printDeployPlanResult(evidence);
}

export function printDeployPlanResult(result: ReturnType<typeof buildDeployPlanEvidence>): string {
  return [
    `status: ${result.status}`,
    `manifest: ${result.manifestId}`,
    `app: ${result.appId}`,
    `evidence: ${result.evidencePath || "not-written"}`,
    `productionReady: ${result.claims.productionReady}`,
    `blockedCapabilities: ${result.blockedCapabilities.map((capability) => capability.id).join(", ")}`
  ].join("\n");
}

function valueAfter(argv: string[], flag: string): string | undefined {
  const idx = argv.indexOf(flag);
  if (idx < 0) return undefined;
  const value = argv[idx + 1];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
  return value;
}


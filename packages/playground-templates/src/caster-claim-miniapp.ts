export type GitCasterMiniappImportStatus =
  | "alpha-local"
  | "public-alpha"
  | "blocked_external"
  | "legacy-reference";

export type GitCasterMiniappReleaseBundle = {
  format: "gitcaster.miniapp-template-release.v1";
  templateId: string;
  status: "public-alpha";
  publicArtifacts: string[];
  blockedRuntimeClaims: string[];
  safety: {
    noSecretsRequired: true;
    noNetworkCalls: true;
    noManagedRuntimeClaim: true;
    legacyHostIsReferenceOnly: true;
  };
};

export type GitCasterMiniappTemplate = {
  type: "gitcaster.playground-template.v1";
  id: string;
  name: string;
  sourcePath: string;
  category: "Miniapps";
  status: GitCasterMiniappImportStatus;
  staticEntry: string;
  metadataPath: string;
  requiredAssets: string[];
  requiredVendorFiles: string[];
  publicArtifacts: string[];
  runtimeApiStatus: "blocked_external";
  qstorageStatus: "blocked_external";
  castercloudStatus: "blocked_external";
  legacyHostedPlatforms: Array<{
    platform: "vercel";
    path: string;
    status: "legacy-reference";
  }>;
  evidence: string[];
  blockers: string[];
};

export const casterClaimMiniappTemplate: GitCasterMiniappTemplate = {
  type: "gitcaster.playground-template.v1",
  id: "caster-claim-miniapp",
  name: "Caster Claim Miniapp",
  sourcePath: "caster-claim-miniapp",
  category: "Miniapps",
  status: "public-alpha",
  staticEntry: "caster-claim-miniapp/index.html",
  metadataPath: "caster-claim-miniapp/.well-known/farcaster.json",
  requiredAssets: [
    "assets/hero.png",
    "assets/icon-1024.png",
    "assets/icon.png",
    "assets/share.png",
    "assets/splash-200.png",
    "assets/splash.png"
  ],
  requiredVendorFiles: [
    "vendor/farcaster-miniapp-sdk-0.3.0.esm.js",
    "vendor/farcaster-miniapp-sdk-0.3.0.min.js"
  ],
  publicArtifacts: [
    "packages/playground-templates/src/caster-claim-miniapp.ts",
    "examples/miniapps/caster-claim-miniapp.local-shell.json",
    "apps/web/app/open-source/miniapp-templates/page.tsx",
    "docs-source/developer-layers/miniapp-templates.md"
  ],
  runtimeApiStatus: "blocked_external",
  qstorageStatus: "blocked_external",
  castercloudStatus: "blocked_external",
  legacyHostedPlatforms: [
    {
      platform: "vercel",
      path: "caster-claim-miniapp/vercel.json",
      status: "legacy-reference"
    }
  ],
  evidence: [
    "launch/evidence/pr-14-claim-miniapp-import.json"
  ],
  blockers: [
    "Runtime API calls require a CasterRPC/QStorage-backed endpoint before production use.",
    "QStorage and CasterCloud publish proof is not part of PR-14.",
    "Farcaster account association uses legacy source metadata until domain proof is replaced."
  ]
};

export function buildCasterClaimMiniappReleaseBundle(
  template: GitCasterMiniappTemplate = casterClaimMiniappTemplate
): GitCasterMiniappReleaseBundle {
  return {
    format: "gitcaster.miniapp-template-release.v1",
    templateId: template.id,
    status: "public-alpha",
    publicArtifacts: template.publicArtifacts,
    blockedRuntimeClaims: [
      "runtime API production endpoint",
      "QStorage publish proof",
      "native domain deployment proof",
      "managed account custody"
    ],
    safety: {
      noSecretsRequired: true,
      noNetworkCalls: true,
      noManagedRuntimeClaim: true,
      legacyHostIsReferenceOnly: true
    }
  };
}

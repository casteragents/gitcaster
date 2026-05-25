export type GitCasterMiniappImportStatus =
  | "alpha-local"
  | "blocked_external"
  | "legacy-reference";

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
  status: "alpha-local",
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

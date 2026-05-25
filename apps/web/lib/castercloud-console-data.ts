export type ConsoleStatus = "ready" | "gated" | "blocked" | "planned";

export type ConsoleService = {
  id: string;
  name: string;
  qConsoleSurface: string;
  status: ConsoleStatus;
  endpoint: string;
  description: string;
  owns: string[];
  blockers: string[];
};

export type ConsoleDeployment = {
  app: string;
  target: string;
  status: ConsoleStatus;
  evidence: string;
};

export type ConsoleQueueItem = {
  app: string;
  manifest: string;
  status: ConsoleStatus;
  publicTarget: string;
};

export type ConsoleJournalItem = {
  app: string;
  request: string;
  status: ConsoleStatus;
  wallet: string;
};

export type ConsoleApprovalItem = {
  app: string;
  approval: string;
  status: ConsoleStatus;
  strict: string;
};

export type AppDeployWorkbenchItem = {
  id: string;
  name: string;
  kind: string;
  status: ConsoleStatus;
  target: string;
  requestHash: string;
  nextAction: string;
};

export type AppDeployWorkbenchSummary = {
  apps: number;
  miniapps: number;
  deployableDryRun: number;
  evidenceGated: number;
  blockedExternal: number;
  planned: number;
};

export type PublicTargetWalletReadinessItem = {
  id: string;
  label: string;
  status: ConsoleStatus;
  evidence: string;
  nextAction: string;
};

export type ConsoleServiceAction = {
  id: string;
  label: string;
  method: "POST" | "PUT";
  endpoint: string;
  resource: string;
  body: Record<string, string | string[] | boolean>;
};

export type QConsoleServiceAlias = {
  qconsole: string;
  castercloud: string;
  method: "GET" | "POST" | "PUT";
  alias: string;
  canonical: string;
  status: ConsoleStatus;
  liveMutation: boolean;
};

export const consoleServices: ConsoleService[] = [
  {
    id: "cstorage",
    name: "CStorage",
    qConsoleSurface: "QStorage",
    status: "ready",
    endpoint: "/v1/storage",
    description: "Object, static-site, manifest, checksum, and public snapshot control for CasterCloud buckets.",
    owns: ["site shells", "media manifests", "snapshot bundles", "proof artifacts"],
    blockers: ["live write switch evidence before R2 retirement"],
  },
  {
    id: "ckeys",
    name: "CKeys",
    qConsoleSurface: "QKMS",
    status: "blocked",
    endpoint: "/v1/keys",
    description: "Wallet-policy key custody, service key receipts, sidecar registration evidence, and signer audit trails.",
    owns: ["service key registry", "operator policies", "signed custody receipts"],
    blockers: ["real key custody receipt", "MetaVM/QCL lock receipt"],
  },
  {
    id: "cidentity",
    name: "CIdentity",
    qConsoleSurface: "Identity and Authorization",
    status: "gated",
    endpoint: "/v1/iam",
    description: "Wallet login, RBAC policies, operator roles, and application deployment permissions.",
    owns: ["wallet sessions", "operator roles", "deployment approvals"],
    blockers: ["release captain signoff", "audit approval evidence"],
  },
  {
    id: "ccredentials",
    name: "CCredentials",
    qConsoleSurface: "Service Credentials",
    status: "gated",
    endpoint: "/v1/credentials",
    description: "Self-owned service credential receipts for CasterCloud endpoints, issued through wallet policy instead of hosted console keys.",
    owns: ["access-key receipts", "scope hashes", "issuer policy", "redacted credential audit log"],
    blockers: ["operator wallet evidence", "credential issuer public key", "completion sentinel"],
  },
  {
    id: "cqueue",
    name: "CQueue",
    qConsoleSurface: "QQ",
    status: "gated",
    endpoint: "/v1/queues",
    description: "Event-log backed queues, outbox drains, worker timers, dead-letter manifests, and replay cursors.",
    owns: ["outbox queue", "worker soak", "dead-letter records"],
    blockers: ["Redis retirement evidence", "live worker queue receipt"],
  },
  {
    id: "cping",
    name: "CPing",
    qConsoleSurface: "QPing",
    status: "blocked",
    endpoint: "/v1/topics",
    description: "Notification topics, subscriptions, delivery proof, and Farcaster/mobile notification receipts.",
    owns: ["notification topics", "delivery receipts", "subscriber policies"],
    blockers: ["notification delivery proof from a notification-enabled FID"],
  },
  {
    id: "hypersnap",
    name: "HyperSnap",
    qConsoleSurface: "Hypersnap",
    status: "blocked",
    endpoint: "/v1/hypersnap",
    description: "Channel invites, reply-cast validation, membership reconciliation, and channel proof packs.",
    owns: ["invite queues", "reply casts", "membership reconciliation"],
    blockers: ["live reply-cast evidence", "membership reconciliation evidence"],
  },
  {
    id: "quark",
    name: "CQuark",
    qConsoleSurface: "Quark",
    status: "planned",
    endpoint: "/v1/quark",
    description: "3D asset registry, object-backed asset metadata, ownership receipts, and app integration manifests.",
    owns: ["3D assets", "ownership receipts", "download manifests"],
    blockers: ["asset ownership contract policy"],
  },
  {
    id: "deployments",
    name: "Deployments",
    qConsoleSurface: "Docs and app deploy",
    status: "gated",
    endpoint: "/v1/deployments",
    description: "Wallet-gated app and mini app deployment queue for CasterCloud targets.",
    owns: ["GitCaster", "casterchain.online", "CasterAgents", "Caster Studio"],
    blockers: ["production live proof", "burn-in windows"],
  },
  {
    id: "billing",
    name: "Usage Ledger",
    qConsoleSurface: "Billing",
    status: "planned",
    endpoint: "/v1/usage",
    description: "Self-owned usage metering, credit ledger, and operator billing exports without hosted QConsole billing.",
    owns: ["usage events", "credit ledger", "billing exports"],
    blockers: ["pricing policy", "payment custody policy"],
  },
];

export const deployments: ConsoleDeployment[] = [
  {
    app: "casterchain.online",
    target: "QStorage shell + CasterRPC gateway",
    status: "gated",
    evidence: "acceptance matrix and burn-in",
  },
  {
    app: "GitCaster",
    target: "CStorage static site + CasterCloud console",
    status: "ready",
    evidence: "local static export and proof envelope",
  },
  {
    app: "CasterAgents",
    target: "CasterCloud worker facade",
    status: "blocked",
    evidence: "mobile screenshots and notification proof",
  },
  {
    app: "Caster Studio",
    target: "CasterCloud app builder facade",
    status: "blocked",
    evidence: "Farcaster preview proof",
  },
  {
    app: "HyperSnap channels",
    target: "HyperSnap invite service",
    status: "blocked",
    evidence: "reply-cast and reconciliation proof",
  },
  {
    app: "CasterExchange",
    target: "existing CStorage mirror",
    status: "ready",
    evidence: "custom domain and static bucket",
  },
  {
    app: "CasterPad",
    target: "CStorage + CQueue publish queue",
    status: "planned",
    evidence: "deployment manifest needed",
  },
  {
    app: "CasterPunks",
    target: "CStorage + CQuark assets",
    status: "planned",
    evidence: "asset registry needed",
  },
];

export const deploymentQueue: ConsoleQueueItem[] = [
  {
    app: "GitCaster",
    manifest: "manifests/gitcaster.json",
    status: "ready",
    publicTarget: "https://cloud.casterchain.online/console/",
  },
  {
    app: "CasterCloud Console",
    manifest: "manifests/castercloud-console.json",
    status: "gated",
    publicTarget: "https://cloud.casterchain.online/console/",
  },
  {
    app: "casterchain.online",
    manifest: "manifests/casterchain-online.json",
    status: "gated",
    publicTarget: "https://casterchain.online",
  },
  {
    app: "CasterAgents",
    manifest: "manifests/casteragents.json",
    status: "blocked",
    publicTarget: "https://cloud.casterchain.online/miniapps/casteragents",
  },
  {
    app: "Caster Studio",
    manifest: "manifests/caster-studio.json",
    status: "blocked",
    publicTarget: "https://cloud.casterchain.online/miniapps/creator",
  },
];

export const deploymentJournal: ConsoleJournalItem[] = [
  {
    app: "GitCaster",
    request: "POST /v1/deployments",
    status: "ready",
    wallet: "EIP-191 dry-run proof",
  },
];

export const deploymentApprovals: ConsoleApprovalItem[] = [
  {
    app: "GitCaster",
    approval: "operator wallet signature",
    status: "blocked",
    strict: "waits for real signature + zero completion blockers",
  },
];

export const appDeployWorkbenchSummary: AppDeployWorkbenchSummary = {
  apps: 12,
  miniapps: 8,
  deployableDryRun: 2,
  evidenceGated: 2,
  blockedExternal: 3,
  planned: 5,
};

export const appDeployWorkbench: AppDeployWorkbenchItem[] = [
  {
    id: "gitcaster",
    name: "GitCaster",
    kind: "static-site",
    status: "ready",
    target: "https://cloud.casterchain.online/console/",
    requestHash: "signable request hash",
    nextAction: "Connect wallet, sign the request hash, and queue dry-run deploy receipt.",
  },
  {
    id: "castercloud-console",
    name: "CasterCloud Console",
    kind: "console-service",
    status: "gated",
    target: "https://cloud.casterchain.online/console/",
    requestHash: "signable request hash",
    nextAction: "Fill public console/API endpoint evidence before live deploy.",
  },
  {
    id: "casterchain-online",
    name: "casterchain.online",
    kind: "static-site",
    status: "gated",
    target: "https://casterchain.online",
    requestHash: "signable request hash",
    nextAction: "Wait for acceptance, rollback, and burn-in before final cutover.",
  },
  {
    id: "casteragents",
    name: "CasterAgents",
    kind: "worker-agent",
    status: "blocked",
    target: "https://cloud.casterchain.online/miniapps/casteragents",
    requestHash: "signable request hash",
    nextAction: "Import Farcaster mobile screenshots and notification proof.",
  },
  {
    id: "caster-studio",
    name: "Caster Studio",
    kind: "miniapp",
    status: "blocked",
    target: "https://cloud.casterchain.online/miniapps/creator",
    requestHash: "signable request hash",
    nextAction: "Collect live route and Farcaster card evidence.",
  },
  {
    id: "hypersnap-channels",
    name: "HyperSnap Channels",
    kind: "channel-service",
    status: "blocked",
    target: "https://cloud.casterchain.online/hypersnap",
    requestHash: "signable request hash",
    nextAction: "Import live reply-cast and membership reconciliation evidence.",
  },
  {
    id: "casterpad",
    name: "CasterPad",
    kind: "miniapp",
    status: "planned",
    target: "https://cloud.casterchain.online/casterpad",
    requestHash: "manifest pending",
    nextAction: "Generate deployment manifest and CQueue evidence.",
  },
  {
    id: "casterpunks",
    name: "CasterPunks",
    kind: "miniapp",
    status: "planned",
    target: "https://cloud.casterchain.online/casterpunks",
    requestHash: "manifest pending",
    nextAction: "Generate CQuark asset registry evidence.",
  },
];

export const publicTargetWalletReadiness: PublicTargetWalletReadinessItem[] = [
  {
    id: "gitcaster-line-read",
    label: "GitCaster line-read evidence",
    status: "ready",
    evidence: ".quilibrium/gitcaster-line-read/gitcaster-line-read-report.json",
    nextAction: "Run npm run gitcaster:line-read:verify before claiming the goal text was covered.",
  },
  {
    id: "public-console-urls",
    label: "Public console and API URLs",
    status: "gated",
    evidence: ".quilibrium/castercloud-public-console-endpoints/public-console-endpoints-report.json",
    nextAction: "Set CASTERCLOUD public console/API URL env in ignored operator files, then rerun readiness.",
  },
  {
    id: "public-target-hashes",
    label: "Redacted DNS target hashes",
    status: "gated",
    evidence: ".quilibrium/castercloud-public-endpoint-target-materializer/public-endpoint-target-materializer-report.json",
    nextAction: "Materialize host-only DNS targets and keep raw values out of public artifacts.",
  },
  {
    id: "target-wallet-confirmation",
    label: "Wallet target confirmation",
    status: "blocked",
    evidence: ".quilibrium/castercloud-public-endpoint-target-confirmation/target-confirmation-report.json",
    nextAction: "Sign the endpoint target hash confirmation with the release operator wallet.",
  },
  {
    id: "operator-wallet-allowlist",
    label: "Operator wallet allowlist",
    status: "blocked",
    evidence: ".quilibrium/castercloud-operator-wallet-allowlist/operator-wallet-allowlist-report.json",
    nextAction: "Connect the release wallet in /console and import the signed allowlist evidence.",
  },
  {
    id: "app-workbench",
    label: "App and miniapp deploy workbench",
    status: "gated",
    evidence: ".quilibrium/castercloud-console-app-deploy-workbench/deploy-workbench-report.json",
    nextAction: "Keep app deploys dry-run until public target, wallet, completion, and burn-in gates pass.",
  },
];

export const consoleServiceActions: ConsoleServiceAction[] = [
  {
    id: "create-cstorage-bucket",
    label: "Create CStorage bucket",
    method: "POST",
    endpoint: "/v1/storage/buckets",
    resource: "storage.bucket",
    body: {
      bucket: "castercloud-preview",
      purpose: "owned static assets and snapshots",
      dryRun: true,
    },
  },
  {
    id: "register-ckey-policy",
    label: "Register CKeys policy",
    method: "POST",
    endpoint: "/v1/keys",
    resource: "keys.policy",
    body: {
      keyPolicyId: "castercloud-release-policy",
      purpose: "operator custody receipt",
      dryRun: true,
    },
  },
  {
    id: "create-cidentity-user",
    label: "Create CIdentity user",
    method: "POST",
    endpoint: "/v1/iam/users",
    resource: "iam.user",
    body: {
      userId: "wallet-release-operator",
      role: "operator",
      dryRun: true,
    },
  },
  {
    id: "issue-ccredential-access-key",
    label: "Issue CCredential key",
    method: "POST",
    endpoint: "/v1/iam/access-keys",
    resource: "iam.access-key",
    body: {
      credentialKind: "miniapp-deployer",
      targetApp: "gitcaster",
      scope: "deployments:queue:dry-run",
      dryRun: true,
    },
  },
  {
    id: "create-cqueue",
    label: "Create CQueue",
    method: "POST",
    endpoint: "/v1/queues",
    resource: "queue",
    body: {
      queue: "castercloud-deployments",
      purpose: "deployment and outbox receipts",
      dryRun: true,
    },
  },
  {
    id: "create-cping-topic",
    label: "Create CPing topic",
    method: "POST",
    endpoint: "/v1/topics",
    resource: "topic",
    body: {
      topic: "castercloud-notifications",
      purpose: "notification delivery receipts",
      dryRun: true,
    },
  },
  {
    id: "create-hypersnap-invite",
    label: "Create HyperSnap invite",
    method: "POST",
    endpoint: "/v1/hypersnap/invites",
    resource: "hypersnap.invite",
    body: {
      channel: "caster",
      purpose: "reply-cast evidence lane",
      dryRun: true,
    },
  },
  {
    id: "register-cquark-asset",
    label: "Register CQuark asset",
    method: "POST",
    endpoint: "/v1/quark/assets",
    resource: "quark.asset",
    body: {
      assetId: "castercloud-demo-asset",
      purpose: "object-backed asset receipt",
      dryRun: true,
    },
  },
  {
    id: "queue-gitcaster-deploy",
    label: "Queue GitCaster deploy",
    method: "POST",
    endpoint: "/v1/deployments",
    resource: "deployment",
    body: {
      app: "gitcaster",
      target: "castercloud-console",
      dryRun: true,
    },
  },
  {
    id: "submit-owned-provisioning-request",
    label: "Submit provisioning request",
    method: "POST",
    endpoint: "/v1/provisioning/requests",
    resource: "provisioning.request",
    body: {
      requestId: "gitcaster-castercloud-redeploy",
      actions: ["provision-cstorage-bucket", "provision-cqueue", "provision-gitcaster-deployment"],
      dryRun: true,
    },
  },
  {
    id: "create-all-owned-services",
    label: "Create all owned services",
    method: "POST",
    endpoint: "/v1/provisioning/requests",
    resource: "provisioning.request.bulk",
    body: {
      requestId: "castercloud-create-all-owned-services",
      actions: [
        "provision-cstorage-bucket",
        "provision-cstorage-object",
        "provision-ckeys-policy",
        "provision-ckeys-sidecar",
        "provision-cidentity-user",
        "provision-cidentity-policy",
        "provision-ccredential-key",
        "provision-cqueue",
        "provision-cping-topic",
        "provision-hypersnap-invite",
        "provision-cquark-asset",
        "provision-gitcaster-deployment",
        "provision-casterchain-deployment",
        "provision-miniapp-deployment",
        "provision-castercloud-provisioning-request",
      ],
      dryRun: true,
    },
  },
];

export const qconsoleServiceAliases: QConsoleServiceAlias[] = [
  {
    qconsole: "QConsole services",
    castercloud: "CasterCloud service catalog",
    method: "GET",
    alias: "/v1/qconsole/services",
    canonical: "/v1/services",
    status: "ready",
    liveMutation: false,
  },
  {
    qconsole: "QConsole provider contract",
    castercloud: "CasterCloud self-owned provider contract",
    method: "GET",
    alias: "/v1/qconsole/provider",
    canonical: "/v1/provider/castercloud",
    status: "ready",
    liveMutation: false,
  },
  {
    qconsole: "QConsole self-owned stack status",
    castercloud: "CasterCloud self-owned stack status",
    method: "GET",
    alias: "/v1/qconsole/self-owned-stack",
    canonical: "/v1/castercloud/self-owned-stack",
    status: "ready",
    liveMutation: false,
  },
  {
    qconsole: "QConsole service docs",
    castercloud: "CasterCloud owned service API reference",
    method: "GET",
    alias: "/v1/qconsole/docs/services",
    canonical: "/v1/docs/castercloud/services",
    status: "ready",
    liveMutation: false,
  },
  {
    qconsole: "QConsole public endpoints",
    castercloud: "CasterCloud public endpoint binder",
    method: "GET",
    alias: "/v1/qconsole/public-endpoints",
    canonical: "/v1/public-endpoints/binder",
    status: "ready",
    liveMutation: false,
  },
  {
    qconsole: "QConsole public endpoint env",
    castercloud: "CasterCloud public endpoint env intake",
    method: "GET",
    alias: "/v1/qconsole/public-endpoint-env",
    canonical: "/v1/public-endpoints/env-intake",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole public endpoint targets",
    castercloud: "CasterCloud public endpoint target materializer",
    method: "GET",
    alias: "/v1/qconsole/public-endpoint-targets",
    canonical: "/v1/public-endpoints/target-candidates",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole public endpoint confirmation",
    castercloud: "CasterCloud public endpoint target confirmation",
    method: "GET",
    alias: "/v1/qconsole/public-endpoint-confirmation",
    canonical: "/v1/public-endpoints/target-confirmation",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole public endpoint signing handoff",
    castercloud: "CasterCloud public endpoint target signing handoff",
    method: "GET",
    alias: "/v1/qconsole/public-endpoint-signing-handoff",
    canonical: "/v1/public-endpoints/target-signing-handoff",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole public endpoint confirmation message",
    castercloud: "CasterCloud target confirmation wallet message",
    method: "GET",
    alias: "/v1/qconsole/public-endpoint-confirmation/message",
    canonical: "/v1/public-endpoints/target-confirmation/message",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole public endpoint confirmation import",
    castercloud: "CasterCloud target confirmation signature import",
    method: "POST",
    alias: "/v1/qconsole/public-endpoint-confirmation/import",
    canonical: "/v1/public-endpoints/target-confirmation/import",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole deployment workbench",
    castercloud: "CasterCloud app deploy workbench",
    method: "GET",
    alias: "/v1/qconsole/deployments/workbench",
    canonical: "/v1/deployments/workbench",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole public target wallet readiness",
    castercloud: "CasterCloud public target and wallet readiness",
    method: "GET",
    alias: "/v1/qconsole/public-target-wallet-readiness",
    canonical: "/v1/public-target-wallet-readiness",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole public endpoint publish readiness",
    castercloud: "CasterCloud public endpoint publish readiness",
    method: "GET",
    alias: "/v1/qconsole/public-endpoint-publish-readiness",
    canonical: "/v1/public-endpoints/publish-readiness",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole public console env",
    castercloud: "CasterCloud public console env workbench",
    method: "GET",
    alias: "/v1/qconsole/public-console-env",
    canonical: "/v1/console/public-console-env",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole public console env import",
    castercloud: "CasterCloud public console env import",
    method: "POST",
    alias: "/v1/qconsole/public-console-env/import",
    canonical: "/v1/console/public-console-env/import",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole operator evidence workbench",
    castercloud: "CasterCloud operator evidence workbench",
    method: "GET",
    alias: "/v1/qconsole/operator-evidence-workbench",
    canonical: "/v1/console/operator-evidence-workbench",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole operator evidence bundle",
    castercloud: "CasterCloud operator evidence bundle",
    method: "GET",
    alias: "/v1/qconsole/operator-evidence-bundle",
    canonical: "/v1/console/operator-evidence-bundle",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole operator evidence bundle import",
    castercloud: "CasterCloud operator evidence bundle import",
    method: "POST",
    alias: "/v1/qconsole/operator-evidence-bundle/import",
    canonical: "/v1/console/operator-evidence-bundle/import",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole owned console readiness",
    castercloud: "CasterCloud owned console replacement readiness",
    method: "GET",
    alias: "/v1/qconsole/owned-console-readiness",
    canonical: "/v1/console/owned-readiness",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole current blocker",
    castercloud: "CasterCloud current blocker",
    method: "GET",
    alias: "/v1/qconsole/current-blocker",
    canonical: "/v1/console/current-blocker",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole next exact prompt",
    castercloud: "CasterCloud next exact prompt",
    method: "GET",
    alias: "/v1/qconsole/next-exact-prompt",
    canonical: "/v1/console/next-exact-prompt",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole final evidence requirements",
    castercloud: "CasterCloud final evidence requirements",
    method: "GET",
    alias: "/v1/qconsole/final-evidence/requirements",
    canonical: "/v1/console/final-evidence/requirements",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole service creation matrix",
    castercloud: "CasterCloud owned service creation matrix",
    method: "GET",
    alias: "/v1/qconsole/service-creation-matrix",
    canonical: "/v1/console/service-creation-matrix",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QConsole node bindings",
    castercloud: "CasterCloud node binding matrix",
    method: "GET",
    alias: "/v1/qconsole/node-bindings",
    canonical: "/v1/console/node-bindings",
    status: "gated",
    liveMutation: false,
  },
  {
    qconsole: "QStorage buckets",
    castercloud: "CStorage buckets",
    method: "GET",
    alias: "/v1/qstorage/buckets",
    canonical: "/v1/storage/buckets",
    status: "ready",
    liveMutation: false,
  },
  {
    qconsole: "QStorage writes",
    castercloud: "CStorage write receipts",
    method: "PUT",
    alias: "/v1/qstorage/buckets/{bucket}/objects/{key}",
    canonical: "/v1/storage/buckets/{bucket}/objects/{key}",
    status: "gated",
    liveMutation: true,
  },
  {
    qconsole: "QKMS keys",
    castercloud: "CKeys custody resources",
    method: "GET",
    alias: "/v1/qkms/keys",
    canonical: "/v1/keys",
    status: "ready",
    liveMutation: false,
  },
  {
    qconsole: "QKMS sidecars",
    castercloud: "CKeys sidecar receipts",
    method: "GET",
    alias: "/v1/qkms/sidecars",
    canonical: "/v1/keys/sidecars",
    status: "ready",
    liveMutation: false,
  },
  {
    qconsole: "QConsole credentials",
    castercloud: "CCredentials issuer",
    method: "GET",
    alias: "/v1/qconsole/credentials",
    canonical: "/v1/credentials/issuer",
    status: "ready",
    liveMutation: false,
  },
  {
    qconsole: "QConsole CreateAccessKey",
    castercloud: "CCredentials access-key receipt",
    method: "POST",
    alias: "/v1/qconsole/credentials",
    canonical: "/v1/iam/access-keys",
    status: "gated",
    liveMutation: true,
  },
  {
    qconsole: "QConsole provisioning",
    castercloud: "CasterCloud owned service provisioning",
    method: "GET",
    alias: "/v1/qconsole/provisioning",
    canonical: "/v1/provisioning/actions",
    status: "ready",
    liveMutation: false,
  },
  {
    qconsole: "QConsole CreateProvisioningRequest",
    castercloud: "CasterCloud owned service provisioning receipt",
    method: "POST",
    alias: "/v1/provisioning/requests",
    canonical: "/v1/provisioning/requests",
    status: "gated",
    liveMutation: true,
  },
  {
    qconsole: "QQ queues",
    castercloud: "CQueue event-log queues",
    method: "GET",
    alias: "/v1/qq/queues",
    canonical: "/v1/queues",
    status: "ready",
    liveMutation: false,
  },
  {
    qconsole: "QPing topics",
    castercloud: "CPing notification topics",
    method: "GET",
    alias: "/v1/qping/topics",
    canonical: "/v1/topics",
    status: "ready",
    liveMutation: false,
  },
  {
    qconsole: "Billing and usage",
    castercloud: "Usage Ledger",
    method: "GET",
    alias: "/v1/qconsole/billing",
    canonical: "/v1/billing",
    status: "planned",
    liveMutation: false,
  },
];

export const consoleEndpoints = [
  ["GET", "/v1/services", "Return CasterCloud service catalog and runtime statuses."],
  ["GET", "/v1/qconsole/services", "Return owned QConsole-style aliases mapped to CasterCloud canonical routes."],
  ["GET", "/v1/qconsole/services/{id}", "Return one owned QConsole-style alias mapping by service id."],
  ["GET", "/v1/docs/castercloud/services", "Return the owned CasterCloud service API reference."],
  ["GET", "/v1/docs/castercloud/services/{id}", "Return one owned CasterCloud service API reference entry."],
  ["GET", "/v1/qconsole/docs/services", "Return the QConsole-compatible service API reference alias."],
  ["GET", "/v1/service-actions", "Return wallet-gated service action templates for the owned console."],
  ["GET", "/v1/apps", "Return the CasterCloud app and mini app deployment registry."],
  ["GET", "/v1/deployments/catalog", "Return deployment targets, blockers, and evidence requirements."],
  ["GET", "/v1/deployments/workbench", "Return the owned app and miniapp deploy workbench with wallet next actions."],
  ["GET", "/v1/qconsole/deployments/workbench", "Return the app deploy workbench through the QConsole-compatible alias."],
  ["GET", "/v1/public-target-wallet-readiness", "Return public endpoint, DNS target, operator wallet, and workbench readiness."],
  ["GET", "/v1/qconsole/public-target-wallet-readiness", "Return public target and wallet readiness through the QConsole-compatible alias."],
  ["GET", "/v1/public-endpoints/publish-readiness", "Return the public endpoint publish-readiness chain, current blocker, and next exact prompt."],
  ["GET", "/v1/qconsole/public-endpoint-publish-readiness", "Return public endpoint publish readiness through the QConsole-compatible alias."],
  ["GET", "/v1/console/public-console-env", "Return the public console/API endpoint env workbench with redacted URL status."],
  ["POST", "/v1/console/public-console-env/import", "Validate and optionally write ignored local public console/API endpoint env."],
  ["GET", "/v1/qconsole/public-console-env", "Return the public console env workbench through the QConsole-compatible alias."],
  ["POST", "/v1/qconsole/public-console-env/import", "Validate public console env through the QConsole-compatible alias."],
  ["GET", "/v1/console/operator-evidence-workbench", "Return the target-confirmation and operator-allowlist wallet evidence workbench."],
  ["GET", "/v1/qconsole/operator-evidence-workbench", "Return the operator evidence workbench through the QConsole-compatible alias."],
  ["GET", "/v1/console/operator-evidence-bundle", "Return the combined operator evidence bundle importer status."],
  ["POST", "/v1/console/operator-evidence-bundle/import", "Verify and optionally write both target-confirmation and allowlist local evidence inputs."],
  ["GET", "/v1/qconsole/operator-evidence-bundle", "Return the operator evidence bundle through the QConsole-compatible alias."],
  ["POST", "/v1/qconsole/operator-evidence-bundle/import", "Verify the operator evidence bundle through the QConsole-compatible alias."],
  ["GET", "/v1/console/owned-readiness", "Return aggregate owned CasterCloud console readiness for replacing QConsole."],
  ["GET", "/v1/qconsole/owned-console-readiness", "Return owned console readiness through the QConsole-compatible alias."],
  ["GET", "/v1/console/current-blocker", "Return the current blocker and external evidence list for the owned console migration."],
  ["GET", "/v1/qconsole/current-blocker", "Return the current blocker through the QConsole-compatible alias."],
  ["GET", "/v1/console/next-exact-prompt", "Return the exact next local/operator action prompt for the owned console migration."],
  ["GET", "/v1/qconsole/next-exact-prompt", "Return the next exact prompt through the QConsole-compatible alias."],
  ["GET", "/v1/console/final-evidence/requirements", "Return final external evidence requirements and missing proof paths without printing file contents."],
  ["GET", "/v1/qconsole/final-evidence/requirements", "Return final evidence requirements through the QConsole-compatible alias."],
  ["GET", "/v1/console/service-creation-matrix", "Return every owned service creation flow and the bulk dry-run request."],
  ["GET", "/v1/qconsole/service-creation-matrix", "Return the service creation matrix through the QConsole-compatible alias."],
  ["GET", "/v1/console/node-bindings", "Return how owned CasterCloud services bind to AWS and laptop node evidence."],
  ["GET", "/v1/qconsole/node-bindings", "Return the node binding matrix through the QConsole-compatible alias."],
  ["GET", "/v1/deployments/readiness", "Return public deployment readiness without exposing secret values."],
  ["GET", "/v1/deployments/public-console-handoff", "Return the wallet-approved public console deploy packet."],
  ["GET", "/v1/public-endpoints/binder", "Return the public CasterCloud endpoint binder and DNS safety contract."],
  ["GET", "/v1/qconsole/public-endpoints", "Return the QConsole-compatible public endpoint binder alias."],
  ["GET", "/v1/public-endpoints/env-intake", "Return redacted public endpoint env intake status."],
  ["GET", "/v1/qconsole/public-endpoint-env", "Return redacted public endpoint env intake through the QConsole alias."],
  ["GET", "/v1/public-endpoints/target-candidates", "Return redacted public endpoint target candidates."],
  ["GET", "/v1/qconsole/public-endpoint-targets", "Return redacted public endpoint targets through the QConsole alias."],
  ["GET", "/v1/public-endpoints/target-confirmation", "Return redacted public endpoint target confirmation receipt."],
  ["GET", "/v1/qconsole/public-endpoint-confirmation", "Return redacted endpoint target confirmation through the QConsole alias."],
  ["GET", "/v1/public-endpoints/target-signing-handoff", "Return the redacted wallet signing handoff for public endpoint target confirmation."],
  ["GET", "/v1/qconsole/public-endpoint-signing-handoff", "Return the endpoint signing handoff through the QConsole alias."],
  ["GET", "/v1/public-endpoints/target-confirmation/message", "Return the exact wallet-signable public endpoint target confirmation message."],
  ["POST", "/v1/public-endpoints/target-confirmation/import", "Verify and optionally write local target confirmation evidence."],
  ["GET", "/v1/qconsole/public-endpoint-confirmation/message", "Return the endpoint target confirmation message through the QConsole alias."],
  ["POST", "/v1/qconsole/public-endpoint-confirmation/import", "Verify endpoint target confirmation through the QConsole alias."],
  ["GET", "/v1/deployments/manifests", "Return wallet-signable app and mini app deployment manifests."],
  ["GET", "/v1/deployments/manifests/{id}", "Return one wallet-signable deployment manifest by app id."],
  ["GET", "/v1/deployments/queue", "Return the guarded public deploy queue."],
  ["GET", "/v1/deployments/queue/{id}", "Return one guarded public deploy queue item."],
  ["GET", "/v1/deployments/journal", "Return wallet-shaped dry-run deployment journal entries."],
  ["GET", "/v1/deployments/journal/{id}", "Return one dry-run deployment journal entry."],
  ["GET", "/v1/deployments/approvals", "Return operator wallet deployment approvals."],
  ["GET", "/v1/deployments/approvals/{id}", "Return one operator deployment approval by app id."],
  ["GET", "/v1/deployments/approvals/{id}/message", "Return the exact wallet-signable operator approval message."],
  ["POST", "/v1/deployments/approvals/{id}/import", "Verify and optionally write local operator approval evidence."],
  ["GET", "/v1/deployments/approvals/gitcaster/completion", "Return GitCaster operator approval completion and strict blockers."],
  ["GET", "/v1/iam/operators/allowlist", "Return signed operator wallet allowlist evidence."],
  ["GET", "/v1/iam/operators/allowlist/message", "Return the exact wallet-signable allowlist bootstrap message."],
  ["POST", "/v1/iam/operators/allowlist/import", "Verify and optionally write local allowlist evidence."],
  ["GET", "/v1/control-plane", "Return the self-owned CasterCloud resource catalog."],
  ["GET", "/v1/castercloud/self-owned-stack", "Return the aggregate self-owned CasterCloud replacement status."],
  ["GET", "/v1/qconsole/self-owned-stack", "Return the aggregate replacement status through the QConsole-compatible alias."],
  ["GET", "/v1/provider/castercloud", "Return the self-owned CasterCloud provider contract."],
  ["GET", "/v1/qconsole/provider", "Return the QConsole-compatible provider contract alias."],
  ["GET", "/v1/credentials/issuer", "Return the self-owned CasterCloud credential issuer contract."],
  ["GET", "/v1/qconsole/credentials", "Return the QConsole-style credential issuer alias."],
  ["POST", "/v1/qconsole/credentials", "Queue a wallet-gated CCredential issuance receipt through the QConsole alias."],
  ["GET", "/v1/provisioning/actions", "Return wallet-gated owned service provisioning actions."],
  ["GET", "/v1/qconsole/provisioning", "Return owned service provisioning actions through the QConsole alias."],
  ["POST", "/v1/provisioning/requests", "Queue a wallet-gated owned service provisioning receipt."],
  ["POST", "/v1/wallet/session", "Create a wallet-signed console session."],
  ["GET", "/v1/evidence", "List proof artifacts and missing production blockers."],
  ["GET", "/v1/storage/buckets", "List CStorage buckets owned by the local control plane."],
  ["GET", "/v1/qstorage/buckets", "List CStorage buckets through the QStorage-compatible alias."],
  ["POST", "/v1/qstorage/buckets", "Queue a wallet-gated CStorage bucket receipt through the QStorage alias."],
  ["PUT", "/v1/qstorage/buckets/{bucket}/objects/{key}", "Queue a wallet-gated CStorage object write receipt through the QStorage alias."],
  ["GET", "/v1/iam/users", "List CasterCloud wallet and operator users."],
  ["POST", "/v1/iam/users", "Create a CIdentity user under wallet policy."],
  ["GET", "/v1/iam/roles", "List CasterCloud roles."],
  ["POST", "/v1/iam/roles", "Create a CasterCloud role under wallet policy."],
  ["GET", "/v1/iam/policies", "List CasterCloud policies."],
  ["POST", "/v1/iam/policies", "Create a CasterCloud policy receipt."],
  ["GET", "/v1/iam/access-keys", "List redacted self-owned access-key receipts."],
  ["POST", "/v1/iam/access-keys", "Queue a wallet-gated access-key issuance receipt."],
  ["POST", "/v1/storage/buckets", "Create a CStorage bucket when wallet policy allows it."],
  ["GET", "/v1/keys", "List CKeys custody resources."],
  ["GET", "/v1/qkms/keys", "List CKeys custody resources through the QKMS-compatible alias."],
  ["POST", "/v1/qkms/keys", "Queue a wallet-gated CKeys policy receipt through the QKMS alias."],
  ["POST", "/v1/keys", "Register service key custody evidence; no private key leaves the operator."],
  ["GET", "/v1/keys/sidecars", "List CKeys sidecar resources."],
  ["GET", "/v1/qkms/sidecars", "List CKeys sidecars through the QKMS-compatible alias."],
  ["POST", "/v1/qkms/sidecars", "Queue a wallet-gated sidecar receipt through the QKMS alias."],
  ["POST", "/v1/keys/sidecars", "Register sidecar metadata and custody receipt."],
  ["GET", "/v1/queues", "List CQueue event-log queues."],
  ["GET", "/v1/qq/queues", "List CQueue event-log queues through the QQ-compatible alias."],
  ["POST", "/v1/qq/queues", "Queue a wallet-gated CQueue receipt through the QQ alias."],
  ["POST", "/v1/queues", "Create an event-log backed queue and worker binding."],
  ["GET", "/v1/topics", "List CPing notification topics."],
  ["GET", "/v1/qping/topics", "List CPing topics through the QPing-compatible alias."],
  ["POST", "/v1/qping/topics", "Queue a wallet-gated CPing topic receipt through the QPing alias."],
  ["POST", "/v1/topics", "Create a notification topic with delivery evidence requirements."],
  ["GET", "/v1/hypersnap/channels", "List HyperSnap channel resources and evidence blockers."],
  ["GET", "/v1/qconsole/hypersnap/channels", "List HyperSnap channels through the owned QConsole alias."],
  ["GET", "/v1/quark/assets", "List CQuark asset libraries."],
  ["GET", "/v1/qconsole/quark/assets", "List CQuark assets through the owned QConsole alias."],
  ["POST", "/v1/quark/assets", "Register a CQuark asset receipt."],
  ["GET", "/v1/usage", "Read self-owned usage ledger summary."],
  ["GET", "/v1/qconsole/usage", "Read self-owned usage through the owned QConsole alias."],
  ["GET", "/v1/billing", "Read billing ledger and payment custody status."],
  ["GET", "/v1/qconsole/billing", "Read billing ledger through the owned QConsole alias."],
  ["POST", "/v1/deployments", "Queue a wallet-approved app or mini app deployment."],
  ["GET", "/v1/docs/openapi.json", "Serve the CasterCloud API contract."],
  ["GET", "/v1/docs/castercloud", "Serve the CasterCloud docs bundle and safety contract."],
];

export function statusClass(status: ConsoleStatus) {
  if (status === "ready") return "good";
  if (status === "gated") return "warn";
  if (status === "blocked") return "danger";
  return "neutral";
}

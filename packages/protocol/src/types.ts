import type { GitCasterEventName } from "./events.js";
import type { GitCasterStatus } from "./status.js";

export type { GitCasterStatus };

export interface CasterDID {
  id: string;
  method: "caster";
  publicKey: string;
  createdAt: string;
  kind?: "human" | "agent" | "node";
  capabilities?: string[];
  trustScore?: number;
  status?: GitCasterStatus;
}

export interface CasterIdentity {
  did: CasterDID;
  displayName?: string;
  kind: "human" | "agent" | "node";
  publicKeys: string[];
  profile?: Record<string, unknown>;
  signedAt?: string;
  status: GitCasterStatus;
}

export type CasterCapabilityScope =
  | "identity:read"
  | "identity:sign"
  | "node:read"
  | "node:register"
  | "repo:read"
  | "repo:create"
  | "repo:write"
  | "repo:admin"
  | "ref:read"
  | "ref:update"
  | "object:read"
  | "object:write"
  | "issue:read"
  | "issue:write"
  | "pr:read"
  | "pr:write"
  | "pr:merge"
  | "agent:read"
  | "agent:delegate"
  | "agent:run"
  | "ecosystem:read"
  | "ecosystem:submit"
  | "miniapp:import"
  | "deploy:prepare"
  | "deploy:qstorage"
  | "deploy:castercloud"
  | "domain:request"
  | "domain:map"
  | "token:reward-proof"
  | "security:audit"
  | "mcp:serve";

export interface CasterCapability {
  type: "gitcaster.capability.v1";
  issuer: string;
  subject: string;
  scope: CasterCapabilityScope;
  resource: string;
  expiresAt: string;
  nonce: string;
  signature: string;
  status: GitCasterStatus;
}

export interface SignedMutationEnvelope {
  type: "gitcaster.signed-mutation.v1";
  actor: string;
  capability?: CasterCapability;
  payload: Record<string, unknown>;
  payloadHash: string;
  previousHash?: string | null;
  timestamp: string;
  nonce: string;
  signature: string;
  status: GitCasterStatus;
}

export interface GitCasterRepo {
  type: "gitcaster.repo.v1";
  id: string;
  did: string;
  name: string;
  description?: string;
  owner: string;
  visibility: "public" | "private" | "unlisted";
  defaultBranch: string;
  refs: GitCasterRef[];
  agents: string[];
  deployments: CasterCloudDeployment[];
  tokenHooks: CasterTokenReward[];
  createdAt: string;
  updatedAt: string;
  status: GitCasterStatus;
}

export interface GitCasterRef {
  type: "gitcaster.ref.v1";
  repo: string;
  name: string;
  head: string | null;
  cid?: string | null;
  certificate?: RefUpdateCertificate | null;
  updatedAt: string;
  status: GitCasterStatus;
}

export interface RefUpdateCertificate {
  type: "gitcaster.ref.update.v1";
  repo: string;
  ref: string;
  from: string | null;
  to: string;
  objectCids: string[];
  actor: string;
  node: string;
  timestamp: string;
  nonce: string;
  capability?: CasterCapability;
  payloadHash: string;
  signatures: SignatureRecord[];
  status: GitCasterStatus;
}

export interface GitCasterIssue {
  type: "gitcaster.issue.v1";
  id: string;
  repo: string;
  title: string;
  body: string;
  author: string;
  status: "open" | "closed";
  labels: string[];
  events: GitCasterEvent[];
  signatures: SignatureRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface GitCasterPR {
  type: "gitcaster.pr.v1";
  id: string;
  repo: string;
  title: string;
  body: string;
  base: string;
  head: string;
  author: string;
  reviewers: string[];
  status: "open" | "reviewed" | "merged" | "closed" | "blocked";
  diffCid?: string | null;
  events: GitCasterEvent[];
  signatures: SignatureRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface GitCasterAgent {
  type: "gitcaster.agent.v1";
  did: string;
  name: string;
  role: string;
  skills: string[];
  trustScore: number;
  capabilityScopes: CasterCapabilityScope[];
  workspace?: string;
  lastSeenAt?: string;
  status: GitCasterStatus;
}

export interface GitCasterNode {
  type: "gitcaster.node.v1";
  did: string;
  name: string;
  region: string;
  endpoint: string;
  status: GitCasterStatus;
  peerCount: number;
  repoCount: number;
  agentCount: number;
  writesAccepted: number;
  gossipEvents: number;
  qstorageObjects: number;
  uptime?: string;
  lastActivityAt?: string;
}

export interface GitCasterNodeHealth {
  type: "gitcaster.node.health.v1";
  node: string;
  did: string;
  status: GitCasterStatus;
  storage: {
    mode: "local-alpha" | "qstorage" | "castercloud";
    verified: boolean;
  };
  repos: number;
  refs: number;
  issues: number;
  prs: number;
  agents: number;
  events: number;
  mcpTools: number;
  writesAccepted: number;
  gossipEvents: number;
  peersKnown: number;
  preview: boolean;
  proof?: {
    hash: string;
    signature: string | null;
  };
  timestamp: string;
}

export interface QStorageObject {
  type: "gitcaster.qstorage.object.v1";
  cid: string | null;
  hash: string;
  size: number;
  mime: string;
  path: string;
  pinnedBy?: string;
  proof?: string | null;
  createdAt: string;
  status: GitCasterStatus;
}

export interface GitCasterObjectManifest {
  type: "gitcaster.object.manifest.v1";
  repo: string;
  commit: string;
  objects: QStorageObject[];
  rootHash: string;
  createdAt: string;
  signedBy: string;
  signature: string | null;
  storage: {
    mode: "local-alpha" | "qstorage" | "castercloud";
    status: GitCasterStatus;
    cid?: string | null;
    blocker?: string | null;
  };
}

export interface CasterCloudDeployment {
  type: "gitcaster.castercloud.deployment.v1";
  id: string;
  app: string;
  repo?: string;
  branch?: string;
  commit?: string;
  artifactHash: string;
  qstorageCid?: string | null;
  quilibriumUrl?: string | null;
  casterDomain?: string | null;
  manifest: Record<string, unknown>;
  proof?: Record<string, unknown> | null;
  deployedBy: string;
  deployedAt: string;
  status: GitCasterStatus;
  blocker?: string | null;
}

export interface EcosystemApp {
  type: "gitcaster.ecosystem.entry.v1";
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: "Agents" | "Miniapps" | "Games" | "Infrastructure" | "Builder tools" | "Finance" | "Models" | "Identity" | "Storage" | "Social / Farcaster" | "CasterCloud deployments" | "Collectibles" | "Proof / evidence" | "Security" | "Desktop / local runtime";
  status: GitCasterStatus;
  sensitivity: "public" | "sensitive" | "needs-review" | "secret-risk" | "legacy-reference";
  sourcePath?: string;
  repo?: string | null;
  deploymentUrl?: string | null;
  qstorageProof?: string | null;
  agents: string[];
  tokenHooks: CasterTokenReward[];
  miniappCompatible?: boolean | null;
  gameCompatible?: boolean | null;
  farcasterCompatible?: boolean | null;
  casterCloudReady?: boolean;
  tags: string[];
  evidence: string[];
  blockers: string[];
}

export interface MiniappManifest {
  type: "gitcaster.miniapp.manifest.v1";
  id: string;
  name: string;
  sourcePath: string;
  assets: string[];
  farcasterManifest?: Record<string, unknown> | null;
  quilibriumDeployment?: CasterCloudDeployment | null;
  casterDomain?: CasterDomain | null;
  compatibilityReport?: Record<string, unknown> | null;
  status: GitCasterStatus;
  blockers: string[];
}

export interface CasterDomain {
  type: "gitcaster.domain.request.v1";
  domain: string;
  target: string;
  owner: string;
  status: "requested" | "reserved" | "pending-verification" | "blocked-by-registry" | "mapped" | "rejected";
  proof?: string | null;
  blocker?: string | null;
  createdAt: string;
  signature?: string | null;
}

export interface CasterTokenReward {
  type: "gitcaster.reward.proof.v1";
  token: "$CASTER";
  tokenAddress: "0xa1db936b33cec552d453c21a44f7153777f6f5ee373e47680ab58fcc4efebe2f";
  action: "repo.created" | "push.signed" | "pr.merged" | "miniapp.imported" | "deployment.verified";
  actor: string;
  repo?: string;
  amount: "proof-only" | string;
  status: "not-settled" | "proof-only" | "blocked" | "requires-contract";
  requiresContract: boolean;
  proof?: string | null;
  createdAt: string;
}

export interface GitCasterEvent {
  type: GitCasterEventName;
  id: string;
  actor: string;
  repo?: string;
  payload: Record<string, unknown>;
  timestamp: string;
  signature?: string | null;
  status: GitCasterStatus;
}

export interface SignatureRecord {
  signer: string;
  alg: "ed25519";
  sig: string;
  signedAt?: string;
}

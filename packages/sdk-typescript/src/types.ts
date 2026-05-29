export type GitCasterStatus =
  | "alpha-local"
  | "preview"
  | "proof-only"
  | "blocked"
  | "requires-endpoint"
  | "requires-node"
  | "requires-identity"
  | "requires-signing-key"
  | "requires-contract"
  | "requires-audit"
  | "requires-governance"
  | "requires-registry"
  | "requires-health-proof"
  | "requires-federation-proof"
  | "requires-verification-proof"
  | "error";

export interface GitCasterBlockedResult {
  status: Exclude<GitCasterStatus, "alpha-local" | "preview" | "proof-only">;
  ok: false;
  reason: string;
  requiredEvidence?: string[];
  requiredEnv?: string[];
  tool?: string;
}

export interface GitCasterSuccessResult<T> {
  status: "alpha-local" | "preview" | "proof-only";
  ok: true;
  value: T;
  evidence?: string[];
}

export type GitCasterResult<T> = GitCasterSuccessResult<T> | GitCasterBlockedResult;

export type GitCasterFetch = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
) => Promise<{
  ok: boolean;
  status: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
}>;

export interface GitCasterRequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
}

export interface GitCasterSigner {
  sign(payload: unknown): Promise<GitCasterSignedEnvelope> | GitCasterSignedEnvelope;
}

export interface GitCasterClientOptions {
  nodeUrl?: string;
  did?: string;
  signer?: GitCasterSigner;
  fetchImpl?: GitCasterFetch;
  evidenceBasePath?: string;
}

export interface GitCasterSignedEnvelope {
  did: string;
  payload: unknown;
  signature: string;
  algorithm: "ed25519" | "external";
}

export interface GitCasterIdentity {
  did: string;
  status: "alpha-local" | "requires-identity";
}

export interface GitCasterRepo {
  owner: string;
  name: string;
  cloneUrl: string;
}

export interface GitCasterRef {
  name: string;
  oid: string;
}

export interface GitCasterIssue {
  id: string;
  title: string;
  status: "open" | "closed";
}

export interface GitCasterPullRequest {
  id: string;
  title: string;
  status: "open" | "merged" | "closed";
}

export interface GitCasterTokenInfo {
  symbol: "$GITCASTER";
  address: string;
  staking: "requires-contract";
  rewards: "requires-contract";
  governance: "requires-governance";
}

export interface GitCasterProofStatus {
  qstorage: "requires-verification-proof";
  castercloud: "requires-verification-proof";
  evidence?: string[];
}

export interface GitCasterNodeStatus {
  name: string;
  status: "requires-health-proof" | "requires-federation-proof" | "alpha-local";
}

export interface GitCasterDomainStatus {
  name: string;
  status: "requires-registry";
}

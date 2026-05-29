import type {
  GitCasterBlockedResult,
  GitCasterClientOptions,
  GitCasterDomainStatus,
  GitCasterFetch,
  GitCasterIdentity,
  GitCasterIssue,
  GitCasterNodeStatus,
  GitCasterPullRequest,
  GitCasterRef,
  GitCasterRepo,
  GitCasterRequestOptions,
  GitCasterResult,
  GitCasterSignedEnvelope,
  GitCasterTokenInfo,
} from "./types.js";

const TOKEN_ADDRESS = "0x764697544F09921c3c8bA89F1Fb6388C4127fB07";

export function blockedResult(reason: string, extra: Partial<GitCasterBlockedResult> = {}): GitCasterBlockedResult {
  return { status: extra.status || "blocked", ok: false, reason, ...extra };
}

export function requiresEndpointResult(reason: string, requiredEnv: string[] = []): GitCasterBlockedResult {
  return blockedResult(reason, { status: "requires-endpoint", requiredEnv });
}

export function requiresSigningKeyResult(reason: string): GitCasterBlockedResult {
  return blockedResult(reason, { status: "requires-signing-key", requiredEvidence: ["signed envelope"] });
}

export function requiresRegistryResult(reason: string): GitCasterBlockedResult {
  return blockedResult(reason, { status: "requires-registry", requiredEvidence: ["domain registry proof"] });
}

export function requiresContractResult(reason: string): GitCasterBlockedResult {
  return blockedResult(reason, { status: "requires-contract", requiredEvidence: ["contract audit and activation proof"] });
}

export function redactGitCasterValue(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/(api[_-]?key|secret|token|private[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9._/+=-]{8,}/gi, "$1=[redacted]")
    .replace(/[A-Za-z0-9+/]{80,}={0,2}/g, "[redacted-long-value]");
}

function globalFetch(): GitCasterFetch | undefined {
  const candidate = (globalThis as unknown as { fetch?: GitCasterFetch }).fetch;
  return typeof candidate === "function" ? candidate : undefined;
}

function normalizeUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export class GitCasterClient {
  private readonly nodeUrl?: string;
  private readonly did?: string;
  private readonly signer?: GitCasterClientOptions["signer"];
  private readonly fetchImpl?: GitCasterFetch;

  constructor(options: GitCasterClientOptions = {}) {
    this.nodeUrl = options.nodeUrl;
    this.did = options.did;
    this.signer = options.signer;
    this.fetchImpl = options.fetchImpl || globalFetch();
  }

  identityShow(): GitCasterResult<GitCasterIdentity> {
    if (!this.did) {
      return blockedResult("GitCaster identity is not configured.", {
        status: "requires-identity",
        requiredEnv: ["CASTER_DID"],
      });
    }
    return { status: "alpha-local", ok: true, value: { did: this.did, status: "alpha-local" } };
  }

  async identitySign(payload: unknown): Promise<GitCasterResult<GitCasterSignedEnvelope>> {
    if (!this.signer) return requiresSigningKeyResult("A signer is required before GitCaster can sign payloads.");
    const canonical = this.canonicalPayload("identity.sign", payload);
    if (/private[_-]?key|secret|token/i.test(redactGitCasterValue(canonical))) {
      return blockedResult("Refusing to sign secret-looking payload.", { status: "error" });
    }
    const envelope = await this.signer.sign(canonical);
    return { status: "alpha-local", ok: true, value: envelope };
  }

  nodeHealth(): Promise<GitCasterResult<unknown>> {
    return this.nodeRead("node.health", "/health");
  }

  nodeRegistry(): Promise<GitCasterResult<unknown>> {
    return this.nodeRead("node.registry", "/node/registry");
  }

  nodeStatus(): GitCasterResult<GitCasterNodeStatus[]> {
    return blockedResult("Public node health proof is required before node status can be reported.", {
      status: "requires-health-proof",
      requiredEvidence: ["PR-24 public node health proof"],
    });
  }

  repoList(): Promise<GitCasterResult<unknown>> {
    return this.nodeRead("repo.list", "/repos");
  }

  repoGet(owner: string, repo: string): Promise<GitCasterResult<unknown>> {
    return this.nodeRead("repo.get", `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  }

  repoCreate(input: unknown): Promise<GitCasterResult<unknown>> {
    return this.signedMutation("repo.create", "/repos", input);
  }

  repoCloneUrl(owner: string, repo: string): GitCasterResult<GitCasterRepo> {
    return {
      status: "alpha-local",
      ok: true,
      value: { owner, name: repo, cloneUrl: `gitcaster://${owner}/${repo}` },
    };
  }

  refsList(owner: string, repo: string): Promise<GitCasterResult<unknown>> {
    return this.nodeRead("refs.list", `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/refs`);
  }

  refCertificateGet(owner: string, repo: string, ref: string): Promise<GitCasterResult<unknown>> {
    return this.nodeRead("ref.certificate.get", `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/refs/${encodeURIComponent(ref)}/certificate`);
  }

  refCertificateVerify(certificate: GitCasterRef): GitCasterResult<{ valid: boolean; certificate: GitCasterRef }> {
    return { status: "alpha-local", ok: true, value: { valid: true, certificate }, evidence: ["local certificate shape only"] };
  }

  issueList(owner: string, repo: string): Promise<GitCasterResult<unknown>> {
    return this.nodeRead("issue.list", `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`);
  }

  issueCreate(owner: string, repo: string, input: unknown): Promise<GitCasterResult<unknown>> {
    return this.signedMutation("issue.create", `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`, input);
  }

  issueUpdate(owner: string, repo: string, issueId: string, input: Partial<GitCasterIssue>): Promise<GitCasterResult<unknown>> {
    return this.signedMutation("issue.update", `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${encodeURIComponent(issueId)}`, input, "PATCH");
  }

  prList(owner: string, repo: string): Promise<GitCasterResult<unknown>> {
    return this.nodeRead("pr.list", `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/prs`);
  }

  prView(owner: string, repo: string, prId: string): Promise<GitCasterResult<unknown>> {
    return this.nodeRead("pr.view", `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/prs/${encodeURIComponent(prId)}`);
  }

  prCreate(owner: string, repo: string, input: unknown): Promise<GitCasterResult<unknown>> {
    return this.signedMutation("pr.create", `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/prs`, input);
  }

  prReview(owner: string, repo: string, prId: string, input: Partial<GitCasterPullRequest>): Promise<GitCasterResult<unknown>> {
    return this.signedMutation("pr.review", `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/prs/${encodeURIComponent(prId)}/reviews`, input);
  }

  prMerge(owner: string, repo: string, prId: string, input: unknown): Promise<GitCasterResult<unknown>> {
    return this.signedMutation("pr.merge", `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/prs/${encodeURIComponent(prId)}/merge`, input);
  }

  qstorageStatus(): GitCasterResult<{ qstorage: "requires-verification-proof" }> {
    return blockedResult("QStorage verification proof is required.", {
      status: "requires-verification-proof",
      requiredEvidence: ["PR-23 QStorage live verification proof"],
    });
  }

  castercloudStatus(): GitCasterResult<{ castercloud: "requires-verification-proof" }> {
    return blockedResult("CasterCloud deploy verification proof is required.", {
      status: "requires-verification-proof",
      requiredEvidence: ["PR-23 CasterCloud live verification proof"],
    });
  }

  publicNodeStatus(): GitCasterResult<GitCasterNodeStatus[]> {
    return blockedResult("Public node federation proof is required.", {
      status: "requires-federation-proof",
      requiredEvidence: ["PR-24 three-node federation proof"],
    });
  }

  federationStatus(): GitCasterResult<GitCasterNodeStatus[]> {
    return blockedResult("Three-node federation proof is required.", {
      status: "requires-federation-proof",
      requiredEvidence: ["PR-24 federation proof"],
    });
  }

  tokenInfo(): GitCasterResult<GitCasterTokenInfo> {
    return {
      status: "proof-only",
      ok: true,
      value: {
        symbol: "$GITCASTER",
        address: TOKEN_ADDRESS,
        staking: "requires-contract",
        rewards: "requires-contract",
        governance: "requires-governance",
      },
      evidence: ["contract and audit proof required before utility activation"],
    };
  }

  domainStatus(name: string): GitCasterResult<GitCasterDomainStatus> {
    return requiresRegistryResult(`Domain registry proof is required for ${name}.`);
  }

  evidenceBundleStatus(): GitCasterResult<{ status: "proof-only" }> {
    return { status: "proof-only", ok: true, value: { status: "proof-only" }, evidence: ["launch/evidence"] };
  }

  private async nodeRead(tool: string, path: string): Promise<GitCasterResult<unknown>> {
    if (!this.nodeUrl) {
      return blockedResult("A GitCaster node URL is required for node reads.", {
        status: "requires-node",
        requiredEnv: ["GITCASTER_NODE", "CASTER_NODE_URL"],
        tool,
      });
    }
    if (!this.fetchImpl) {
      return requiresEndpointResult("No fetch implementation is available for node reads.", ["GITCASTER_NODE"]);
    }
    return this.request(tool, path, { method: "GET" });
  }

  private async signedMutation(
    tool: string,
    path: string,
    body: unknown,
    method: "POST" | "PATCH" = "POST"
  ): Promise<GitCasterResult<unknown>> {
    if (!this.signer) return requiresSigningKeyResult(`${tool} requires a signer.`);
    if (!this.nodeUrl) {
      return blockedResult("A GitCaster node URL is required for signed mutations.", {
        status: "requires-node",
        requiredEnv: ["GITCASTER_NODE", "CASTER_NODE_URL"],
        tool,
      });
    }
    const envelope = await this.signer.sign(this.canonicalPayload(tool, body));
    return this.request(tool, path, { method, body: envelope });
  }

  private canonicalPayload(tool: string, payload: unknown): { tool: string; did?: string; payload: unknown } {
    return { tool, did: this.did, payload };
  }

  private async request(tool: string, path: string, options: GitCasterRequestOptions): Promise<GitCasterResult<unknown>> {
    if (!this.nodeUrl || !this.fetchImpl) {
      return requiresEndpointResult("GitCaster node endpoint is not available.", ["GITCASTER_NODE"]);
    }
    try {
      const response = await this.fetchImpl(normalizeUrl(this.nodeUrl, path), {
        method: options.method || "GET",
        headers: { "content-type": "application/json" },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
      const value = response.json ? await response.json() : response.text ? await response.text() : null;
      if (!response.ok) {
        return blockedResult(`Node request failed with status ${response.status}.`, { status: "error", tool });
      }
      return { status: "alpha-local", ok: true, value };
    } catch (error) {
      return blockedResult(redactGitCasterValue(error instanceof Error ? error.message : String(error)), { status: "error", tool });
    }
  }
}

export function createGitCasterClient(options: GitCasterClientOptions = {}): GitCasterClient {
  return new GitCasterClient(options);
}

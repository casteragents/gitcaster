export type GitCasterSubmissionCategory =
  | "Agents"
  | "Builder tools"
  | "Miniapps"
  | "Games"
  | "Infrastructure"
  | "Integrations"
  | "Finance"
  | "Models"
  | "Collectibles"
  | "Storage"
  | "Security"
  | "Unknown";

export type GitCasterSubmissionStatus =
  | "submitted"
  | "needs-review"
  | "rejected"
  | "blocked"
  | "requires-evidence"
  | "requires-security-review"
  | "requires-deployment-proof"
  | "requires-qstorage-proof"
  | "requires-castercloud-proof"
  | "requires-registry-proof"
  | "requires-contract-proof"
  | "error";

export type GitCasterAppSubmission = {
  type: "gitcaster.ecosystem.submission.v1";
  appName: string;
  appUrl?: string;
  tagline?: string;
  description?: string;
  category: GitCasterSubmissionCategory;
  uses?: string[];
  builder?: string;
  builderUrl?: string;
  contact?: string;
  repoUrl?: string;
  demoUrl?: string;
  claims?: string[];
  evidence?: string[];
};

export type GitCasterSubmissionReview = {
  type: "gitcaster.ecosystem.submission-review.v1";
  status: Exclude<GitCasterSubmissionStatus, "submitted">;
  accepted: false;
  featured: false;
  grantApproved: false;
  coMarketingApproved: false;
  reasons: string[];
  requiredEvidence: string[];
  redacted: true;
};

export function validateSubmission(submission: GitCasterAppSubmission): string[] {
  const blockers: string[] = [];
  if (submission.type !== "gitcaster.ecosystem.submission.v1") blockers.push("invalid submission type");
  if (!submission.appName?.trim()) blockers.push("appName is required");
  if (!submission.category) blockers.push("category is required");
  return blockers;
}

export function classifySubmissionClaim(text: string): {
  status: GitCasterSubmissionStatus;
  reason: string;
  requiredEvidence: string[];
} {
  const value = text.toLowerCase();
  if (containsSecretLikeValue(text)) {
    return { status: "rejected", reason: "Secret-looking value is not accepted.", requiredEvidence: [] };
  }
  if (containsLegacyIdentity(value)) {
    return { status: "rejected", reason: "Reference-only identity is not accepted as GitCaster public identity.", requiredEvidence: [] };
  }
  if (containsHostedProductionPath(value)) {
    return { status: "rejected", reason: "Hosted production dependency is not accepted for GitCaster production claims.", requiredEvidence: [] };
  }
  if (/\bproduction-ready\b|\bproduction\b|\bga\b|\bapproved\b|\bfeatured\b|\bgrant\b|\bco-marketing\b/.test(value)) {
    return { status: "blocked", reason: "Production, approval, and promotion claims are gated by later review.", requiredEvidence: ["operator review evidence"] };
  }
  if (/\blive\b|\bdeployed\b|\bverified\b|\bonline\b/.test(value)) {
    return { status: "requires-deployment-proof", reason: "Runtime claims require direct evidence.", requiredEvidence: ["live endpoint proof", "deployment proof"] };
  }
  if (/qstorage/.test(value)) {
    return { status: "requires-qstorage-proof", reason: "QStorage claims require endpoint proof.", requiredEvidence: ["QStorage verification evidence"] };
  }
  if (/castercloud/.test(value)) {
    return { status: "requires-castercloud-proof", reason: "CasterCloud claims require endpoint proof.", requiredEvidence: ["CasterCloud verification evidence"] };
  }
  if (/\.caster\b|domain mapped|registry/.test(value)) {
    return { status: "requires-registry-proof", reason: "Domain claims require registry proof.", requiredEvidence: ["registry proof"] };
  }
  if (/token|staking|rewards|governance/.test(value)) {
    return { status: "requires-contract-proof", reason: "Token claims require contract, audit, and governance proof.", requiredEvidence: ["contract proof", "audit proof", "governance proof"] };
  }
  return { status: "needs-review", reason: "Submission claim requires manual review.", requiredEvidence: [] };
}

export function rejectUnsupportedSubmissionClaims(submission: GitCasterAppSubmission): GitCasterSubmissionReview {
  return createSubmissionReview(submission);
}

export function createSubmissionReview(submission: GitCasterAppSubmission): GitCasterSubmissionReview {
  const reasons = validateSubmission(submission);
  const requiredEvidence = new Set<string>();
  let status: Exclude<GitCasterSubmissionStatus, "submitted"> = reasons.length > 0 ? "blocked" : "needs-review";

  for (const claim of submission.claims ?? []) {
    const result = classifySubmissionClaim(claim);
    reasons.push(result.reason);
    for (const item of result.requiredEvidence) requiredEvidence.add(item);
    if (result.status === "rejected") status = "rejected";
    else if (status !== "rejected" && result.status === "blocked") status = "blocked";
    else if (status !== "rejected" && status !== "blocked" && result.status !== "needs-review" && result.status !== "submitted") status = result.status;
  }

  for (const field of [submission.appUrl, submission.repoUrl, submission.demoUrl].filter(Boolean) as string[]) {
    const result = classifySubmissionClaim(field);
    if (result.status === "rejected") {
      status = "rejected";
      reasons.push(result.reason);
    } else if (field.includes("://") && (submission.evidence ?? []).length === 0) {
      status = status === "needs-review" ? "requires-evidence" : status;
      reasons.push("URLs remain unverified until evidence exists.");
      requiredEvidence.add("URL verification evidence");
    }
  }

  return {
    type: "gitcaster.ecosystem.submission-review.v1",
    status,
    accepted: false,
    featured: false,
    grantApproved: false,
    coMarketingApproved: false,
    reasons: [...new Set(reasons)].sort(),
    requiredEvidence: [...requiredEvidence].sort(),
    redacted: true
  };
}

export function redactSubmission(submission: GitCasterAppSubmission): GitCasterAppSubmission {
  return {
    ...submission,
    contact: submission.contact ? "[redacted-contact]" : submission.contact,
    appUrl: redactMaybeSensitiveUrl(submission.appUrl),
    builderUrl: redactMaybeSensitiveUrl(submission.builderUrl),
    repoUrl: redactMaybeSensitiveUrl(submission.repoUrl),
    demoUrl: redactMaybeSensitiveUrl(submission.demoUrl),
    evidence: (submission.evidence ?? []).map((item) => (containsSecretLikeValue(item) ? "[redacted]" : item))
  };
}

export function submissionPolicySummary(): Record<string, boolean | string[]> {
  return {
    staticPreviewOnly: true,
    externalPost: false,
    automaticAcceptance: false,
    featuredClaimAllowed: false,
    grantApprovalAllowed: false,
    coMarketingApprovalAllowed: false,
    requiresEvidenceForLiveClaims: true,
    forbiddenClaims: ["production claims", "approval claims", "secret values", "hosted production dependency"]
  };
}

function containsLegacyIdentity(value: string): boolean {
  const legacy = ["git" + "lawb", "git" + "lawb://", "did:" + "gitlawb", "$" + "GITLAWB", "GIT" + "LAWB_"];
  return legacy.some((item) => value.includes(item.toLowerCase()));
}

function containsHostedProductionPath(value: string): boolean {
  return /\b(vercel|supabase|cloudflare|fly|render|netlify|pinata|ipfs|filecoin|arweave)\b.*\bproduction\b|\bproduction\b.*\b(vercel|supabase|cloudflare|fly|render|netlify|pinata|ipfs|filecoin|arweave)\b/.test(value);
}

function containsSecretLikeValue(value: string): boolean {
  return /BEGIN (OPENSSH |)PRIVATE KEY|Authorization:\s*Bearer\s+\S+|sk-[A-Za-z0-9_-]{12,}|OPENAI_API_KEY=\S+|FARCASTER_TOKEN=\S+|HYPERSNAP\S*=\S+|mnemonic|seed phrase|data:image\//i.test(value)
    || /[A-Za-z0-9+/]{500,}={0,2}/.test(value);
}

function redactMaybeSensitiveUrl(value?: string): string | undefined {
  if (!value) return value;
  return /token|secret|key=|password|credential/i.test(value) ? "[redacted-url]" : value;
}

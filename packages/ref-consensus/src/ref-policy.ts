import type { CasterCapabilityScope } from "../../protocol/dist/types.js";

export interface RefPolicy {
  protectedRefs: string[];
  allowForcePush: boolean;
  allowDeletion: boolean;
  protectedRefScopes: CasterCapabilityScope[];
  normalRefScopes: CasterCapabilityScope[];
}

export const DEFAULT_REF_POLICY: RefPolicy = {
  protectedRefs: ["refs/heads/main", "refs/heads/master", "refs/heads/prod", "refs/heads/production", "refs/heads/release"],
  allowForcePush: false,
  allowDeletion: false,
  protectedRefScopes: ["repo:admin"],
  normalRefScopes: ["ref:update", "repo:admin"],
};

export interface RefPolicyValidationInput {
  ref: string;
  from: string | null;
  to: string | null;
  currentHead: string | null;
  scope?: CasterCapabilityScope | string;
  policy?: RefPolicy;
  explicitProtectedOverride?: boolean;
}

export interface RefPolicyValidationResult {
  ok: boolean;
  errors: string[];
  protected: boolean;
  requiresAdmin: boolean;
}

export function isProtectedRef(ref: string, policy: RefPolicy = DEFAULT_REF_POLICY): boolean {
  return policy.protectedRefs.includes(ref);
}

export function requiresAdminForRef(ref: string, policy: RefPolicy = DEFAULT_REF_POLICY): boolean {
  return isProtectedRef(ref, policy);
}

export function validateRefName(ref: string): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!ref.startsWith("refs/heads/")) errors.push("only refs/heads/* refs are supported in PR-07");
  if (ref.startsWith("refs/tags/")) errors.push("refs/tags/* refs are not supported in PR-07");
  if (ref.includes("..")) errors.push("ref cannot contain ..");
  if (/\s/.test(ref)) errors.push("ref cannot contain spaces");
  if (ref.includes("\\")) errors.push("ref cannot contain backslash");
  if (/[\u0000-\u001f\u007f]/.test(ref)) errors.push("ref cannot contain control characters");
  if (ref.endsWith("/") || ref.includes("//")) errors.push("ref path is malformed");
  return { ok: errors.length === 0, errors };
}

export function validateRefUpdatePolicy(args: RefPolicyValidationInput): RefPolicyValidationResult {
  const policy = args.policy || DEFAULT_REF_POLICY;
  const errors: string[] = [];
  const refName = validateRefName(args.ref);
  errors.push(...refName.errors);
  const protectedRef = isProtectedRef(args.ref, policy);
  const requiresAdmin = requiresAdminForRef(args.ref, policy);
  if (args.to === null && !policy.allowDeletion) errors.push("branch deletion disabled in PR-07");
  if (args.currentHead && args.from !== args.currentHead && !policy.allowForcePush) errors.push("force push disabled in PR-07");
  if (!args.currentHead && args.from !== null) errors.push("first ref update must use from null");
  if (protectedRef && !args.explicitProtectedOverride && !policy.protectedRefScopes.includes(args.scope as CasterCapabilityScope)) {
    errors.push("protected branch update requires repo:admin");
  }
  if (!protectedRef && args.scope && !policy.normalRefScopes.includes(args.scope as CasterCapabilityScope)) {
    errors.push("ref update requires ref:update or repo:admin scope");
  }
  return { ok: errors.length === 0, errors, protected: protectedRef, requiresAdmin };
}

import type { GitCasterNodeConfig } from "../config.js";
import type { LocalAlphaStore } from "../services/local-alpha-store.js";
import type { NodeMutationVerificationResult } from "../services/mutation-verify.js";
import { handlePushLocal } from "../services/push-local-service.js";

export async function handlePushLocalRoute(args: { store: LocalAlphaStore; verifiedMutation?: NodeMutationVerificationResult; config: GitCasterNodeConfig }) {
  if (!args.verifiedMutation?.envelope) {
    return { statusCode: 403, body: { type: "gitcaster.repo.push-local.error.v1", status: "blocked", error: "missing_verified_envelope" } };
  }
  return handlePushLocal(args.store, args.verifiedMutation.envelope, args.verifiedMutation, args.config);
}

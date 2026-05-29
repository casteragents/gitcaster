export interface SignedMutationEnvelope {
  type: "gitcaster.signed-mutation.v1";
  actor: string;
  payload: Record<string, unknown>;
  payloadHash: string;
  timestamp: string;
  nonce: string;
  signature: string;
  status: "alpha-local" | "proof-only" | "blocked" | "requires-signing-key" | "requires-endpoint";
}

export const PUSH_LOCAL_COMMAND_HELP = [
  "gc repo push-local <gitcaster://did:caster:z.../repo> --path <local-app> --branch main",
  "Uses local identity material from ~/.gitcaster.",
  "Creates a signed local-alpha push payload for a did:caster actor.",
  "This public-alpha module does not install a hosted or production CLI.",
].join("\n");

export interface BuildPushLocalPayloadArgs {
  repo: string;
  rootPath: string;
  branch?: string;
  message?: string;
}

export function buildPushLocalPayload(args: BuildPushLocalPayloadArgs) {
  if (!args.repo.startsWith("gitcaster://did:caster:")) throw new Error("repo must use gitcaster:// with did:caster owner");
  return {
    type: "gitcaster.repo.push-local.payload.v1" as const,
    repo: args.repo,
    rootPath: args.rootPath,
    branch: args.branch || "main",
    message: args.message || "local alpha push",
  };
}

export function printPushLocalResult(result: unknown): string {
  const value = result as { status?: string; repo?: string; branch?: string; head?: string; objectManifest?: { rootHash?: string; objectCount?: number }; refCertificate?: { type?: string; status?: string } };
  if (value.status !== "alpha-local") return JSON.stringify(result, null, 2);
  return [
    `status: ${value.status}`,
    `repo: ${value.repo}`,
    `branch: ${value.branch}`,
    `head: ${value.head}`,
    `objectManifest: ${value.objectManifest?.rootHash} (${value.objectManifest?.objectCount || 0} objects)`,
    `refCertificate: ${value.refCertificate?.type} ${value.refCertificate?.status}`,
  ].join("\n");
}

export interface PushLocalEnvelopeInput {
  envelope: SignedMutationEnvelope;
}

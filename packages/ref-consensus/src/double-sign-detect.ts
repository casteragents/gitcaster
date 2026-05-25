import type { RefUpdateCertificate } from "../../protocol/dist/types.js";
import { sha256Object } from "../../object-store/dist/index.js";

export interface DoubleSignEvidence {
  type: "gitcaster.ref.double-sign.v1";
  status: "blocked";
  repo: string;
  ref: string;
  node: string;
  height: number;
  certificateA: string;
  certificateB: string;
  createdAt: string;
  resolution: "node-adjudication-required";
}

export function detectDoubleSign(args: { existing: RefUpdateCertificate[]; candidate: RefUpdateCertificate }): boolean {
  return args.existing.some(
    (cert) =>
      cert.node === args.candidate.node &&
      cert.repo === args.candidate.repo &&
      cert.ref === args.candidate.ref &&
      cert.from === args.candidate.from &&
      cert.to !== args.candidate.to,
  );
}

export function createDoubleSignEvidence(args: {
  repo: string;
  ref: string;
  node: string;
  height: number;
  certificateA: RefUpdateCertificate | string;
  certificateB: RefUpdateCertificate | string;
  createdAt?: string;
}): DoubleSignEvidence {
  return {
    type: "gitcaster.ref.double-sign.v1",
    status: "blocked",
    repo: args.repo,
    ref: args.ref,
    node: args.node,
    height: args.height,
    certificateA: typeof args.certificateA === "string" ? args.certificateA : sha256Object(args.certificateA),
    certificateB: typeof args.certificateB === "string" ? args.certificateB : sha256Object(args.certificateB),
    createdAt: args.createdAt || new Date().toISOString(),
    resolution: "node-adjudication-required",
  };
}

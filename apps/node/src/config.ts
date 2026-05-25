import os from "node:os";
import path from "node:path";

export const DEFAULT_NODE_NAME = "node.gitcaster.casterchain";
export const DEFAULT_NODE_DID = "did:caster:zLocalAlphaNode";
export const DEFAULT_NODE_PORT = 8787;
export const DEFAULT_LOCAL_STATE_DIR = path.join(os.tmpdir(), "gitcaster-alpha-node");

export interface GitCasterNodeConfig {
  host: string;
  port: number;
  nodeName: string;
  nodeDid: string;
  stateDir: string;
  storageMode: "local-alpha";
  startedAt: string;
}

export function loadGitCasterNodeConfig(overrides: Partial<GitCasterNodeConfig> = {}): GitCasterNodeConfig {
  return {
    host: process.env.GITCASTER_NODE_HOST || "127.0.0.1",
    port: Number(process.env.GITCASTER_NODE_PORT || process.env.CASTER_NODE_PORT || DEFAULT_NODE_PORT),
    nodeName: DEFAULT_NODE_NAME,
    nodeDid: DEFAULT_NODE_DID,
    stateDir: process.env.GITCASTER_ALPHA_STATE_DIR || DEFAULT_LOCAL_STATE_DIR,
    storageMode: "local-alpha",
    startedAt: new Date().toISOString(),
    ...overrides,
  };
}

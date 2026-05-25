import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createCasterDIDDocument, type CasterDIDDocument } from "./did-caster.js";

export interface IdentityWriteResult {
  home: string;
  dir: string;
  privateKeyPath: string;
  publicKeyPath: string;
  didPath: string;
  didDocument: CasterDIDDocument;
  privateKeyMode: string;
}

export interface IdentityReadResult {
  privateKeyPem: string;
  publicKeyPem: string;
  didDocument: CasterDIDDocument;
}

export function resolveGitCasterHome(homeOverride?: string): string {
  return homeOverride || process.env.GITCASTER_HOME || os.homedir();
}

export function ensureGitCasterHome(homeOverride?: string): string {
  const home = resolveGitCasterHome(homeOverride);
  const dir = path.join(home, ".gitcaster");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function identityPaths(homeOverride?: string): { home: string; dir: string; privateKeyPath: string; publicKeyPath: string; didPath: string } {
  const home = resolveGitCasterHome(homeOverride);
  const dir = path.join(home, ".gitcaster");
  return {
    home,
    dir,
    privateKeyPath: path.join(dir, "identity.pem"),
    publicKeyPath: path.join(dir, "identity.public.pem"),
    didPath: path.join(dir, "did.json"),
  };
}

export function writeIdentityFiles(args: { homeOverride?: string; did: string; kind?: "human" | "agent" | "node"; publicKeyPem: string; privateKeyPem: string }): IdentityWriteResult {
  const paths = identityPaths(args.homeOverride);
  fs.mkdirSync(paths.dir, { recursive: true });
  fs.writeFileSync(paths.privateKeyPath, args.privateKeyPem, { mode: 0o600 });
  fs.writeFileSync(paths.publicKeyPath, args.publicKeyPem);
  const didDocument = createCasterDIDDocument({ did: args.did, publicKeyPem: args.publicKeyPem, kind: args.kind });
  fs.writeFileSync(paths.didPath, `${JSON.stringify(didDocument, null, 2)}\n`);
  return {
    ...paths,
    didDocument,
    privateKeyMode: process.platform === "win32" ? "platform-default" : "0600",
  };
}

export function readIdentityFiles(homeOverride?: string): IdentityReadResult {
  const paths = identityPaths(homeOverride);
  return {
    privateKeyPem: fs.readFileSync(paths.privateKeyPath, "utf8"),
    publicKeyPem: fs.readFileSync(paths.publicKeyPath, "utf8"),
    didDocument: JSON.parse(fs.readFileSync(paths.didPath, "utf8")) as CasterDIDDocument,
  };
}

export function identityExists(homeOverride?: string): boolean {
  const paths = identityPaths(homeOverride);
  return fs.existsSync(paths.privateKeyPath) && fs.existsSync(paths.publicKeyPath) && fs.existsSync(paths.didPath);
}

#!/usr/bin/env node
import { createInterface } from "node:readline";
import { explainFetchBlocked } from "./fetch.js";
import { parseGitCasterUrl } from "./protocol.js";
import { explainPushBlocked } from "./push.js";
import { formatRefsForGitRemoteHelper, listRefsForRemote } from "./refs.js";
import { formatTransportDecision } from "./transport-status.js";

export interface GitRemoteHelperSessionArgs {
  argv?: string[];
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
  env?: NodeJS.ProcessEnv;
}

function write(output: NodeJS.WritableStream, text: string): void {
  output.write(text);
}

async function handleDirect(argv: string[], output: NodeJS.WritableStream, env: NodeJS.ProcessEnv): Promise<boolean> {
  const [command, remoteUrl] = argv;
  if (!command?.startsWith("--")) return false;
  if (!remoteUrl) throw new Error(`${command} requires a gitcaster:// URL`);
  if (command === "--parse") {
    write(output, `${JSON.stringify(parseGitCasterUrl(remoteUrl), null, 2)}\n`);
    return true;
  }
  if (command === "--status") {
    write(output, `${formatTransportDecision(explainPushBlocked())}\n`);
    return true;
  }
  if (command === "--list-refs") {
    const refs = await listRefsForRemote({ remoteUrl, env });
    write(output, formatRefsForGitRemoteHelper(refs));
    if (refs.status !== "alpha-local") write(output, `# ${refs.status}: ${refs.reason || "ref listing unavailable"}\n`);
    return true;
  }
  if (command === "--explain-push") {
    write(output, `${formatTransportDecision(explainPushBlocked())}\n`);
    return true;
  }
  if (command === "--explain-fetch") {
    write(output, `${formatTransportDecision(explainFetchBlocked())}\n`);
    return true;
  }
  throw new Error(`unsupported diagnostic command: ${command}`);
}

export async function handleGitRemoteHelperSession(args: GitRemoteHelperSessionArgs = {}): Promise<void> {
  const argv = args.argv || process.argv.slice(2);
  const input = args.input || process.stdin;
  const output = args.output || process.stdout;
  const env = args.env || process.env;
  const remoteUrl = argv[1] || argv[0];
  if (!remoteUrl) throw new Error("git-remote-gitcaster requires a remote URL");
  parseGitCasterUrl(remoteUrl);

  const rl = createInterface({ input, crlfDelay: Infinity });
  for await (const line of rl) {
    const command = line.trim();
    if (!command) continue;
    if (command === "capabilities") {
      write(output, "list\n\n");
    } else if (command === "list") {
      const refs = await listRefsForRemote({ remoteUrl, env });
      write(output, formatRefsForGitRemoteHelper(refs));
      write(output, "\n");
    } else if (command.startsWith("push")) {
      write(output, `error ${explainPushBlocked().reason}\n\n`);
    } else if (command.startsWith("fetch")) {
      write(output, `error ${explainFetchBlocked().reason}\n\n`);
    } else {
      write(output, `error unsupported PR-09 helper command: ${command}\n\n`);
    }
  }
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  if (await handleDirect(argv, process.stdout, process.env)) return;
  await handleGitRemoteHelperSession({ argv });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : "unknown git-remote-gitcaster error";
    process.stderr.write(`git-remote-gitcaster: ${message}\n`);
    process.exitCode = 1;
  });
}

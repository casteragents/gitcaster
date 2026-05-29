#!/usr/bin/env node
declare const process: { argv: string[] };

export * from "./commands/push-local.js";
export * from "./commands/issue.js";
export * from "./commands/pr.js";
export * from "./commands/mcp.js";

export function gitCasterCliHelp(): string {
  return [
    PUSH_LOCAL_COMMAND_HELP,
    ISSUE_COMMAND_HELP,
    PR_COMMAND_HELP,
    MCP_COMMAND_HELP
  ].join("\n\n");
}

import { PUSH_LOCAL_COMMAND_HELP } from "./commands/push-local.js";
import { ISSUE_COMMAND_HELP } from "./commands/issue.js";
import { PR_COMMAND_HELP } from "./commands/pr.js";
import { MCP_COMMAND_HELP } from "./commands/mcp.js";

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(gitCasterCliHelp());
}

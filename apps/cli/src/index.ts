#!/usr/bin/env node
declare const process: { argv: string[]; exitCode?: number };

export * from "./commands/push-local.js";
export * from "./commands/issue.js";
export * from "./commands/pr.js";
export * from "./commands/mcp.js";
export * from "./commands/deploy.js";

export function gitCasterCliHelp(): string {
  return [
    PUSH_LOCAL_COMMAND_HELP,
    ISSUE_COMMAND_HELP,
    PR_COMMAND_HELP,
    MCP_COMMAND_HELP,
    DEPLOY_COMMAND_HELP
  ].join("\n\n");
}

import { PUSH_LOCAL_COMMAND_HELP } from "./commands/push-local.js";
import { ISSUE_COMMAND_HELP } from "./commands/issue.js";
import { PR_COMMAND_HELP } from "./commands/pr.js";
import { MCP_COMMAND_HELP } from "./commands/mcp.js";
import { DEPLOY_COMMAND_HELP, runDeployPlanCommand } from "./commands/deploy.js";

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  const args = process.argv.slice(2);
  try {
    if (args[0] === "deploy" && args[1] === "plan") {
      console.log(runDeployPlanCommand(args.slice(2)));
    } else {
      console.log(gitCasterCliHelp());
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

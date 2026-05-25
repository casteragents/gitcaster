#!/usr/bin/env node
export * from "./commands/push-local.js";
export * from "./commands/issue.js";
export * from "./commands/pr.js";
export * from "./commands/mcp.js";

if (import.meta.url === `file://${process.argv[1]}`) {
  const { PUSH_LOCAL_COMMAND_HELP } = await import("./commands/push-local.js");
  const { ISSUE_COMMAND_HELP } = await import("./commands/issue.js");
  const { PR_COMMAND_HELP } = await import("./commands/pr.js");
  const { MCP_COMMAND_HELP } = await import("./commands/mcp.js");
  console.log([PUSH_LOCAL_COMMAND_HELP, ISSUE_COMMAND_HELP, PR_COMMAND_HELP, MCP_COMMAND_HELP].join("\n\n"));
}

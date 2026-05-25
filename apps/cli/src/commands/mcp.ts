export const MCP_COMMAND_HELP = `gc mcp serve

Runs the GitCaster local alpha MCP server over stdio.

Environment:
- GITCASTER_NODE
- CASTER_NODE_URL
- CASTER_DID
- CASTER_KEY
- ~/.gitcaster`;

export function buildMcpServeCommand(args: { nodeUrl?: string } = {}) {
  return {
    command: "gc",
    args: ["mcp", "serve"],
    env: {
      GITCASTER_NODE: args.nodeUrl || undefined,
    },
  };
}

export function printMcpHelp(): string {
  return MCP_COMMAND_HELP;
}

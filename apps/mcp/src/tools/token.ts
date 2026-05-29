import { TOOL_SCHEMAS } from "../schemas.js";
import type { GitCasterMcpTool } from "../tool-registry.js";

export const tokenTools: GitCasterMcpTool[] = [
  {
    name: "caster_token_info",
    description: "Return proof-only $GITCASTER metadata.",
    inputSchema: TOOL_SCHEMAS.caster_token_info,
    call: () => ({
      status: "proof-only",
      tool: "caster_token_info",
      result: {
        status: "proof-only",
        token: "$GITCASTER",
        tokenAddress: "0x764697544F09921c3c8bA89F1Fb6388C4127fB07",
        utilities: [
          { name: "node staking", status: "requires-contract" },
          { name: "builder rewards", status: "proof-only" },
          { name: "governance", status: "requires-contract" },
          { name: "repo tokenization", status: "requires-contract" },
        ],
        stakingLiveClaimed: false,
        rewardsPaidClaimed: false,
        governanceLiveClaimed: false,
      },
      evidence: "launch/evidence/pr-11-mcp-tools.json",
      notice: "No active staking, reward settlement, or governance claim is made in PR-11.",
    }),
  },
];

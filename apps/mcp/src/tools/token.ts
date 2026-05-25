import { TOOL_SCHEMAS } from "../schemas.js";
import type { GitCasterMcpTool } from "../tool-registry.js";

export const tokenTools: GitCasterMcpTool[] = [
  {
    name: "caster_token_info",
    description: "Return proof-only $CASTER metadata.",
    inputSchema: TOOL_SCHEMAS.caster_token_info,
    call: () => ({
      status: "proof-only",
      tool: "caster_token_info",
      result: {
        status: "proof-only",
        token: "$CASTER",
        tokenAddress: "0xa1db936b33cec552d453c21a44f7153777f6f5ee373e47680ab58fcc4efebe2f",
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

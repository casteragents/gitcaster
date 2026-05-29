import { createGitCasterClient } from "../../packages/sdk-typescript/src/index.js";

const client = createGitCasterClient({
  did: "did:caster:example",
});

const identity = client.identityShow();
const nodeHealth = await client.nodeHealth();
const token = client.tokenInfo();
const domain = client.domainStatus("gitcaster.caster");

console.log(
  JSON.stringify(
    {
      identity,
      nodeHealth,
      token: {
        symbol: token.ok ? token.value.symbol : "blocked",
        status: token.status,
      },
      domain,
      sendNetworkRequests: false,
      productionClaimed: false,
    },
    null,
    2
  )
);

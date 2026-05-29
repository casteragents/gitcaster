export type GitCasterApiMethod = "GET" | "POST";

export type GitCasterApiAuth =
  | {
      mode: "none";
    }
  | {
      mode: "server-agent-key";
      headerName: "Authorization";
      placeholderHeaderValue: "Bearer <server-side-api-key>";
      note: string;
    };

export type GitCasterApiRequestShape = {
  id: string;
  title: string;
  description: string;
  method: GitCasterApiMethod;
  path: string;
  auth: GitCasterApiAuth;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  send: false;
  status: "public-alpha";
  boundary: "local-fixture";
  safety: {
    noNetworkCall: true;
    noCredentialMaterial: true;
    proofRequiredBeforeLiveUse: true;
  };
};

export type GitCasterApiTutorialBundle = {
  format: "gitcaster.api-tutorials.v1";
  generatedAt: "1970-01-01T00:00:00.000Z";
  examples: GitCasterApiRequestShape[];
};

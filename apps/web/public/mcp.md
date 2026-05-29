# GitCaster MCP

Status: public-alpha source, alpha-local tools

The GitCaster MCP server is a local JSON-RPC stdio server for development and
proof planning. It lists 31 beta tools, blocks node-dependent tools without a
configured local node, blocks mutating tools without a signing identity, and
keeps endpoint-dependent tools in `requires-endpoint` or `requires-registry`
states.

Start local command shape:

```bash
gc mcp serve
```

Verification:

```bash
pnpm run mcp:check
```

This public repo does not claim a public MCP gateway or production runtime.

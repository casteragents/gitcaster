import { PRODUCT } from "../lib/caster-copy";

const links = [
  ["/start", "Start"],
  ["/status", "Status"],
  ["/node", "Node"],
  ["/node/repos", "Repos"],
  ["/agents", "Agents"],
  ["/mcp", "MCP"],
  ["/ecosystem", "Ecosystem"],
  ["/playground", "Playground"],
  ["/security", "Security"],
  ["/console", "Console"],
  ["/docs", "Docs"],
  ["/architecture", "Architecture"],
  ["/deploy", "Deploy"],
  ["/token", "Token"],
  ["/domains", "Domains"],
  ["/roadmap", "Roadmap"]
];

export function CasterNav() {
  return (
    <nav className="nav" aria-label="GitCaster navigation">
      <a className="brand" href="/">
        <span className="brand-mark">gc</span>
        <span>{PRODUCT.name}</span>
      </a>
      <div className="nav-links">
        {links.map(([href, label]) => (
          <a href={href} key={href}>{label}</a>
        ))}
      </div>
    </nav>
  );
}

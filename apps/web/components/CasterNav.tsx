import { PRODUCT } from "../lib/caster-copy";
import { sitePath } from "../lib/site-url";

const links = [
  ["/start", "Start"],
  ["/status", "Status"],
  ["/node", "Node"],
  ["/node/repos", "Repos"],
  ["/agents", "Agents"],
  ["/mcp", "MCP"],
  ["/ecosystem", "Ecosystem"],
  ["/open-source", "Open Core"],
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
      <a className="brand" href={sitePath("/")}>
        <span className="brand-mark">gc</span>
        <span>{PRODUCT.name}</span>
      </a>
      <div className="nav-links">
        {links.map(([href, label]) => (
          <a href={sitePath(href)} key={href}>{label}</a>
        ))}
      </div>
    </nav>
  );
}

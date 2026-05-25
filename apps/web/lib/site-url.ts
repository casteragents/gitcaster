const configuredBasePath =
  process.env.NEXT_PUBLIC_GITCASTER_BASE_PATH ||
  process.env.GITCASTER_PAGES_BASE_PATH ||
  "";

export const siteBasePath = configuredBasePath.replace(/\/+$/, "");

export function sitePath(path = "/") {
  if (!path || path === "/") return siteBasePath || "/";
  if (path.startsWith("#")) return path;
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path;

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteBasePath}${normalized}`;
}

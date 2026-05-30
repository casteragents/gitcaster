import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));
const pagesBasePath = process.env.GITCASTER_PAGES_BASE_PATH || "";
const distDir = process.env.GITCASTER_NEXT_DIST_DIR || ".next-gitcaster";

const nextConfig = {
  output: "export",
  distDir,
  trailingSlash: true,
  ...(pagesBasePath
    ? {
        basePath: pagesBasePath,
        assetPrefix: `${pagesBasePath}/`
      }
    : {}),
  turbopack: {
    root: appRoot
  },
  experimental: {
    cpus: 1,
    webpackBuildWorker: false,
    workerThreads: true
  },
  images: {
    unoptimized: true
  },
  webpack(config) {
    config.cache = false;
    return config;
  }
};

export default nextConfig;

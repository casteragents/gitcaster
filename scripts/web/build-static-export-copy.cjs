#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");

const repoRoot = path.resolve(__dirname, "../..");
const appRoot = path.join(repoRoot, "apps/web");
const useInPlaceBuild = process.env.GITCASTER_WEB_BUILD_IN_PLACE !== "0";
const workRoot = useInPlaceBuild ? appRoot : path.join(appRoot, `.next-codex-web-build-${process.pid}`);
const nextBin = path.join(appRoot, "node_modules/next/dist/bin/next");
const outSource = useInPlaceBuild ? path.join(appRoot, ".next-codex-export-out") : path.join(workRoot, "out");
const distDirExportSource = path.join(workRoot, ".next-gitcaster");
const outTarget = path.join(appRoot, "out");
const docsTarget = path.join(repoRoot, "docs");
const docsSourceSecurity = path.join(repoRoot, "docs-source", "security");
const generatedAppHtml = path.join(workRoot, ".next/server/app");
const generatedStatic = path.join(workRoot, ".next/static");

const copyEntries = [
  "app",
  "components",
  "lib",
  "public",
  "styles",
  "next.config.mjs",
  "package.json",
  "tsconfig.json"
];

function copyIntoWorktree(rel) {
  const source = path.join(appRoot, rel);
  const target = path.join(workRoot, rel);
  if (!fs.existsSync(source)) {
    return;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true, force: true, dereference: false });
}

function copyOut(source, target) {
  if (!fs.existsSync(source)) {
    throw new Error(`static export output missing: ${source}`);
  }
  try {
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`warning: could not fully clear ${path.relative(repoRoot, target)} before copy; overlaying static export: ${message}`);
  }
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(source, target, { recursive: true, force: true });
}

function runNextBuild() {
  if (!fs.existsSync(nextBin)) {
    throw new Error(`Next.js CLI missing: ${nextBin}`);
  }
  const result = cp.spawnSync(process.execPath, [nextBin, "build", "--webpack"], {
    cwd: workRoot,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      GITCASTER_PAGES_BASE_PATH: process.env.GITCASTER_PAGES_BASE_PATH || "/gitcaster",
      NEXT_PUBLIC_GITCASTER_BASE_PATH: process.env.NEXT_PUBLIC_GITCASTER_BASE_PATH || "/gitcaster"
    },
    stdio: "inherit",
    timeout: 600000
  });
  if (result.error) {
    throw result.error;
  }
  return result.status || 0;
}

function materializeFromServerApp() {
  if (!fs.existsSync(generatedAppHtml)) {
    throw new Error(`Next generated app HTML missing: ${generatedAppHtml}`);
  }
  fs.rmSync(outSource, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
  fs.mkdirSync(outSource, { recursive: true });

  const htmlFiles = [];
  const stack = [generatedAppHtml];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
      } else if (entry.name.endsWith(".html")) {
        htmlFiles.push(path.relative(generatedAppHtml, abs).replaceAll("\\", "/"));
      }
    }
  }
  htmlFiles
    .sort();
  if (!htmlFiles.includes("index.html") || !htmlFiles.includes("ecosystem.html")) {
    throw new Error(`generated app HTML is incomplete: ${htmlFiles.join(", ")}`);
  }

  for (const file of htmlFiles) {
    const base = file.slice(0, -".html".length).replaceAll("/", path.sep);
    const routeOut = base === "index"
      ? path.join(outSource, "index.html")
      : path.join(outSource, base, "index.html");
    fs.mkdirSync(path.dirname(routeOut), { recursive: true });
    fs.copyFileSync(path.join(generatedAppHtml, file), routeOut);
  }

  const publicDir = path.join(workRoot, "public");
  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, outSource, { recursive: true, force: true });
  }
  if (fs.existsSync(generatedStatic)) {
    fs.mkdirSync(path.join(outSource, "_next"), { recursive: true });
    fs.cpSync(generatedStatic, path.join(outSource, "_next/static"), { recursive: true, force: true });
  }
}

fs.mkdirSync(workRoot, { recursive: true });
if (!useInPlaceBuild) {
  for (const rel of copyEntries) {
    copyIntoWorktree(rel);
  }
}

const nextStatus = process.env.GITCASTER_WEB_SKIP_NEXT_BUILD === "1" ? 0 : runNextBuild();
if (nextStatus !== 0) {
  if (fs.existsSync(generatedAppHtml)) {
    materializeFromServerApp();
  } else {
    process.exit(nextStatus);
  }
}
if (fs.existsSync(generatedAppHtml)) {
  materializeFromServerApp();
}
copyOut(fs.existsSync(outSource) ? outSource : distDirExportSource, outTarget);
fs.writeFileSync(path.join(outTarget, ".nojekyll"), "");
copyOut(outTarget, docsTarget);
fs.writeFileSync(path.join(docsTarget, ".nojekyll"), "");
if (fs.existsSync(docsSourceSecurity)) {
  fs.cpSync(docsSourceSecurity, path.join(docsTarget, "security"), { recursive: true, force: true });
}

console.log(JSON.stringify({
  status: "passed",
  nextBuildExitStatus: nextStatus,
  materializedFromServerApp: nextStatus !== 0,
  workRoot: path.relative(repoRoot, workRoot).replaceAll("\\", "/"),
  output: "apps/web/out",
  pagesOutput: "docs"
}, null, 2));
process.exit(0);

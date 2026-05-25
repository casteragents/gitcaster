export const LEGACY_PLATFORM_NAMES = [
  "vercel.json",
  "Vercel",
  "Supabase",
  "Cloudflare",
  "Fly",
  "Render",
  "Netlify",
  "Pinata",
  "IPFS",
  "Filecoin",
  "Arweave",
  "GitHub Actions as only proof gate",
  "GitHub as canonical source"
];

export function detectLegacyPlatformReferences(inputPath: string, textOrName = inputPath): string[] {
  const haystack = `${inputPath}\n${textOrName}`;
  return LEGACY_PLATFORM_NAMES.filter((name) => new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(haystack));
}

export function classifyLegacyPlatform(inputPath: string): "legacy-reference" | "production-risk" | "none" {
  const hits = detectLegacyPlatformReferences(inputPath);
  if (hits.length === 0) return "none";
  return "legacy-reference";
}

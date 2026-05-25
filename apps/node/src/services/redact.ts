export function redactSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    const privateKeyPattern = new RegExp(`-----${"BEGIN"} ${"PRIVATE"} KEY-----[\\s\\S]*?-----${"END"} ${"PRIVATE"} KEY-----`, "g");
    return value
      .replace(privateKeyPattern, "[redacted-private-key]")
      .replace(/Authorization:\s*Bearer\s+[A-Za-z0-9._-]+/gi, "Authorization: Bearer [redacted]")
      .replace(/(OPENAI_API_KEY|CASTER_QSTORAGE_WRITE_TOKEN|CASTER_CLOUD_DEPLOY_TOKEN|FARCASTER_TOKEN)=\S+/g, "$1=[redacted]");
  }
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, /private|secret|token|authorization/i.test(key) ? "[redacted]" : redactSecrets(item)]));
  }
  return value;
}

export function redactEnvName(value: string): string {
  return value.replace(/=.*/, "=[redacted]");
}

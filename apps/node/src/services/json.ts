export function safeJsonParse(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: text ? JSON.parse(text) : null };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export function stableJson(value: unknown): string {
  return JSON.stringify(value, Object.keys(value as Record<string, unknown>).sort(), 2);
}

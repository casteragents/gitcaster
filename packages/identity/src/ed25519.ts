import { createHash, generateKeyPairSync, sign, verify } from "node:crypto";

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function generateEd25519KeyPair(): { publicKeyPem: string; privateKeyPem: string } {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKeyPem: publicKey, privateKeyPem: privateKey };
}

export function signEd25519(privateKeyPem: string, message: string | Uint8Array): string {
  const bytes = typeof message === "string" ? Buffer.from(message) : Buffer.from(message);
  return toBase64Url(sign(null, bytes, privateKeyPem));
}

export function verifyEd25519(publicKeyPem: string, message: string | Uint8Array, signature: string): boolean {
  const bytes = typeof message === "string" ? Buffer.from(message) : Buffer.from(message);
  try {
    return verify(null, bytes, publicKeyPem, fromBase64Url(signature));
  } catch {
    return false;
  }
}

export function publicKeyFingerprint(publicKeyPem: string): string {
  return toBase58Btc(createHash("sha256").update(publicKeyPem).digest());
}

export function toBase64Url(input: Uint8Array | Buffer): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function fromBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(`${normalized}${pad}`, "base64");
}

export function toBase58Btc(input: Uint8Array | Buffer): string {
  const bytes = Buffer.from(input);
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros += 1;
  let value = BigInt(`0x${bytes.toString("hex") || "0"}`);
  let encoded = "";
  while (value > 0n) {
    const mod = Number(value % 58n);
    encoded = BASE58_ALPHABET[mod] + encoded;
    value /= 58n;
  }
  return `z${"1".repeat(zeros)}${encoded || "1"}`;
}

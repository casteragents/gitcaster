import fs from "node:fs";
import path from "node:path";

export interface NonceStore {
  has(nonce: string): boolean;
  add(nonce: string): void;
  checkAndAdd(nonce: string): boolean;
}

export class MemoryNonceStore implements NonceStore {
  private readonly seen = new Set<string>();

  has(nonce: string): boolean {
    return this.seen.has(nonce);
  }

  add(nonce: string): void {
    this.seen.add(nonce);
  }

  checkAndAdd(nonce: string): boolean {
    if (this.has(nonce)) return false;
    this.add(nonce);
    return true;
  }
}

export class FileNonceStore implements NonceStore {
  constructor(private readonly filePath: string) {}

  private read(): Set<string> {
    if (!fs.existsSync(this.filePath)) return new Set();
    return new Set(JSON.parse(fs.readFileSync(this.filePath, "utf8")) as string[]);
  }

  private write(values: Set<string>): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, `${JSON.stringify([...values].sort(), null, 2)}\n`);
  }

  has(nonce: string): boolean {
    return this.read().has(nonce);
  }

  add(nonce: string): void {
    const values = this.read();
    values.add(nonce);
    this.write(values);
  }

  checkAndAdd(nonce: string): boolean {
    const values = this.read();
    if (values.has(nonce)) return false;
    values.add(nonce);
    this.write(values);
    return true;
  }
}

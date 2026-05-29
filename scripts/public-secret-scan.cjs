#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const allowDummy = (text) => /abcdefghijklmnop|REDACTED|CHANGE_ME|REPLACE_ME|placeholder|example|YOUR_|your-|fixture|dummy|test-only|fake-|not a real|secret-token-value|castercloud-secret-token|tokenAddress/i.test(text);
const patterns = [
  ['github-token', /\bghp_[A-Za-z0-9]{20,}\b/g],
  ['openai-key', /\bsk-[A-Za-z0-9_-]{20,}\b/g],
  ['private-key-block', /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g],
  ['bearer-token', /Authorization:\s*Bearer\s+(?!abcdefghijklmnop\b)[A-Za-z0-9._-]{24,}/gi],
  ['env-secret-literal', /^\s*[A-Z0-9_]*(?:API[_-]?KEY|SECRET|TOKEN|PASSWORD|PRIVATE[_-]?KEY|MNEMONIC|SEED)[A-Z0-9_]*\s*[:=]\s*['\"]([^'\"]{20,})['\"]/gmi],
  ['hardcoded-secret-literal', /\b(apiKey|secret|password|privateKey|walletKey|mnemonic|seedPhrase)\b\s*[:=]\s*['\"]([^'\"]{24,}|0x[a-fA-F0-9]{64})['\"]/g]
];
const findings = [];
const skippedDirs = new Set(['.git','node_modules','.next','dist','out']);
function rel(p){ return path.relative(root,p).replaceAll('\\','/'); }
function walk(dir){
  for (const e of fs.readdirSync(dir,{withFileTypes:true})){
    const full = path.join(dir,e.name);
    if (e.isDirectory()) {
      if (skippedDirs.has(e.name)) continue;
      if (e.name === '_next' && /(?:^|[\\/])docs(?:[\\/]|$)/.test(full)) continue;
      walk(full);
      continue;
    }
    if (!e.isFile() || !/\.(cjs|css|html|js|json|jsx|md|mjs|ts|tsx|txt|yml|yaml|gitignore)$/i.test(e.name)) continue;
    const text = fs.readFileSync(full,'utf8');
    for (const [rule, rx] of patterns){
      rx.lastIndex=0;
      for (const match of text.matchAll(rx)) {
        const matched = match[0] || '';
        if (allowDummy(matched)) continue;
        findings.push({rule,path:rel(full)});
      }
    }
  }
}
walk(root);
if (findings.length){ console.error(JSON.stringify({status:'failed', findings}, null, 2)); process.exit(1); }
console.log(JSON.stringify({status:'passed', findings:0}, null, 2));
process.exit(0);

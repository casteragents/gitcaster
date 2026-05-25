#!/usr/bin/env node
import { check, finish } from "./_stable-check-utils.mjs";

const required = [
  "XXX_STORAGE_DRIVER",
  "DATABASE_URL",
  "XXX_SESSION_SECRET",
  "XXX_INTERNAL_API_SECRET",
  "CRON_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID",
  "CASTER_A1_PROVIDER_API_KEY",
  "CASTER_A1_HWID_LOCK_PEPPER",
  "CASTER_A1_API_KEY_HASH_PEPPER",
];

const missing = required.filter((name) => !String(process.env[name] || "").trim());
finish("stable-env.json", [
  check(missing.length === 0, "Required production env vars are present", missing.length ? `Missing: ${missing.join(", ")}` : "All required env vars are present."),
  check(process.env.CRON_SECRET && process.env.CRON_SECRET === process.env.XXX_INTERNAL_API_SECRET, "CRON_SECRET matches XXX_INTERNAL_API_SECRET", "Vercel Cron must authenticate with the same shared secret."),
  check(!process.env.NEXT_PUBLIC_OPENAI_API_KEY && !process.env.NEXT_PUBLIC_CASTER_A1_PROVIDER_API_KEY, "Provider keys are not public env vars", "Provider keys must stay server-side."),
]);

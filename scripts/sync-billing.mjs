#!/usr/bin/env node
import { createHash } from "node:crypto";
import { copyFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "agent/src/billing.ts");
const dest = path.join(root, "web/src/server/billing.ts");

const mode = process.argv[2] || "check";

function hash(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

if (mode === "sync") {
  copyFileSync(source, dest);
  console.log("Synced agent/src/billing.ts → web/src/server/billing.ts");
  process.exit(0);
}

const a = hash(source);
const b = hash(dest);
if (a !== b) {
  console.error(
    "Billing modules are out of sync.\nRun: node scripts/sync-billing.mjs sync",
  );
  process.exit(1);
}
console.log("Billing modules in sync");

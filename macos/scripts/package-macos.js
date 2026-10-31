#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const repoRoot = path.resolve(root, "..");
const outDir = path.join(repoRoot, "web", "public", "downloads");
const stage = path.join(root, "dist", "Mac Coding Agent.app");
const contents = path.join(stage, "Contents");
const macosDir = path.join(contents, "MacOS");
const resources = path.join(contents, "Resources");
const zipPath = path.join(outDir, "MacCodingAgent-macOS.zip");

fs.rmSync(path.join(root, "dist"), { recursive: true, force: true });
fs.mkdirSync(macosDir, { recursive: true });
fs.mkdirSync(resources, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>Mac Coding Agent</string>
  <key>CFBundleDisplayName</key>
  <string>Mac Coding Agent</string>
  <key>CFBundleIdentifier</key>
  <string>com.lightllm.MacCodingAgent</string>
  <key>CFBundleVersion</key>
  <string>1.0.0</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
  <key>CFBundleExecutable</key>
  <string>MacCodingAgent</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
`;

const launcher = `#!/bin/bash
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RESOURCES="$APP_DIR/Resources"
REPO="$RESOURCES/app"

export MCA_SKIP_BOOTSTRAP="\${MCA_SKIP_BOOTSTRAP:-0}"
export MCA_WEB_URL="\${MCA_WEB_URL:-http://127.0.0.1:3000}"
export MCA_AGENT_URL="\${MCA_AGENT_URL:-http://127.0.0.1:8787}"

if command -v npm >/dev/null 2>&1 && [[ -f "$REPO/package.json" ]]; then
  # Prefer Electron if installed; otherwise open the web UI after starting services.
  if [[ -x "$RESOURCES/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron" ]]; then
    exec "$RESOURCES/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron" "$RESOURCES"
  fi
  if [[ -x "$RESOURCES/node_modules/.bin/electron" ]]; then
    cd "$RESOURCES"
    exec ./node_modules/.bin/electron .
  fi
fi

# Fallback: open hosted/local web UI in Safari/Chrome
open "$MCA_WEB_URL/download" || open "$MCA_WEB_URL"
`;

const startScript = `#!/bin/bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
open "$DIR/Mac Coding Agent.app" 2>/dev/null || bash "$DIR/Mac Coding Agent.app/Contents/MacOS/MacCodingAgent"
`;

const readme = `# Mac Coding Agent for macOS

1. Keep this folder next to the cloned MacCodingAgent repo **or** install dependencies inside Resources.
2. Double-click \`Mac Coding Agent.app\` (right-click → Open the first time if Gatekeeper warns).
3. Or run: \`./start-mac-coding-agent.sh\`
4. Buy Pro on the Pricing page (Stripe) to unlock updates / keep your license.

The desktop shell boots the local agent (:8787) + web dashboard (:3000) when Node/npm are available.
`;

fs.writeFileSync(path.join(contents, "Info.plist"), infoPlist);
fs.writeFileSync(path.join(macosDir, "MacCodingAgent"), launcher, { mode: 0o755 });
fs.chmodSync(path.join(macosDir, "MacCodingAgent"), 0o755);

// Bundle electron shell sources into Resources
fs.mkdirSync(path.join(resources, "src"), { recursive: true });
fs.copyFileSync(path.join(root, "src", "main.js"), path.join(resources, "src", "main.js"));
fs.copyFileSync(path.join(root, "src", "preload.js"), path.join(resources, "src", "preload.js"));
fs.copyFileSync(path.join(root, "package.json"), path.join(resources, "package.json"));

// Lightweight pointer to monorepo for local developers
fs.writeFileSync(
  path.join(resources, "app-path.json"),
  JSON.stringify({ repoHint: "Place alongside MacCodingAgent repo root" }, null, 2),
);

const bundleRoot = path.join(root, "dist");
fs.writeFileSync(path.join(bundleRoot, "README-macOS.txt"), readme);
fs.writeFileSync(path.join(bundleRoot, "start-mac-coding-agent.sh"), startScript, {
  mode: 0o755,
});
fs.chmodSync(path.join(bundleRoot, "start-mac-coding-agent.sh"), 0o755);

if (fs.existsSync(zipPath)) fs.rmSync(zipPath);
execSync(`cd "${bundleRoot}" && zip -r "${zipPath}" "Mac Coding Agent.app" README-macOS.txt start-mac-coding-agent.sh`, {
  stdio: "inherit",
});

const bytes = fs.statSync(zipPath).size;
console.log(`Created ${zipPath} (${bytes} bytes)`);

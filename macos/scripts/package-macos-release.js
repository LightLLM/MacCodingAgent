#!/usr/bin/env node
/**
 * Builds a Mac Mini–ready Mac Coding Agent installer zip.
 * Ships the .app + embedded agent UI; Electron is fetched on first launch
 * for the machine’s arch (arm64/x64) so the download stays GitHub-friendly.
 */
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ELECTRON_VERSION = "33.2.1";
const ROOT = path.resolve(__dirname, "..");
const REPO = path.resolve(ROOT, "..");
const DESKTOP = path.join(ROOT, "desktop");
const DIST = path.join(ROOT, "dist-release");
const OUT_DIR = path.join(REPO, "web", "public", "downloads");
const ZIP_NAME = "MacCodingAgent-macOS-latest.zip";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function write(filePath, contents, mode) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents);
  if (mode) fs.chmodSync(filePath, mode);
}

function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true, force: true });
}

function buildAppBundle() {
  const appRoot = path.join(DIST, "Mac Coding Agent.app");
  const contents = path.join(appRoot, "Contents");
  const macos = path.join(contents, "MacOS");
  const resources = path.join(contents, "Resources");

  fs.rmSync(DIST, { recursive: true, force: true });
  ensureDir(macos);
  ensureDir(resources);

  write(
    path.join(contents, "Info.plist"),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Mac Coding Agent</string>
  <key>CFBundleDisplayName</key><string>Mac Coding Agent</string>
  <key>CFBundleIdentifier</key><string>com.lightllm.MacCodingAgent</string>
  <key>CFBundleVersion</key><string>1.0.0</string>
  <key>CFBundleShortVersionString</key><string>1.0.0</string>
  <key>CFBundleExecutable</key><string>MacCodingAgent</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
`,
  );

  const launcher = `#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RESOURCES="$ROOT/Resources"
APP_DIR="$RESOURCES/app"
SUPPORT="$HOME/Library/Application Support/MacCodingAgent"
ELECTRON_VERSION="${ELECTRON_VERSION}"
ARCH="$(uname -m)"

if [[ "$ARCH" == "arm64" ]]; then
  EARCH="arm64"
elif [[ "$ARCH" == "x86_64" ]]; then
  EARCH="x64"
else
  osascript -e 'display alert "Mac Coding Agent" message "Unsupported Mac architecture."'
  exit 1
fi

RUNTIME_DIR="$SUPPORT/electron-v$ELECTRON_VERSION-darwin-$EARCH"
ELECTRON_BIN="$RUNTIME_DIR/Electron.app/Contents/MacOS/Electron"
ZIP_NAME="electron-v$ELECTRON_VERSION-darwin-$EARCH.zip"
ZIP_PATH="$SUPPORT/$ZIP_NAME"
URL="https://github.com/electron/electron/releases/download/v$ELECTRON_VERSION/$ZIP_NAME"

mkdir -p "$SUPPORT"
xattr -dr com.apple.quarantine "$ROOT" 2>/dev/null || true

if [[ ! -x "$ELECTRON_BIN" ]]; then
  osascript -e 'display notification "Downloading Electron runtime for your Mac…" with title "Mac Coding Agent"'
  echo "Downloading Electron $ELECTRON_VERSION ($EARCH)…"
  curl -L --fail --progress-bar -o "$ZIP_PATH" "$URL"
  rm -rf "$RUNTIME_DIR"
  mkdir -p "$RUNTIME_DIR"
  unzip -qo "$ZIP_PATH" -d "$RUNTIME_DIR"
  xattr -dr com.apple.quarantine "$RUNTIME_DIR" 2>/dev/null || true
  rm -f "$ZIP_PATH"
fi

if [[ ! -x "$ELECTRON_BIN" ]]; then
  osascript -e 'display alert "Mac Coding Agent" message "Failed to install Electron runtime. Check your network and try again."'
  exit 1
fi

exec "$ELECTRON_BIN" "$APP_DIR"
`;

  write(path.join(macos, "MacCodingAgent"), launcher, 0o755);
  copyDir(DESKTOP, path.join(resources, "app"));
  return appRoot;
}

function main() {
  ensureDir(OUT_DIR);
  buildAppBundle();

  write(
    path.join(DIST, "Install Mac Coding Agent.command"),
    `#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
APP="Mac Coding Agent.app"
DEST="/Applications/Mac Coding Agent.app"

echo "========================================"
echo " Mac Coding Agent — Mac Mini installer"
echo "========================================"
echo
echo "Installing to /Applications…"
rm -rf "$DEST"
cp -R "$APP" "$DEST"
xattr -dr com.apple.quarantine "$DEST" 2>/dev/null || true
chmod +x "$DEST/Contents/MacOS/MacCodingAgent"

echo
echo "Installed."
echo "First launch downloads the Electron runtime for your chip (Apple Silicon or Intel)."
echo "Opening Mac Coding Agent…"
open "$DEST"
`,
    0o755,
  );

  write(
    path.join(DIST, "README-INSTALL-MAC-MINI.txt"),
    `Mac Coding Agent — macOS latest (Mac Mini)
==========================================

Requirements
- macOS 13 Ventura or later (Sonoma / Sequoia supported)
- Apple Silicon Mac Mini (M1/M2/M3/M4) or Intel Mac Mini
- Internet once (first launch downloads Electron ~90MB)

Install
1. Unzip MacCodingAgent-macOS-latest.zip
2. Double-click "Install Mac Coding Agent.command"
3. If Gatekeeper warns: right-click → Open → Open
4. Wait for first-run runtime download, then the desktop app opens

Manual
- Drag "Mac Coding Agent.app" to /Applications
- Right-click → Open the first time

What you get
- Native desktop window on your Mac Mini
- Embedded local coding agent on localhost
- Offline stub model; optional Ollama for open-source models

Version: 1.0.0
`,
  );

  // Also include a no-sudo "Open here" helper
  write(
    path.join(DIST, "Open Without Installing.command"),
    `#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
xattr -dr com.apple.quarantine "Mac Coding Agent.app" 2>/dev/null || true
open "Mac Coding Agent.app"
`,
    0o755,
  );

  const zipPath = path.join(OUT_DIR, ZIP_NAME);
  const legacyPath = path.join(OUT_DIR, "MacCodingAgent-macOS.zip");
  for (const p of [zipPath, legacyPath]) {
    if (fs.existsSync(p)) fs.rmSync(p);
  }
  execSync(
    `cd "${DIST}" && zip -ry "${zipPath}" "Mac Coding Agent.app" "Install Mac Coding Agent.command" "Open Without Installing.command" "README-INSTALL-MAC-MINI.txt"`,
    { stdio: "inherit" },
  );
  fs.copyFileSync(zipPath, legacyPath);
  const kb = (fs.statSync(zipPath).size / 1024).toFixed(1);
  console.log(`\nCreated ${zipPath} (${kb} KB)`);
}

main();

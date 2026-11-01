#!/usr/bin/env bash
# End-to-end macOS desktop proof script.
# Runs on GitHub Actions macos-latest (real macOS) and on a Mac Mini.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PROOF_DIR="$ROOT/docs/proof"
ZIP="$ROOT/web/public/downloads/MacCodingAgent-macOS-latest.zip"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/mca-macos-e2e.XXXXXX")"

mkdir -p "$PROOF_DIR"
cd "$ROOT"
rm -f "$PROOF_DIR/macos-e2e-port.txt"

echo "==> Platform"
uname -a
sw_vers 2>/dev/null || true
node -v

echo "==> Unit tests (desktop server)"
node macos/desktop/server.unit.test.js

echo "==> Validate package"
node macos/scripts/validate-macos-package.js

echo "==> Unpack app"
unzip -qo "$ZIP" -d "$WORK"
APP="$WORK/Mac Coding Agent.app"
APP_RESOURCES="$APP/Contents/Resources/app"
test -f "$APP_RESOURCES/server.js"

echo "==> Start embedded agent API"
export PROOF_DIR
(
  cd "$APP_RESOURCES"
  node -e '
    const fs = require("fs");
    const path = require("path");
    const { createServer } = require("./server");
    const proof = process.env.PROOF_DIR;
    (async () => {
      const { port } = await createServer(8789);
      fs.writeFileSync(path.join(proof, "macos-e2e-port.txt"), String(port));
      console.log("listening", port);
    })();
  '
) &
API_PID=$!

for _ in $(seq 1 40); do
  if [[ -f "$PROOF_DIR/macos-e2e-port.txt" ]]; then break; fi
  sleep 0.25
done
test -f "$PROOF_DIR/macos-e2e-port.txt"
PORT="$(cat "$PROOF_DIR/macos-e2e-port.txt")"

echo "==> Health on :$PORT"
curl -fsS "http://127.0.0.1:${PORT}/api/health" | tee "$PROOF_DIR/macos-e2e-health.json"
grep -q "Mac Coding Agent" "$PROOF_DIR/macos-e2e-health.json"

echo "==> Chat e2e"
SESSION_JSON="$(curl -fsS -X POST "http://127.0.0.1:${PORT}/api/sessions" \
  -H 'content-type: application/json' \
  -d '{"title":"macOS e2e"}')"
SID="$(node -e 'const s=JSON.parse(process.argv[1]); process.stdout.write(s.session.id)' "$SESSION_JSON")"
curl -fsS -X POST "http://127.0.0.1:${PORT}/api/sessions/${SID}/chat" \
  -H 'content-type: application/json' \
  -d '{"content":"hello from macOS e2e"}' | tee "$PROOF_DIR/macos-e2e-chat.json"
grep -q "Mac Coding Agent" "$PROOF_DIR/macos-e2e-chat.json"

ELECTRON_OK="false"
ELECTRON_NOTE="Not Darwin — API/package proof only"

if [[ "$(uname -s)" == "Darwin" ]]; then
  echo "==> Real macOS: bootstrap Electron and launch desktop app"
  ARCH="$(uname -m)"
  if [[ "$ARCH" == "arm64" ]]; then EARCH=arm64; else EARCH=x64; fi
  EV=33.2.1
  SUPPORT="${HOME}/Library/Application Support/MacCodingAgent-ci"
  mkdir -p "$SUPPORT"
  ZIP_E="$SUPPORT/electron-v${EV}-darwin-${EARCH}.zip"
  RUNTIME="$SUPPORT/electron-v${EV}-darwin-${EARCH}"
  ELECTRON_BIN="$RUNTIME/Electron.app/Contents/MacOS/Electron"

  if [[ ! -x "$ELECTRON_BIN" ]]; then
    curl -L --fail -o "$ZIP_E" \
      "https://github.com/electron/electron/releases/download/v${EV}/electron-v${EV}-darwin-${EARCH}.zip"
    rm -rf "$RUNTIME"
    mkdir -p "$RUNTIME"
    unzip -qo "$ZIP_E" -d "$RUNTIME"
    xattr -dr com.apple.quarantine "$RUNTIME" 2>/dev/null || true
  fi

  if [[ -x "$ELECTRON_BIN" ]]; then
    MCA_PORT=8790 "$ELECTRON_BIN" "$APP_RESOURCES" \
      >"$PROOF_DIR/macos-electron-launch.log" 2>&1 &
    ELEC_PID=$!
    sleep 6
    if kill -0 "$ELEC_PID" 2>/dev/null; then
      if curl -fsS "http://127.0.0.1:8790/api/health" \
        >"$PROOF_DIR/macos-electron-health.json"; then
        ELECTRON_OK="true"
        ELECTRON_NOTE="Electron launched on Darwin; /api/health OK"
      else
        ELECTRON_NOTE="Electron alive but health probe failed"
      fi
      # Capture a screenshot on real macOS if screencapture exists
      if command -v screencapture >/dev/null 2>&1; then
        screencapture -x "$PROOF_DIR/macos-desktop-screenshot.png" || true
      fi
      kill "$ELEC_PID" 2>/dev/null || true
      wait "$ELEC_PID" 2>/dev/null || true
    else
      ELECTRON_NOTE="Electron exited early"
      cat "$PROOF_DIR/macos-electron-launch.log" || true
    fi
  else
    ELECTRON_NOTE="Electron binary missing after download"
  fi
fi

kill "$API_PID" 2>/dev/null || true
wait "$API_PID" 2>/dev/null || true

PROOF_DIR="$PROOF_DIR" ELECTRON_OK="$ELECTRON_OK" ELECTRON_NOTE="$ELECTRON_NOTE" node <<'NODE'
const fs = require("fs");
const path = require("path");
const proof = process.env.PROOF_DIR;
const health = JSON.parse(fs.readFileSync(path.join(proof, "macos-e2e-health.json"), "utf8"));
const chat = JSON.parse(fs.readFileSync(path.join(proof, "macos-e2e-chat.json"), "utf8"));
const report = {
  ok: true,
  platform: process.platform,
  arch: process.arch,
  electronLaunch: process.env.ELECTRON_OK === "true",
  electronNote: process.env.ELECTRON_NOTE,
  health,
  chatPreview: String(chat.reply || "").slice(0, 180),
  timestamp: new Date().toISOString(),
};
fs.writeFileSync(path.join(proof, "macos-e2e-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
NODE

echo "PASS macos-e2e.sh"
echo "Report: $PROOF_DIR/macos-e2e-report.json"

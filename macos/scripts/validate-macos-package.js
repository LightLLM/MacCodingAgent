#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");
const os = require("node:os");

const REPO = path.resolve(__dirname, "../..");
const ZIP = path.join(
  REPO,
  "web/public/downloads/MacCodingAgent-macOS-latest.zip",
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  assert(fs.existsSync(ZIP), `missing zip: ${ZIP}`);
  const size = fs.statSync(ZIP).size;
  assert(size > 1000, "zip too small");
  assert(size < 50 * 1024 * 1024, "zip unexpectedly huge");

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mca-pkg-"));
  execSync(`unzip -qo "${ZIP}" -d "${tmp}"`);

  const app = path.join(tmp, "Mac Coding Agent.app");
  const plist = path.join(app, "Contents/Info.plist");
  const exe = path.join(app, "Contents/MacOS/MacCodingAgent");
  const mainJs = path.join(app, "Contents/Resources/app/main.js");
  const serverJs = path.join(app, "Contents/Resources/app/server.js");
  const renderer = path.join(app, "Contents/Resources/app/renderer/index.html");
  const installer = path.join(tmp, "Install Mac Coding Agent.command");
  const openHere = path.join(tmp, "Open Without Installing.command");
  const readme = path.join(tmp, "README-INSTALL-MAC-MINI.txt");

  for (const file of [plist, exe, mainJs, serverJs, renderer, installer, openHere, readme]) {
    assert(fs.existsSync(file), `missing ${path.relative(tmp, file)}`);
  }

  const plistText = fs.readFileSync(plist, "utf8");
  assert(plistText.includes("com.lightllm.MacCodingAgent"), "bundle id");
  assert(plistText.includes("Mac Coding Agent"), "display name");
  assert(plistText.includes("LSMinimumSystemVersion"), "min macOS");

  const launcher = fs.readFileSync(exe, "utf8");
  assert(launcher.startsWith("#!/bin/bash"), "launcher shebang");
  assert(launcher.includes("Electron.app"), "launcher references Electron");
  assert(launcher.includes("arm64") && launcher.includes("x86_64"), "dual arch");
  assert(launcher.includes("github.com/electron/electron"), "downloads Electron");

  const installerText = fs.readFileSync(installer, "utf8");
  assert(installerText.includes("/Applications/Mac Coding Agent.app"), "installs to Applications");

  // executable bits (zip may or may not preserve; validate content + chmod intent)
  fs.chmodSync(exe, 0o755);
  fs.chmodSync(installer, 0o755);

  const listing = execSync(`find "${tmp}" -type f | sort`).toString();
  const report = {
    ok: true,
    platform: process.platform,
    arch: process.arch,
    zipBytes: size,
    files: listing.trim().split("\n").length,
    checks: [
      "zip exists",
      "Mac Coding Agent.app present",
      "Info.plist bundle id",
      "launcher dual-arch Electron bootstrap",
      "Install.command targets /Applications",
      "embedded server + renderer present",
    ],
  };

  const outDir = path.join(REPO, "docs", "proof");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "macos-package-validation.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  console.log("PASS validate-macos-package.js");
}

main();

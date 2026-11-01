const { app, BrowserWindow, shell, Menu, dialog } = require("electron");
const path = require("node:path");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");

const ROOT = path.resolve(__dirname, "..", "..");
const AGENT_URL = process.env.MCA_AGENT_URL || "http://127.0.0.1:8787";
const WEB_URL = process.env.MCA_WEB_URL || "http://127.0.0.1:3000";

let mainWindow = null;
let agentProcess = null;
let webProcess = null;

function waitForUrl(url, attempts = 40) {
  return new Promise((resolve, reject) => {
    let left = attempts;
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(true);
      });
      req.on("error", () => {
        left -= 1;
        if (left <= 0) reject(new Error(`Timed out waiting for ${url}`));
        else setTimeout(tick, 500);
      });
    };
    tick();
  });
}

function startLocalStack() {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const env = {
    ...process.env,
    MCA_MODEL_PROVIDER: process.env.MCA_MODEL_PROVIDER || "ollama",
    MCA_PORT: "8787",
  };

  agentProcess = spawn(npmCmd, ["run", "dev", "-w", "@mac-coding-agent/agent"], {
    cwd: ROOT,
    env,
    stdio: "ignore",
    detached: false,
  });

  webProcess = spawn(npmCmd, ["run", "dev", "-w", "@mac-coding-agent/web"], {
    cwd: ROOT,
    env,
    stdio: "ignore",
    detached: false,
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: "Mac Coding Agent",
    backgroundColor: "#edf1f5",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(WEB_URL);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function buildMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        {
          label: "Enter License…",
          click: async () => {
            const result = await dialog.showMessageBox(mainWindow, {
              type: "info",
              buttons: ["Open Pricing", "OK"],
              defaultId: 0,
              message: "Mac Coding Agent Pro",
              detail:
                "Purchase or paste your MCA license from the Download page to unlock updates.",
            });
            if (result.response === 0) {
              mainWindow.loadURL(`${WEB_URL}/pricing`);
            }
          },
        },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    { role: "editMenu" },
    { role: "viewMenu" },
    {
      label: "Go",
      submenu: [
        {
          label: "Agent",
          click: () => mainWindow.loadURL(`${WEB_URL}/app`),
        },
        {
          label: "Download",
          click: () => mainWindow.loadURL(`${WEB_URL}/download`),
        },
        {
          label: "Pricing",
          click: () => mainWindow.loadURL(`${WEB_URL}/pricing`),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(async () => {
  buildMenu();
  const skipBoot = process.env.MCA_SKIP_BOOTSTRAP === "1";
  try {
    if (!skipBoot) {
      const healthOk = await waitForUrl(`${AGENT_URL}/api/health`, 4).catch(
        () => false,
      );
      if (!healthOk && fs.existsSync(path.join(ROOT, "package.json"))) {
        startLocalStack();
      }
    }
    await waitForUrl(WEB_URL, 60).catch(() => null);
  } catch {
    /* window still opens; user can retry */
  }
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  for (const child of [agentProcess, webProcess]) {
    if (child && !child.killed) {
      try {
        child.kill("SIGTERM");
      } catch {
        /* ignore */
      }
    }
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

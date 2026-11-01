const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const path = require("node:path");
const { createServer } = require("./server");

let mainWindow = null;
let api = null;

async function bootApi() {
  const preferred = Number(process.env.MCA_PORT || 8787);
  try {
    api = await createServer(preferred);
  } catch {
    api = await createServer(0);
  }
  return api.port;
}

function createWindow(port) {
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

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"), {
    query: { port: String(port) },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function buildMenu() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: app.name,
        submenu: [
          { role: "about" },
          { type: "separator" },
          {
            label: "Open Agent Dashboard",
            accelerator: "CmdOrCtrl+1",
            click: () => mainWindow?.webContents.send("navigate", "agent"),
          },
          {
            label: "Reload",
            role: "reload",
          },
          { type: "separator" },
          { role: "quit" },
        ],
      },
      { role: "editMenu" },
      { role: "viewMenu" },
      {
        label: "Help",
        submenu: [
          {
            label: "Mac Coding Agent on GitHub",
            click: () =>
              shell.openExternal("https://github.com/LightLLM/MacCodingAgent"),
          },
          {
            label: "About local install",
            click: () =>
              dialog.showMessageBox({
                type: "info",
                message: "Mac Coding Agent",
                detail:
                  "Running locally on this Mac Mini. The embedded agent listens on localhost and keeps coding sessions available offline with the stub model. Connect Ollama for open-source model inference.",
              }),
          },
        ],
      },
    ]),
  );
}

app.whenReady().then(async () => {
  buildMenu();
  const port = await bootApi();
  createWindow(port);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(port);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  try {
    api?.server?.close();
  } catch {
    /* ignore */
  }
});

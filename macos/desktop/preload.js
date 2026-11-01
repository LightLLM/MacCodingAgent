const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("macDesktop", {
  platform: process.platform,
  onNavigate: (cb) => ipcRenderer.on("navigate", (_e, target) => cb(target)),
});

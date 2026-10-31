const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("macCodingAgentDesktop", {
  platform: process.platform,
  isDesktop: true,
});

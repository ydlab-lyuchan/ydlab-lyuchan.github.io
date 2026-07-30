const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ydlabEditor", {
  getPaths: () => ipcRenderer.invoke("get-paths"),
  readData: (kind) => ipcRenderer.invoke("read-data", kind),
  saveData: (kind, payload) => ipcRenderer.invoke("save-data", kind, payload),
  pickImage: (options) => ipcRenderer.invoke("pick-image", options),
  resolveAssetUrl: (relativePath) =>
    ipcRenderer.invoke("resolve-asset-url", relativePath),
});

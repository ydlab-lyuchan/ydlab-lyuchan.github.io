const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const REPO_ROOT = path.resolve(__dirname, "../..");
const EDITER_ROOT = path.resolve(__dirname, "..");

const PATHS = {
  repoRoot: REPO_ROOT,
  equipmentJson: path.join(REPO_ROOT, "data/equipment.json"),
  casesJson: path.join(REPO_ROOT, "data/cases.json"),
  assetsDir: path.join(REPO_ROOT, "assets"),
  casesAssetsDir: path.join(REPO_ROOT, "assets/cases"),
};

const IMAGE_FILTERS = [
  { name: "Images", extensions: ["jpg", "jpeg", "png", "webp", "gif"] },
];

const DATA_FILES = {
  equipment: PATHS.equipmentJson,
  cases: PATHS.casesJson,
};

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function relativeAssetPath(absPath) {
  return toPosix(path.relative(REPO_ROOT, absPath));
}

function resolveInRepo(relativePath) {
  if (!relativePath) return null;
  const abs = path.resolve(REPO_ROOT, relativePath);
  const rel = path.relative(REPO_ROOT, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return abs;
}

async function uniqueDestPath(dir, filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let candidate = path.join(dir, filename);
  try {
    await fs.access(candidate);
  } catch {
    return candidate;
  }
  return path.join(dir, `${base}-${Date.now()}${ext}`);
}

function createWindow() {
  const preloadPath = path.join(__dirname, "preload.cjs");
  console.log("[editer] preload:", preloadPath);
  console.log("[editer] repo:", REPO_ROOT);
  console.log("[editer] ELECTRON_RUN_AS_NODE:", process.env.ELECTRON_RUN_AS_NODE || "(unset)");

  const win = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 860,
    minHeight: 600,
    title: "曜動科技 · 內容編輯器",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL("http://127.0.0.1:5173");
  } else {
    win.loadFile(path.join(EDITER_ROOT, "dist/index.html"));
  }

  win.webContents.on("did-finish-load", () => {
    win.webContents
      .executeJavaScript("typeof window.ydlabEditor")
      .then((t) => console.log("[editer] ydlabEditor type:", t))
      .catch((err) => console.error("[editer] check failed:", err));
  });
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "ydlab",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true,
    },
  },
]);

app.whenReady().then(() => {
  protocol.handle("ydlab", async (request) => {
    try {
      const url = new URL(request.url);
      // ydlab://asset/assets/foo.png → assets/foo.png
      const rel = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
      const abs = resolveInRepo(rel);
      if (!abs) return new Response("Forbidden", { status: 403 });
      return net.fetch(pathToFileURL(abs).href);
    } catch (err) {
      console.error("[editer] ydlab protocol:", err);
      return new Response("Not found", { status: 404 });
    }
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("get-paths", () => ({
  repoRoot: PATHS.repoRoot,
  equipmentJson: PATHS.equipmentJson,
  casesJson: PATHS.casesJson,
  assetsDir: PATHS.assetsDir,
  casesAssetsDir: PATHS.casesAssetsDir,
}));

ipcMain.handle("read-data", async (_event, kind) => {
  const filePath = DATA_FILES[kind];
  if (!filePath) throw new Error(`未知資料類型：${kind}`);
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
});

ipcMain.handle("save-data", async (_event, kind, payload) => {
  const filePath = DATA_FILES[kind];
  if (!filePath) throw new Error(`未知資料類型：${kind}`);
  const content = `${JSON.stringify(payload, null, 2)}\n`;
  await fs.writeFile(filePath, content, "utf8");
  return true;
});

ipcMain.handle("pick-image", async (_event, { target }) => {
  const destDir = target === "cases" ? PATHS.casesAssetsDir : PATHS.assetsDir;
  await fs.mkdir(destDir, { recursive: true });

  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: target === "cases" ? "選擇案例圖片" : "選擇器材圖片",
    properties: ["openFile"],
    filters: IMAGE_FILTERS,
  });

  if (canceled || !filePaths.length) return null;

  const src = filePaths[0];
  const dest = await uniqueDestPath(destDir, path.basename(src));
  await fs.copyFile(src, dest);
  return relativeAssetPath(dest);
});

ipcMain.handle("resolve-asset-url", async (_event, relativePath) => {
  const abs = resolveInRepo(relativePath);
  if (!abs) return null;
  try {
    await fs.access(abs);
  } catch {
    return null;
  }
  // 自訂協定：http 頁面可載入本機 assets（file:// 會被擋）
  return `ydlab://asset/${toPosix(relativePath)
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
});

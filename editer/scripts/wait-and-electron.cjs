const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");

const noWait = process.argv.includes("--no-wait");
const root = path.resolve(__dirname, "..");
const electronBin = require("electron");

function waitForVite(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });
      req.on("error", retry);
      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timeout waiting for ${url}`));
        return;
      }
      setTimeout(tryOnce, 250);
    };
    tryOnce();
  });
}

async function main() {
  // Cursor / sandbox 常注入這些，會搞掛 Electron 與本機 wait
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  if (!noWait) {
    console.log("[editer] waiting for Vite…");
    await waitForVite("http://127.0.0.1:5173/");
    console.log("[editer] Vite ready, launching Electron");
  }

  const child = spawn(electronBin, ["."], {
    cwd: root,
    env,
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}

main().catch((err) => {
  console.error("[editer]", err.message);
  process.exit(1);
});

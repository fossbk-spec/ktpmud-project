import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const setupOnly = process.argv.includes("--setup-only");
const localUrl = "http://127.0.0.1:8787";
const vinextCli = path.join(root, "node_modules", "vinext", "dist", "cli.js");
const wranglerCli = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const wranglerConfig = path.join(root, "dist", "server", "wrangler.json");
const localData = path.join(root, ".local-data");
const localSchema = path.join(root, "scripts", "local-schema.sql");

function fail(message) {
  console.error(`\n[LOI] ${message}`);
  process.exit(1);
}

function checkNodeVersion() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 13)) {
    fail(`Can Node.js 22.13 tro len. May dang dung Node.js ${process.versions.node}.`);
  }
}

function run(command, args, label, options = {}) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
    shell: options.shell ?? false,
  });
  if (result.error) fail(`${label}: ${result.error.message}`);
  if (result.status !== 0) fail(`${label} khong thanh cong (ma ${result.status ?? "khong ro"}).`);
}

function ensureDependencies() {
  if (existsSync(vinextCli) && existsSync(wranglerCli)) return;
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  run(
    npx,
    ["--yes", "pnpm@11.25.0", "install", "--frozen-lockfile"],
    "Cai thu vien lan dau (can Internet)",
    { shell: process.platform === "win32" },
  );
  if (!existsSync(vinextCli) || !existsSync(wranglerCli)) {
    fail("Da cai xong nhung van thieu Vinext hoac Wrangler.");
  }
}

function buildApplication() {
  run(process.execPath, [vinextCli, "build"], "Xay dung ung dung local");
  if (!existsSync(wranglerConfig)) fail("Khong tao duoc dist/server/wrangler.json.");
}

function initializeDatabase() {
  run(
    process.execPath,
    [
      wranglerCli,
      "d1",
      "execute",
      "ha-ha-farm-db",
      "--local",
      "--persist-to",
      localData,
      "--config",
      wranglerConfig,
      "--file",
      localSchema,
      "--yes",
    ],
    "Khoi tao/kiem tra database local rieng",
  );
}

async function isRunning() {
  try {
    const response = await fetch(localUrl, { signal: AbortSignal.timeout(900) });
    return response.ok;
  } catch {
    return false;
  }
}

function openBrowser() {
  try {
    let child;
    if (process.platform === "win32") {
      child = spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "start", "", localUrl], {
        detached: true,
        stdio: "ignore",
      });
    } else if (process.platform === "darwin") {
      child = spawn("open", [localUrl], { detached: true, stdio: "ignore" });
    } else {
      child = spawn("xdg-open", [localUrl], { detached: true, stdio: "ignore" });
    }
    child.unref();
  } catch {
    console.log(`Hay mo trinh duyet tai: ${localUrl}`);
  }
}

checkNodeVersion();

if (!setupOnly && (await isRunning())) {
  console.log(`HaHa Farm dang chay tai ${localUrl}`);
  openBrowser();
  process.exit(0);
}

ensureDependencies();
buildApplication();
initializeDatabase();

if (setupOnly) {
  console.log("\nCai dat local da san sang. Khong co ket noi den database Cloudflare truc tuyen.");
  process.exit(0);
}

console.log("\n==> Dang khoi dong HaHa Farm local...");
console.log(`Du lieu duoc luu rieng tai: ${localData}`);
console.log("Dong cua so nay khi muon dung web.\n");

const worker = spawn(
  process.execPath,
  [
    wranglerCli,
    "dev",
    "--config",
    wranglerConfig,
    "--local",
    "--persist-to",
    localData,
    "--ip",
    "127.0.0.1",
    "--port",
    "8787",
    "--show-interactive-dev-session=false",
  ],
  {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
  },
);

let browserOpened = false;
const timer = setInterval(async () => {
  if (browserOpened || !(await isRunning())) return;
  browserOpened = true;
  console.log(`\nHaHa Farm da san sang: ${localUrl}`);
  openBrowser();
}, 500);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => worker.kill(signal));
}

worker.on("error", (error) => {
  clearInterval(timer);
  fail(`Khong khoi dong duoc server local: ${error.message}`);
});

worker.on("exit", (code, signal) => {
  clearInterval(timer);
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

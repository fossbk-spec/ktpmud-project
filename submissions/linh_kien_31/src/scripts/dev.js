import { spawn } from "node:child_process";
const backend = spawn(
  process.execPath,
  ["--env-file-if-exists=.env", "server/index.js"],
  { stdio: ["inherit", "inherit", "inherit", "ipc"] },
);
const frontend = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--config", "frontend/vite.config.js"],
  { stdio: "inherit" },
);
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  frontend.kill();
  if (backend.connected) backend.send("shutdown");
  else backend.kill();
}
backend.on("exit", (code) => {
  frontend.kill();
  process.exitCode = code || 0;
});
frontend.on("exit", () => stop());
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

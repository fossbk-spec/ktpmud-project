import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const databaseId = process.env.CLOUDFLARE_D1_ID?.trim();
const databaseName = process.env.CLOUDFLARE_D1_NAME?.trim() || "ha-ha-farm-db";
const workerName = process.env.CLOUDFLARE_WORKER_NAME?.trim() || "ha-ha-farm";

if (!databaseId) {
  console.error("Thiếu CLOUDFLARE_D1_ID. Hãy làm theo HUONG_DAN_CLOUDFLARE.md.");
  process.exit(1);
}

if (!/^[0-9a-f-]{36}$/i.test(databaseId)) {
  console.error("CLOUDFLARE_D1_ID không đúng định dạng UUID.");
  process.exit(1);
}

const configPath = resolve("dist/server/wrangler.json");
const config = JSON.parse(await readFile(configPath, "utf8"));

config.name = workerName;
if ("topLevelName" in config) config.topLevelName = workerName;
// Wrangler 4.161+ removed this legacy flag; omitting it keeps the same Worker name.
delete config.legacy_env;
config.d1_databases = [{
  binding: "DB",
  database_name: databaseName,
  database_id: databaseId,
}];

await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
console.log(`Đã nối Worker “${workerName}” với D1 “${databaseName}”.`);

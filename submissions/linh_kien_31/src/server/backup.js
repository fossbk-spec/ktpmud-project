import { rows, one } from "./db.js";
import { readFile } from "node:fs/promises";
export const TABLES = [
  "users",
  "categories",
  "suppliers",
  "locations",
  "products",
  "stock",
  "carts",
  "boms",
  "orders",
  "vouchers",
  "movements",
  "audit",
  "settings",
];
const jsonColumns = new Set([
  "permissions",
  "attributes",
  "specs",
  "lines",
  "history",
  "before_data",
  "after_data",
]);
export async function exportData(db) {
  return db.transaction(async (tx) => {
    const tables = {};
    for (const t of TABLES) tables[t] = await rows(tx, `SELECT * FROM ${t}`);
    return {
      format: "nhom31-backup-v1",
      created_at: new Date().toISOString(),
      tables,
    };
  });
}
export async function importData(db, payload) {
  if (payload.format !== "nhom31-backup-v1" || !payload.tables)
    throw Error("Không đúng định dạng backup.");
  await db.exec(
    await readFile(new URL("./schema.sql", import.meta.url), "utf8"),
  );
  return db.transaction(async (tx) => {
    for (const t of TABLES)
      if (Number((await one(tx, `SELECT COUNT(*) n FROM ${t}`)).n) > 0)
        throw Error(
          "Chỉ khôi phục vào cơ sở dữ liệu trống để tránh mất dữ liệu.",
        );
    for (const t of TABLES) {
      if (!Array.isArray(payload.tables[t])) throw Error("Thiếu bảng " + t);
      const allowed = (
        await rows(
          tx,
          "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1",
          [t],
        )
      ).map((x) => x.column_name);
      for (const row of payload.tables[t]) {
        const keys = Object.keys(row);
        if (keys.some((k) => !allowed.includes(k)))
          throw Error("Cột không hợp lệ.");
        const values = keys.map((k) =>
          jsonColumns.has(k) && row[k] !== null
            ? JSON.stringify(row[k])
            : row[k],
        );
        await tx.query(
          `INSERT INTO ${t}(${keys.join(",")}) VALUES(${keys.map((_, i) => "$" + (i + 1)).join(",")})`,
          values,
        );
      }
      if (allowed.includes("id") && t !== "settings") {
        const m = Number(
          (await one(tx, `SELECT COALESCE(MAX(id),0) n FROM ${t}`)).n,
        );
        await tx.query("SELECT setval(pg_get_serial_sequence($1,'id'),$2,$3)", [
          t,
          m || 1,
          m > 0,
        ]);
      }
    }
    return { tables: TABLES.length };
  });
}

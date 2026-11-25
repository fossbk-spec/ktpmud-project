import { open, unlink, mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
export async function acquireDataLock(root) {
  if (process.env.DATABASE_URL) return async () => {};
  await mkdir(root, { recursive: true });
  const path = resolve(root, ".process-lock");
  let handle;
  try {
    handle = await open(path, "wx");
    await handle.writeFile(String(process.pid));
  } catch (e) {
    if (e.code === "EEXIST") {
      const pid = Number(await readFile(path, "utf8"));
      if (Number.isSafeInteger(pid) && pid > 0) {
        try {
          process.kill(pid, 0);
        } catch (err) {
          if (err.code === "ESRCH") {
            await unlink(path);
            return acquireDataLock(root);
          }
        }
      }
      throw Error(
        "Cơ sở dữ liệu nhúng đang được một tiến trình sử dụng. Dừng terminal chạy web trước khi mở lần hai/sao lưu. Nếu máy vừa tắt đột ngột: chắc chắn mọi tiến trình Node của dự án đã dừng rồi xóa data/.process-lock.",
      );
    }
    throw e;
  }
  return async () => {
    await handle.close();
    await unlink(path).catch(() => {});
  };
}

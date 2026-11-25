import { useState } from "react";
import { X, LoaderCircle } from "lucide-react";
export const money = (n) => Number(n || 0).toLocaleString("vi-VN") + " ₫";
export const date = (s) => (s ? new Date(s).toLocaleString("vi-VN") : "—");
export const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
export const statuses = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipped: "Đã xuất kho",
  delivering: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  rejected: "Từ chối",
  draft: "Nháp",
};
export const types = {
  in: "Nhập kho",
  out: "Xuất khác",
  sale: "Xuất theo đơn",
  adjust: "Điều chỉnh kiểm kê",
  transfer: "Chuyển vị trí",
};
export const permissions = {
  products: "Linh kiện",
  categories: "Danh mục",
  suppliers: "Nhà cung cấp",
  inventory: "Tồn / vị trí / lịch sử",
  receiving: "Nhập kho",
  shipping: "Xuất kho",
  orders: "Xử lý đơn",
};
export async function api(path, body) {
  const r = await fetch("/api/" + path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-App-Request": "nhom31" },
    ...(body === undefined
      ? {}
      : { method: "POST", body: JSON.stringify(body) }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Không thể kết nối máy chủ.");
  return data;
}
export function Badge({ status }) {
  return (
    <span className={"badge " + status}>{statuses[status] || status}</span>
  );
}
export function Empty({ children = "Chưa có dữ liệu." }) {
  return <div className="empty">{children}</div>;
}
export function Table({ heads, children }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {heads.map((x) => (
              <th key={x}>{x}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
export function Modal({ title, onClose, children, wide = false }) {
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={"modal " + (wide ? "wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function Form({
  fields,
  initial = {},
  onSubmit,
  submit = "Lưu thay đổi",
  children,
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        const form = e.currentTarget;
        const raw = Object.fromEntries(new FormData(form));
        const b = { ...initial, ...raw };
        try {
          for (const f of fields) {
            if (f.type === "checkbox")
              b[f.name] = form.elements[f.name].checked;
            else if (f.type === "json")
              b[f.name] = JSON.parse(raw[f.name] || "{}");
            else if (f.type === "number") b[f.name] = Number(raw[f.name]);
          }
          setBusy(true);
          setError("");
          await onSubmit(b);
        } catch (err) {
          setError(
            err instanceof SyntaxError
              ? "JSON không hợp lệ. Kiểm tra dấu ngoặc và dấu phẩy."
              : err.message,
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-grid">
        {fields.map((f) => (
          <label
            key={f.name}
            className={
              f.type === "textarea" || f.type === "json" ? "span2" : ""
            }
          >
            {f.label}
            {f.required && " *"}
            {f.type === "select" ? (
              <select
                name={f.name}
                defaultValue={initial[f.name] ?? f.default ?? ""}
                required={f.required}
              >
                {!f.noEmpty && <option value="">Chọn…</option>}
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" || f.type === "json" ? (
              <textarea
                name={f.name}
                rows={f.type === "json" ? 5 : 3}
                defaultValue={
                  f.type === "json"
                    ? JSON.stringify(
                        initial[f.name] ?? f.default ?? {},
                        null,
                        2,
                      )
                    : (initial[f.name] ?? "")
                }
                required={f.required}
              />
            ) : f.type === "checkbox" ? (
              <input
                name={f.name}
                type="checkbox"
                defaultChecked={initial[f.name] ?? f.default ?? false}
              />
            ) : (
              <input
                name={f.name}
                type={f.type || "text"}
                defaultValue={initial[f.name] ?? f.default ?? ""}
                required={f.required}
                min={f.min}
                max={f.max}
                step={f.type === "number" ? 1 : undefined}
                minLength={f.minLength}
                placeholder={f.placeholder}
              />
            )}
            {f.help && <small>{f.help}</small>}
          </label>
        ))}
      </div>
      {children}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-footer">
        <button className="primary" disabled={busy}>
          {busy ? (
            <>
              <LoaderCircle className="spin" size={16} /> Đang lưu…
            </>
          ) : (
            submit
          )}
        </button>
      </div>
    </form>
  );
}
export const field = (name, label, type = "text", extra = {}) => ({
  name,
  label,
  type,
  ...extra,
});
export function DateFilter({ onLoad, children }) {
  const today = new Date(),
    local = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const [from, setFrom] = useState(
      local(new Date(today.getFullYear(), today.getMonth(), 1)),
    ),
    [to, setTo] = useState(local(today));
  return (
    <form
      className="toolbar"
      onSubmit={(e) => {
        e.preventDefault();
        onLoad({ from, to });
      }}
    >
      <label>
        Từ ngày
        <input
          type="date"
          required
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </label>
      <label>
        Đến ngày
        <input
          type="date"
          required
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </label>
      <button className="primary">Xem dữ liệu</button>
      {children}
    </form>
  );
}

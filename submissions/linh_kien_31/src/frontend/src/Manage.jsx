import { useState } from "react";
import { Plus, Package, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import {
  money,
  date,
  norm,
  Table,
  Empty,
  Modal,
  Form,
  field,
  Badge,
  types,
  permissions,
  DateFilter,
} from "./common.jsx";
const active = field("active", "Đang hoạt động", "checkbox", { default: true });
const opts = (arr) => (arr || []).map((x) => ({ value: x.id, label: x.name }));
export function Products({ data, act }) {
  const [edit, setEdit] = useState(null),
    [price, setPrice] = useState(null),
    [q, setQ] = useState("");
  return (
    <>
      <div className="section-title">
        <div>
          <h1>Quản lý linh kiện</h1>
          <p className="muted">Dữ liệu kỹ thuật và trạng thái kinh doanh.</p>
        </div>
        <button
          className="primary"
          onClick={() => setEdit({ active: true, unit: "cái", specs: {} })}
        >
          <Plus size={16} /> Thêm linh kiện
        </button>
      </div>
      <input
        className="searchbar"
        placeholder="Tìm mã / tên…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="panel">
        <Table
          heads={[
            "Mã",
            "Tên linh kiện",
            "Danh mục",
            "Giá bán",
            "Khả dụng",
            "Trạng thái",
            "",
          ]}
        >
          {data.products
            .filter((p) => norm(p.sku + " " + p.name).includes(norm(q)))
            .map((p) => (
              <tr key={p.id}>
                <td>{p.sku}</td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{money(p.price)}</td>
                <td>{p.available}</td>
                <td>{p.active ? "Đang bán" : "Ngừng bán"}</td>
                <td>
                  <div className="actions">
                    <button onClick={() => setEdit(p)}>Sửa</button>
                    {data.user.role === "owner" && (
                      <button onClick={() => setPrice(p)}>Giá bán</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
        </Table>
      </div>
      {edit && (
        <Modal
          title={edit.id ? "Sửa linh kiện" : "Thêm linh kiện"}
          wide
          onClose={() => setEdit(null)}
        >
          <ProductEditor
            p={edit}
            categories={data.categories}
            onSave={async (b) => {
              const payload = { ...b };
              delete payload.price;
              await act("product.save", payload, true);
              setEdit(null);
            }}
          />
        </Modal>
      )}
      {price && (
        <Modal title={"Giá bán · " + price.sku} onClose={() => setPrice(null)}>
          <p>Thay đổi giá sẽ được ghi nhật ký; không làm đổi đơn cũ.</p>
          <Form
            initial={price}
            fields={[
              field("price", "Giá bán (VNĐ)", "number", {
                required: true,
                min: 0,
              }),
            ]}
            onSubmit={async (b) => {
              await act("price.save", { id: b.id, price: b.price }, true);
              setPrice(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}
function ProductEditor({ p, categories, onSave }) {
  const [cat, setCat] = useState(
      p.category_id || categories.find((c) => c.active)?.id || "",
    ),
    [specs, setSpecs] = useState(p.specs || {});
  const attrs = categories.find((c) => c.id === Number(cat))?.attributes || [];
  return (
    <Form
      initial={p}
      fields={[
        field("sku", "Mã linh kiện", "text", { required: true }),
        field("name", "Tên linh kiện", "text", { required: true }),
        field("unit", "Đơn vị", "text", { required: true, default: "cái" }),
        active,
        field("description", "Mô tả", "textarea"),
        field("image", "Liên kết ảnh", "url"),
        field("datasheet", "Liên kết datasheet / tài liệu", "url"),
        field("pinout", "Liên kết sơ đồ chân", "url"),
      ]}
      onSubmit={(b) => onSave({ ...b, category_id: Number(cat), specs })}
    >
      <label>
        Danh mục
        <select
          value={cat}
          onChange={(e) => {
            setCat(e.target.value);
            setSpecs({});
          }}
          required
        >
          {categories
            .filter((c) => c.active)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </label>
      <h3>Thông số kỹ thuật</h3>
      <div className="form-grid">
        {attrs.map((a) => (
          <label key={a.name}>
            {a.name} {a.unit && `(${a.unit})`}
            <input
              value={specs[a.name] || ""}
              onChange={(e) => setSpecs({ ...specs, [a.name]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <p className="muted">
        Linh kiện mới có giá 0; chủ cửa hàng cập nhật giá ở nút “Giá bán”.
      </p>
    </Form>
  );
}
export function ReferencePage({ kind, data, act }) {
  const [edit, setEdit] = useState(null);
  const names = {
    category: "Danh mục",
    supplier: "Nhà cung cấp",
    location: "Vị trí kho",
  };
  const arr =
    kind === "category"
      ? data.categories
      : kind === "supplier"
        ? data.suppliers
        : data.locations;
  return (
    <>
      <div className="section-title">
        <h1>{names[kind]}</h1>
        <button
          className="primary"
          onClick={() => setEdit({ active: true, attributes: [] })}
        >
          + Thêm mới
        </button>
      </div>
      <div className="panel">
        <Table heads={["Tên", "Thông tin", "Trạng thái", ""]}>
          {arr?.map((x) => (
            <tr key={x.id}>
              <td>{x.name}</td>
              <td>
                {kind === "category"
                  ? x.attributes
                      .map((a) => a.name + (a.unit ? " (" + a.unit + ")" : ""))
                      .join(", ")
                  : kind === "supplier"
                    ? `${x.phone} · ${x.email} · ${x.address}`
                    : `Vị trí #${x.id}`}
              </td>
              <td>{x.active ? "Hoạt động" : "Ngừng dùng"}</td>
              <td>
                <button onClick={() => setEdit(x)}>Chỉnh sửa</button>
                {kind === "supplier" && (
                  <small>
                    Phiếu nhập:{" "}
                    {(data.vouchers || [])
                      .filter((v) => v.supplier_id === x.id)
                      .map((v) => "#" + v.id)
                      .join(", ") || "Chưa có / không có quyền xem"}
                  </small>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </div>
      {edit && (
        <Modal title={names[kind]} wide onClose={() => setEdit(null)}>
          {kind === "category" ? (
            <CategoryEditor
              initial={edit}
              onSave={async (b) => {
                await act("category.save", b, true);
                setEdit(null);
              }}
            />
          ) : (
            <Form
              initial={edit}
              fields={[
                field("name", "Tên", "text", { required: true }),
                ...(kind === "supplier"
                  ? [
                      field("phone", "Điện thoại"),
                      field("email", "Email", "email"),
                      field("address", "Địa chỉ", "textarea"),
                    ]
                  : []),
                active,
              ]}
              onSubmit={async (b) => {
                await act(kind + ".save", b, true);
                setEdit(null);
              }}
            />
          )}
        </Modal>
      )}
    </>
  );
}
function CategoryEditor({ initial, onSave }) {
  const [attributes, setAttributes] = useState(initial.attributes || []);
  return (
    <Form
      initial={initial}
      fields={[
        field("name", "Tên danh mục", "text", { required: true }),
        active,
      ]}
      onSubmit={(b) => onSave({ ...b, attributes })}
    >
      <h3>Bộ thuộc tính kỹ thuật</h3>
      {attributes.map((a, i) => (
        <div className="toolbar" key={i}>
          <input
            aria-label="Tên thuộc tính"
            placeholder="Tên thuộc tính"
            required
            value={a.name}
            onChange={(e) =>
              setAttributes(
                attributes.map((x, j) =>
                  i === j ? { ...x, name: e.target.value } : x,
                ),
              )
            }
          />
          <input
            aria-label="Đơn vị"
            placeholder="Đơn vị: V, MHz…"
            value={a.unit}
            onChange={(e) =>
              setAttributes(
                attributes.map((x, j) =>
                  i === j ? { ...x, unit: e.target.value } : x,
                ),
              )
            }
          />
          <button
            type="button"
            onClick={() => setAttributes(attributes.filter((_, j) => i !== j))}
          >
            Xóa
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setAttributes([...attributes, { name: "", unit: "" }])}
      >
        + Thuộc tính
      </button>
    </Form>
  );
}
export function Inventory({ data }) {
  const [q, setQ] = useState("");
  const [low, setLow] = useState(false);
  return (
    <>
      <h1>Tồn kho & cảnh báo</h1>
      <div className="stats">
        <div>
          <span>Tổng tồn thực tế</span>
          <strong>{data.products.reduce((s, p) => s + p.actual, 0)}</strong>
        </div>
        <div>
          <span>Đang giữ cho đơn</span>
          <strong>{data.products.reduce((s, p) => s + p.reserved, 0)}</strong>
        </div>
        <div>
          <span>Mã dưới ngưỡng {data.settings.low_stock}</span>
          <strong>
            {
              data.products.filter((p) => p.available < data.settings.low_stock)
                .length
            }
          </strong>
        </div>
      </div>
      <div className="toolbar">
        <input
          placeholder="Tìm linh kiện…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="check">
          <input
            type="checkbox"
            checked={low}
            onChange={(e) => setLow(e.target.checked)}
          />{" "}
          Chỉ dưới ngưỡng
        </label>
      </div>
      <div className="panel">
        <Table
          heads={[
            "Mã / tên",
            "Tồn thực tế",
            "Đang giữ",
            "Khả dụng",
            "Chi tiết vị trí",
          ]}
        >
          {data.products
            .filter(
              (p) =>
                norm(p.name + p.sku).includes(norm(q)) &&
                (!low || p.available < data.settings.low_stock),
            )
            .map((p) => (
              <tr key={p.id}>
                <td>
                  <b>{p.sku}</b>
                  <small>{p.name}</small>
                </td>
                <td>{p.actual}</td>
                <td>{p.reserved}</td>
                <td>
                  <span
                    className={
                      p.available < data.settings.low_stock ? "low-stock" : ""
                    }
                  >
                    {p.available}
                  </span>
                </td>
                <td>
                  {data.stock
                    ?.filter((s) => s.product_id === p.id && s.quantity > 0)
                    .map((s) => (
                      <small key={s.location_id}>
                        {
                          data.locations?.find((l) => l.id === s.location_id)
                            ?.name
                        }
                        : {s.quantity}
                      </small>
                    ))}
                </td>
              </tr>
            ))}
        </Table>
      </div>
      <p className="muted">
        Tồn khả dụng = tồn thực tế − lượng giữ. Lượng giữ quản lý theo đơn và
        mã; vị trí được chọn lúc xuất kho.
      </p>
    </>
  );
}
export function Vouchers({ data, act, initial, onInitialUsed }) {
  const [edit, setEdit] = useState(initial || null),
    [detail, setDetail] = useState(null),
    [filter, setFilter] = useState("");
  const can = (t) =>
    data.user.role === "owner" ||
    data.user.permissions.includes(
      t === "in" ? "receiving" : t === "transfer" ? "inventory" : "shipping",
    );
  return (
    <>
      <div className="section-title">
        <div>
          <h1>Phiếu kho</h1>
          <p className="muted">
            Lập nháp → đối chiếu → xác nhận. Phiếu xác nhận không sửa/xóa.
          </p>
        </div>
        <div className="actions">
          {[
            "in",
            "out",
            "transfer",
            ...(data.user.role === "owner" ? ["adjust"] : []),
          ]
            .filter(can)
            .map((t) => (
              <button key={t} onClick={() => setEdit({ type: t, lines: [] })}>
                + {types[t]}
              </button>
            ))}
        </div>
      </div>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">Tất cả loại phiếu</option>
        {Object.entries(types).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <div className="panel">
        <Table
          heads={["Phiếu", "Loại", "Tham chiếu", "Ngày tạo", "Trạng thái", ""]}
        >
          {data.vouchers
            ?.filter((v) => !filter || v.type === filter)
            .map((v) => (
              <tr key={v.id}>
                <td>PK-{v.id}</td>
                <td>{types[v.type]}</td>
                <td>
                  {v.order_id
                    ? "Đơn #" + v.order_id
                    : v.reference_id
                      ? "Phiếu #" + v.reference_id
                      : "—"}
                </td>
                <td>{date(v.created_at)}</td>
                <td>
                  <Badge status={v.status} />
                </td>
                <td>
                  <div className="actions">
                    <button onClick={() => setDetail(v)}>Xem</button>
                    {v.status === "draft" &&
                      (v.type === "adjust"
                        ? data.user.role === "owner"
                        : can(v.type)) && (
                        <>
                          <button onClick={() => setEdit(v)}>Sửa nháp</button>
                          <button
                            className="primary"
                            onClick={() => {
                              if (
                                confirm(
                                  "Xác nhận phiếu #" +
                                    v.id +
                                    "? Tồn kho sẽ thay đổi.",
                                )
                              )
                                act("voucher.confirm", { id: v.id });
                            }}
                          >
                            Xác nhận
                          </button>
                        </>
                      )}
                  </div>
                </td>
              </tr>
            ))}
        </Table>
      </div>
      {edit && (
        <Modal
          title={types[edit.type] + (edit.id ? " #" + edit.id : "")}
          wide
          onClose={() => {
            setEdit(null);
            onInitialUsed?.();
          }}
        >
          <VoucherEditor
            initial={edit}
            data={data}
            onSave={async (b) => {
              await act("voucher.save", b, true);
              setEdit(null);
              onInitialUsed?.();
            }}
          />
        </Modal>
      )}
      {detail && (
        <Modal
          title={"Phiếu #" + detail.id}
          wide
          onClose={() => setDetail(null)}
        >
          <p>
            {types[detail.type]} · <Badge status={detail.status} /> ·{" "}
            {date(detail.confirmed_at)}
          </p>
          <p>
            Lý do: {detail.reason || "—"} · Đơn: {detail.order_id || "—"} ·
            Phiếu gốc: {detail.reference_id || "—"}
          </p>
          <Table
            heads={[
              "Linh kiện",
              "Vị trí",
              "Số lượng / kiểm kê",
              "Giá nhập / đích",
            ]}
          >
            {detail.lines.map((l, i) => (
              <tr key={i}>
                <td>{data.products.find((p) => p.id === l.product_id)?.sku}</td>
                <td>
                  {data.locations?.find((x) => x.id === l.location_id)?.name}
                </td>
                <td>
                  {detail.type === "adjust"
                    ? `${l.expected} → ${l.count}`
                    : l.quantity}
                </td>
                <td>
                  {detail.type === "in"
                    ? money(l.cost)
                    : data.locations?.find((x) => x.id === l.target_id)?.name ||
                      "—"}
                </td>
              </tr>
            ))}
          </Table>
        </Modal>
      )}
    </>
  );
}
function VoucherEditor({ initial: v, data, onSave }) {
  const [lines, setLines] = useState(v.lines || []);
  const type = v.type;
  const qty = (pid, lid) =>
    data.stock?.find(
      (s) => s.product_id === Number(pid) && s.location_id === Number(lid),
    )?.quantity || 0;
  const change = (i, k, val) =>
    setLines(
      lines.map((l, j) => {
        if (i !== j) return l;
        const n = { ...l, [k]: val };
        if (type === "adjust" && ["product_id", "location_id"].includes(k)) {
          n.expected = qty(n.product_id, n.location_id);
          n.count = n.expected;
        }
        return n;
      }),
    );
  const fields = [
    ...(type === "in"
      ? [
          field("supplier_id", "Nhà cung cấp", "select", {
            required: true,
            options: opts(data.suppliers?.filter((x) => x.active)),
          }),
        ]
      : []),
    ...(type === "sale"
      ? [
          field("order_id", "Đơn đã xác nhận", "select", {
            required: true,
            options: (data.orders || [])
              .filter((o) => o.status === "confirmed")
              .map((o) => ({
                value: o.id,
                label: "#" + o.id + " · " + o.recipient,
              })),
          }),
        ]
      : []),
    field("reference_id", "Phiếu gốc (nếu sửa sai)", "select", {
      options: (data.vouchers || [])
        .filter((x) => x.status === "confirmed")
        .map((x) => ({
          value: x.id,
          label: "#" + x.id + " · " + types[x.type],
        })),
    }),
    field("reason", "Lý do / ghi chú", "textarea", {
      required: ["out", "adjust", "transfer"].includes(type),
    }),
  ];
  return (
    <Form
      initial={v}
      fields={fields}
      submit="Lưu phiếu nháp"
      onSubmit={(b) => onSave({ ...b, type, lines })}
    >
      <Table
        heads={[
          "Linh kiện",
          "Vị trí",
          type === "adjust" ? "Số đếm thực tế" : "Số lượng",
          type === "in"
            ? "Giá nhập"
            : type === "transfer"
              ? "Vị trí đến"
              : "Tồn hiện tại",
          "",
        ]}
      >
        {lines.map((l, i) => (
          <tr key={i}>
            <td>
              <select
                required
                value={l.product_id}
                onChange={(e) =>
                  change(i, "product_id", Number(e.target.value))
                }
              >
                <option value="">Chọn mã</option>
                {data.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <select
                required
                value={l.location_id || ""}
                onChange={(e) =>
                  change(i, "location_id", Number(e.target.value))
                }
              >
                <option value="">Chọn vị trí</option>
                {data.locations
                  ?.filter((x) => x.active)
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
              </select>
            </td>
            <td>
              <input
                className="qty"
                required
                type="number"
                min={type === "adjust" ? 0 : 1}
                value={type === "adjust" ? (l.count ?? 0) : l.quantity}
                onChange={(e) =>
                  change(
                    i,
                    type === "adjust" ? "count" : "quantity",
                    Number(e.target.value),
                  )
                }
              />
              {type === "adjust" && (
                <small>Số dư đối chiếu: {l.expected ?? 0}</small>
              )}
            </td>
            <td>
              {type === "in" ? (
                <input
                  className="qty"
                  type="number"
                  min="0"
                  value={l.cost || 0}
                  onChange={(e) => change(i, "cost", Number(e.target.value))}
                />
              ) : type === "transfer" ? (
                <select
                  required
                  value={l.target_id || ""}
                  onChange={(e) =>
                    change(i, "target_id", Number(e.target.value))
                  }
                >
                  <option value="">Chọn vị trí đến</option>
                  {data.locations
                    ?.filter((x) => x.active)
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                </select>
              ) : (
                qty(l.product_id, l.location_id)
              )}
            </td>
            <td>
              <button
                type="button"
                onClick={() => setLines(lines.filter((_, j) => i !== j))}
              >
                Xóa
              </button>
            </td>
          </tr>
        ))}
      </Table>
      <button
        type="button"
        onClick={() =>
          setLines([
            ...lines,
            {
              product_id: "",
              location_id: "",
              quantity: 1,
              cost: 0,
              expected: 0,
              count: 0,
            },
          ])
        }
      >
        + Thêm dòng
      </button>
      <p className="notice">
        {type === "sale"
          ? "Xuất toàn bộ đơn một lần. Có thể chia cùng mã thành các dòng ở vị trí khác nhau."
          : type === "adjust"
            ? "Nếu số dư thay đổi sau khi kiểm kê, phiếu bị chặn. Chọn lại vị trí để lấy số dư mới và kiểm đếm lại."
            : "Phiếu nháp chưa làm thay đổi tồn kho."}
      </p>
    </Form>
  );
}
export function Accounts({ data, act }) {
  const [edit, setEdit] = useState(null),
    [perms, setPerms] = useState(null);
  return (
    <>
      <div className="section-title">
        <h1>Tài khoản & phân quyền</h1>
        <button className="primary" onClick={() => setEdit({})}>
          + Tạo nhân viên
        </button>
      </div>
      <div className="panel">
        <Table
          heads={["Tài khoản", "Vai trò", "Quyền nghiệp vụ", "Trạng thái", ""]}
        >
          {data.users?.map((u) => (
            <tr key={u.id}>
              <td>
                {u.name}
                <small>{u.email}</small>
              </td>
              <td>
                {
                  {
                    owner: "Chủ cửa hàng",
                    employee: "Nhân viên",
                    customer: "Khách hàng",
                  }[u.role]
                }
              </td>
              <td>
                {u.role === "owner"
                  ? "Toàn bộ"
                  : u.permissions.map((p) => permissions[p]).join(", ") || "—"}
              </td>
              <td>{u.active ? "Hoạt động" : "Đã khóa"}</td>
              <td>
                <div className="actions">
                  {u.role === "employee" && (
                    <>
                      <button onClick={() => setEdit(u)}>Hồ sơ</button>
                      <button onClick={() => setPerms(u)}>Phân quyền</button>
                    </>
                  )}
                  {u.role !== "owner" && (
                    <button
                      className={u.active ? "danger" : ""}
                      onClick={() => {
                        const reason = prompt(
                          (u.active ? "Khóa" : "Mở khóa") +
                            " tài khoản. Nhập lý do:",
                        );
                        if (reason)
                          act("user.active", {
                            id: u.id,
                            active: !u.active,
                            reason,
                            version: u.version,
                          });
                      }}
                    >
                      {u.active ? "Khóa" : "Mở khóa"}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>
      {edit && (
        <Modal title="Hồ sơ nhân viên" onClose={() => setEdit(null)}>
          <Form
            initial={edit}
            fields={[
              field("name", "Họ tên", "text", { required: true }),
              field("email", "Email", "email", { required: true }),
              field("phone", "Điện thoại"),
              ...(!edit.id
                ? [
                    field("password", "Mật khẩu ban đầu", "password", {
                      required: true,
                      minLength: 10,
                    }),
                  ]
                : []),
            ]}
            onSubmit={async (b) => {
              await act("user.save", b, true);
              setEdit(null);
            }}
          />
          <p className="muted">
            Nhân viên mới chưa có quyền nghiệp vụ. Chủ cửa hàng cấp quyền sau
            khi tạo.
          </p>
        </Modal>
      )}
      {perms && (
        <Modal
          title={"Phân quyền · " + perms.name}
          onClose={() => setPerms(null)}
        >
          <Form
            initial={Object.fromEntries(
              Object.keys(permissions).map((k) => [
                k,
                perms.permissions.includes(k),
              ]),
            )}
            fields={Object.entries(permissions).map(([k, v]) =>
              field(k, v, "checkbox"),
            )}
            onSubmit={async (b) => {
              await act(
                "user.permissions",
                {
                  id: perms.id,
                  version: perms.version,
                  permissions: Object.keys(permissions).filter((k) => b[k]),
                },
                true,
              );
              setPerms(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}
export function Reports({ act }) {
  const [r, setR] = useState(null);
  return (
    <>
      <h1>Báo cáo bán hàng</h1>
      <p className="muted">
        Chỉ tính đơn hoàn thành theo ngày hoàn thành. Doanh thu tiền hàng, không
        phải lợi nhuận.
      </p>
      <DateFilter
        onLoad={async (b) => setR(await act("report", b, true, false))}
      />
      {r && (
        <>
          <div className="stats">
            <div>
              <span>Doanh thu tiền hàng</span>
              <strong>{money(r.revenue)}</strong>
            </div>
            <div>
              <span>Đơn hoàn thành</span>
              <strong>{r.count}</strong>
            </div>
            <div>
              <span>Số lượng bán</span>
              <strong>{r.products.reduce((s, p) => s + p.quantity, 0)}</strong>
            </div>
          </div>
          <div className="panel">
            <h2>Linh kiện bán nhiều</h2>
            <Table heads={["Mã", "Tên", "Số lượng", "Doanh thu"]}>
              {r.products.map((p) => (
                <tr key={p.sku}>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.quantity}</td>
                  <td>{money(p.revenue)}</td>
                </tr>
              ))}
            </Table>
          </div>
          <div className="panel">
            <h2>Đơn cấu thành báo cáo</h2>
            <Table heads={["Đơn", "Hoàn thành lúc", "Người nhận", "Tiền hàng"]}>
              {r.orders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{date(o.completed_at)}</td>
                  <td>{o.recipient}</td>
                  <td>{money(o.total)}</td>
                </tr>
              ))}
            </Table>
          </div>
          <div className="panel">
            <h2>Số dư kho hiện tại</h2>
            <p className="muted">
              Tại {date(r.as_of)} — không phải số dư cuối kỳ đã chọn.
            </p>
            <Table heads={["Mã", "Thực tế", "Giữ", "Khả dụng"]}>
              {r.stock.map((p) => (
                <tr key={p.id}>
                  <td>{p.sku}</td>
                  <td>{p.actual}</td>
                  <td>{p.reserved}</td>
                  <td>{p.available}</td>
                </tr>
              ))}
            </Table>
          </div>
        </>
      )}
    </>
  );
}
export function Logs({ kind, act }) {
  const [items, setItems] = useState(null),
    [q, setQ] = useState(""),
    [detail, setDetail] = useState(null);
  const stock = kind === "movements";
  return (
    <>
      <h1>{stock ? "Lịch sử nhập – xuất" : "Nhật ký hoạt động"}</h1>
      <DateFilter
        onLoad={async (b) => setItems(await act(kind, b, true, false))}
      />
      <input
        className="searchbar"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={
          stock
            ? "Lọc mã, loại (in/out/sale), người thực hiện…"
            : "Lọc thao tác, tài khoản, đối tượng…"
        }
      />
      {items && (
        <div className="panel">
          <Table
            heads={
              stock
                ? [
                    "Thời gian",
                    "Mã",
                    "Loại / phiếu",
                    "Vị trí",
                    "Biến động",
                    "Số dư sau",
                    "Người thực hiện",
                  ]
                : ["Thời gian", "Người thực hiện", "Thao tác", "Đối tượng", ""]
            }
          >
            {items
              .filter((x) => norm(JSON.stringify(x)).includes(norm(q)))
              .map((x) =>
                stock ? (
                  <tr key={x.id}>
                    <td>{date(x.created_at)}</td>
                    <td>{x.sku}</td>
                    <td>
                      {types[x.type]} #{x.voucher_id}
                      <small>
                        {x.order_id ? "Đơn #" + x.order_id : ""}{" "}
                        {x.reference_id ? "Phiếu gốc #" + x.reference_id : ""}{" "}
                        {x.reason}
                      </small>
                    </td>
                    <td>{x.location}</td>
                    <td>
                      {x.delta > 0 ? "+" : ""}
                      {x.delta}
                    </td>
                    <td>{x.balance}</td>
                    <td>{x.actor_name}</td>
                  </tr>
                ) : (
                  <tr key={x.id}>
                    <td>{date(x.created_at)}</td>
                    <td>{x.actor_name}</td>
                    <td>{x.action}</td>
                    <td>{x.entity}</td>
                    <td>
                      <button onClick={() => setDetail(x)}>Trước / sau</button>
                    </td>
                  </tr>
                ),
              )}
          </Table>
          {!items.length && <Empty />}
        </div>
      )}
      {detail && (
        <Modal title="Chi tiết thay đổi" wide onClose={() => setDetail(null)}>
          <h3>Trước</h3>
          <pre>{JSON.stringify(detail.before_data, null, 2)}</pre>
          <h3>Sau</h3>
          <pre>{JSON.stringify(detail.after_data, null, 2)}</pre>
        </Modal>
      )}
    </>
  );
}

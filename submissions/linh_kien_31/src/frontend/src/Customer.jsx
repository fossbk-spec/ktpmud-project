import { useState, useRef } from "react";
import { Plus, Trash2, ShoppingBag } from "lucide-react";
import {
  money,
  date,
  Table,
  Empty,
  Form,
  field,
  Badge,
  Modal,
  statuses,
} from "./common.jsx";
export function Cart({ data, act }) {
  const key = useRef(crypto.randomUUID());
  const lines = data.cart || [];
  const total = lines.reduce(
    (s, l) =>
      s +
      (data.products.find((p) => p.id === l.product_id)?.price || 0) *
        l.quantity,
    0,
  );
  const update = async (id, q) =>
    act("cart.save", {
      lines: lines.map((l) =>
        l.product_id === id ? { ...l, quantity: q } : l,
      ),
    });
  return (
    <>
      <h1>Giỏ hàng của bạn</h1>
      <p className="muted">
        Giỏ hàng chưa giữ tồn. Giá và lượng khả dụng được kiểm tra lại khi đặt.
      </p>
      {!lines.length ? (
        <Empty>Giỏ hàng đang trống. Hãy chọn linh kiện trong danh mục.</Empty>
      ) : (
        <div className="two-col">
          <div className="panel">
            <Table heads={["Linh kiện", "Số lượng", "Thành tiền", ""]}>
              {lines.map((l) => {
                const p = data.products.find((p) => p.id === l.product_id);
                return (
                  <tr key={l.product_id}>
                    <td>
                      <b>{p?.name || "Linh kiện ngừng bán"}</b>
                      <small>{p?.sku}</small>
                    </td>
                    <td>
                      <input
                        aria-label={"Số lượng " + p?.name}
                        className="qty"
                        type="number"
                        min="1"
                        max="1000000"
                        key={`${l.product_id}-${l.quantity}`}
                        defaultValue={l.quantity}
                        onBlur={(e) => {
                          const q = Number(e.target.value);
                          if (Number.isInteger(q) && q > 0 && q !== l.quantity)
                            update(l.product_id, q);
                          else e.target.value = l.quantity;
                        }}
                      />
                    </td>
                    <td>{money((p?.price || 0) * l.quantity)}</td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label="Xóa khỏi giỏ"
                        onClick={() =>
                          act("cart.save", {
                            lines: lines.filter(
                              (x) => x.product_id !== l.product_id,
                            ),
                          })
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </Table>
          </div>
          <div className="panel">
            <h2>Thông tin nhận hàng</h2>
            <Form
              key={total}
              initial={{
                recipient: data.user.name,
                phone: data.user.phone,
                address: data.user.address,
              }}
              fields={[
                field("recipient", "Tên người nhận", "text", {
                  required: true,
                }),
                field("phone", "Điện thoại", "tel", { required: true }),
                field("address", "Địa chỉ nhận hàng", "textarea", {
                  required: true,
                }),
                field("notes", "Ghi chú", "textarea"),
              ]}
              submit="Đặt hàng COD"
              onSubmit={async (b) => {
                await act(
                  "order.create",
                  { ...b, expected_total: total, request_key: key.current },
                  true,
                );
                key.current = crypto.randomUUID();
              }}
            >
              <div className="total">
                <span>Tổng tiền hàng</span>
                <strong>{money(total)}</strong>
              </div>
              <p className="muted">
                Thanh toán khi nhận hàng. Phiên bản này chưa tính phí giao hàng
                và thuế.
              </p>
            </Form>
          </div>
        </div>
      )}
    </>
  );
}
export function Boms({ data, act }) {
  const [edit, setEdit] = useState(null),
    [selected, setSelected] = useState({});
  return (
    <>
      <div className="section-title">
        <div>
          <h1>BOM dự án</h1>
          <p className="muted">
            Lập danh sách linh kiện và dự toán theo giá hiện hành.
          </p>
        </div>
        <button
          className="primary"
          onClick={() => setEdit({ name: "", notes: "", lines: [] })}
        >
          <Plus size={16} /> Tạo BOM
        </button>
      </div>
      {!(data.boms || []).length && (
        <Empty>Chưa có BOM. Tạo danh sách cho dự án đầu tiên.</Empty>
      )}
      {data.boms?.map((b) => {
        const ids = selected[b.id] || [];
        return (
          <section className="panel" key={b.id}>
            <div className="section-title">
              <div>
                <h2>{b.name}</h2>
                <p>{b.notes}</p>
              </div>
              <div className="toolbar">
                <button onClick={() => setEdit(b)}>Chỉnh sửa</button>
                <button
                  className="danger"
                  onClick={() => {
                    if (confirm("Xóa BOM " + b.name + "?"))
                      act("bom.delete", { id: b.id });
                  }}
                >
                  Xóa
                </button>
              </div>
            </div>
            <Table
              heads={["Chọn", "Linh kiện", "Số lượng", "Ghi chú", "Dự toán"]}
            >
              {b.lines.map((l) => {
                const p = data.products.find((p) => p.id === l.product_id);
                return (
                  <tr key={l.product_id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={ids.includes(l.product_id)}
                        onChange={(e) =>
                          setSelected({
                            ...selected,
                            [b.id]: e.target.checked
                              ? [...ids, l.product_id]
                              : ids.filter((id) => id !== l.product_id),
                          })
                        }
                      />
                    </td>
                    <td>{p?.name || `Mã #${l.product_id} (ngừng bán)`}</td>
                    <td>{l.quantity}</td>
                    <td>{l.note}</td>
                    <td>{p ? money(p.price * l.quantity) : "Chưa có giá"}</td>
                  </tr>
                );
              })}
            </Table>
            <div className="toolbar">
              <strong>
                Tổng dự kiến:{" "}
                {money(
                  b.lines.reduce(
                    (s, l) =>
                      s +
                      (data.products.find((p) => p.id === l.product_id)
                        ?.price || 0) *
                        l.quantity,
                    0,
                  ),
                )}
              </strong>
              <button
                disabled={!ids.length}
                onClick={() =>
                  act("bom.toCart", { id: b.id, product_ids: ids })
                }
              >
                <ShoppingBag size={16} /> Chuyển dòng chọn vào giỏ
              </button>
            </div>
          </section>
        );
      })}
      {edit && (
        <Modal
          title={edit.id ? "Chỉnh sửa BOM" : "Tạo BOM"}
          wide
          onClose={() => setEdit(null)}
        >
          <BomEditor
            bom={edit}
            products={data.products}
            onSave={async (b) => {
              await act("bom.save", b, true);
              setEdit(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}
function BomEditor({ bom, products, onSave }) {
  const [lines, setLines] = useState(bom.lines);
  const change = (i, k, v) =>
    setLines(lines.map((l, j) => (i === j ? { ...l, [k]: v } : l)));
  return (
    <Form
      initial={bom}
      fields={[
        field("name", "Tên dự án", "text", { required: true }),
        field("notes", "Ghi chú dự án", "textarea"),
      ]}
      onSubmit={(b) => onSave({ ...b, lines })}
    >
      <Table heads={["Linh kiện", "Số lượng", "Ghi chú", ""]}>
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
                <option value="">Chọn linh kiện</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} • {p.name}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <input
                className="qty"
                required
                type="number"
                min="1"
                value={l.quantity}
                onChange={(e) => change(i, "quantity", Number(e.target.value))}
              />
            </td>
            <td>
              <input
                value={l.note || ""}
                onChange={(e) => change(i, "note", e.target.value)}
              />
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
          setLines([...lines, { product_id: "", quantity: 1, note: "" }])
        }
      >
        + Thêm dòng
      </button>
    </Form>
  );
}
export function Orders({ data, act, onSale }) {
  const [filter, setFilter] = useState(""),
    [detail, setDetail] = useState(null);
  const orders = (data.orders || []).filter(
    (o) => !filter || o.status === filter,
  );
  const internal = data.user.role !== "customer",
    can =
      data.user.role === "owner" || data.user.permissions.includes("orders"),
    ship =
      data.user.role === "owner" || data.user.permissions.includes("shipping");
  const change = async (o, status) => {
    let note = "";
    if (["cancelled", "rejected"].includes(status)) {
      note = prompt("Nhập lý do:");
      if (!note) return;
    } else if (
      !confirm(
        status === "completed"
          ? "Xác nhận đã giao hàng và thu đủ tiền COD?"
          : `Chuyển đơn #${o.id} sang ${statuses[status]}?`,
      )
    )
      return;
    await act("order.status", {
      id: o.id,
      status,
      note,
      paid: status === "completed",
    });
  };
  return (
    <>
      <div className="section-title">
        <div>
          <h1>{internal ? "Xử lý đơn hàng" : "Đơn hàng của tôi"}</h1>
          <p className="muted">Theo dõi trạng thái và lịch sử từng đơn hàng.</p>
        </div>
        <select
          aria-label="Lọc trạng thái"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(statuses)
            .filter(([k]) => k !== "draft")
            .map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
        </select>
      </div>
      <div className="panel">
        <Table
          heads={[
            "Mã / thời gian",
            "Người nhận",
            "Tiền hàng",
            "Trạng thái",
            "Thao tác",
          ]}
        >
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <button className="text-button" onClick={() => setDetail(o)}>
                  ĐH-{String(o.id).padStart(5, "0")}
                </button>
                <small>{date(o.created_at)}</small>
              </td>
              <td>
                {o.recipient}
                <small>{o.phone}</small>
              </td>
              <td>{money(o.total)}</td>
              <td>
                <Badge status={o.status} />
              </td>
              <td>
                <div className="actions">
                  <button onClick={() => setDetail(o)}>Chi tiết</button>
                  {o.status === "pending" &&
                    (!internal ? (
                      <button
                        className="danger"
                        onClick={() => change(o, "cancelled")}
                      >
                        Hủy đơn
                      </button>
                    ) : (
                      can && (
                        <>
                          <button onClick={() => change(o, "confirmed")}>
                            Xác nhận
                          </button>
                          <button
                            className="danger"
                            onClick={() => change(o, "rejected")}
                          >
                            Từ chối
                          </button>
                        </>
                      )
                    ))}
                  {internal && o.status === "confirmed" && ship && (
                    <button onClick={() => onSale(o)}>Lập phiếu xuất</button>
                  )}
                  {internal && can && o.status === "shipped" && (
                    <button onClick={() => change(o, "delivering")}>
                      Đang giao
                    </button>
                  )}
                  {internal && can && o.status === "delivering" && (
                    <button onClick={() => change(o, "completed")}>
                      Hoàn thành / đã thu tiền
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
        {!orders.length && <Empty>Không có đơn phù hợp.</Empty>}
      </div>
      {detail && (
        <Modal
          title={"Đơn hàng #" + detail.id}
          wide
          onClose={() => setDetail(null)}
        >
          <p>
            <b>{detail.recipient}</b> · {detail.phone}
            <br />
            {detail.address}
          </p>
          <p>
            Ghi chú: {detail.notes || "—"} · Thanh toán:{" "}
            {detail.paid ? "Đã thu COD" : "Chưa thu COD"}
          </p>
          <Table
            heads={[
              "Mã",
              "Linh kiện",
              "Số lượng",
              "Đơn giá đã chốt",
              "Thành tiền",
            ]}
          >
            {detail.lines.map((l) => (
              <tr key={l.product_id}>
                <td>{l.sku}</td>
                <td>{l.name}</td>
                <td>{l.quantity}</td>
                <td>{money(l.price)}</td>
                <td>{money(l.price * l.quantity)}</td>
              </tr>
            ))}
          </Table>
          <h3>Lịch sử xử lý</h3>
          {detail.history.map((h, i) => (
            <p key={i}>
              <Badge status={h.status} /> {date(h.at)} · Tài khoản #{h.actor} ·{" "}
              {h.note}
            </p>
          ))}
        </Modal>
      )}
    </>
  );
}

import { useState } from "react";
import {
  Search,
  Plus,
  ArrowUpRight,
  SlidersHorizontal,
  GitCompareArrows,
  Cpu,
  CircuitBoard,
  Radio,
  Microchip,
} from "lucide-react";
import { money, norm, Modal, Empty, Table } from "./common.jsx";
export default function Catalog({ data, act, setModal }) {
  const [q, setQ] = useState(""),
    [cat, setCat] = useState(""),
    [min, setMin] = useState(""),
    [max, setMax] = useState(""),
    [available, setAvailable] = useState(false),
    [spec, setSpec] = useState(""),
    [value, setValue] = useState(""),
    [compare, setCompare] = useState([]),
    [showCompare, setShowCompare] = useState(false);
  const list = data.products.filter(
    (p) =>
      p.active &&
      norm(p.sku + " " + p.name).includes(norm(q)) &&
      (!cat || p.category_id === Number(cat)) &&
      (min === "" || p.price >= Number(min)) &&
      (max === "" || p.price <= Number(max)) &&
      (!available || p.available > 0) &&
      (!spec || norm(p.specs[spec]).includes(norm(value))),
  );
  const chosen = data.products.filter((p) => compare.includes(p.id));
  const category = data.categories.find((c) => c.id === Number(cat));
  const toggle = (p) => {
    if (compare.includes(p.id))
      return setCompare(compare.filter((id) => id !== p.id));
    if (chosen.length && chosen[0].category_id !== p.category_id)
      return alert("Chỉ so sánh linh kiện cùng danh mục.");
    if (compare.length === 4) return alert("Chọn tối đa 4 linh kiện.");
    setCompare([...compare, p.id]);
  };
  const add = async (p) => {
    if (!data.user) return setModal({ type: "login" });
    if (data.user.role !== "customer")
      return alert("Hãy dùng tài khoản khách hàng để mua sắm.");
    await act("cart.add", { product_id: p.id, quantity: 1 });
  };
  const icons = [Microchip, CircuitBoard, Cpu, Radio];
  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow">LINH KIỆN CHO Ý TƯỞNG TIẾP THEO</div>
          <h1>
            Từ một linh kiện.
            <br />
            Đến cả một <em>dự án.</em>
          </h1>
          <p>
            Tra cứu thông số, so sánh và lập BOM.
            <br />
            Mọi linh kiện bạn cần, trong cùng một không gian.
          </p>
          <a className="hero-link" href="#catalog">
            Khám phá danh mục <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="orbit one" />
          <span className="orbit two" />
          <div className="chip">
            <Cpu size={100} strokeWidth={1} />
            <span>
              COMPONENT
              <br />
              LAB / 31
            </span>
          </div>
          <span className="art-label top">DESIGN · BUILD · REPEAT</span>
          <span className="art-label bottom">01 / ELECTRONICS COLLECTION</span>
        </div>
      </section>
      <section id="catalog">
        <div className="section-title">
          <div>
            <div className="eyebrow muted">DANH MỤC SẢN PHẨM</div>
            <h2>Tìm đúng linh kiện</h2>
          </div>
          <span className="count-label">{list.length} sản phẩm</span>
        </div>
        <div className="catalog-layout">
          <aside className="filters">
            <h3>
              <SlidersHorizontal size={18} /> Bộ lọc
            </h3>
            <label>
              Danh mục
              <select
                value={cat}
                onChange={(e) => {
                  setCat(e.target.value);
                  setSpec("");
                  setValue("");
                }}
              >
                <option value="">Tất cả danh mục</option>
                {data.categories
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Giá từ (₫)
              <input
                type="number"
                min="0"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                placeholder="0"
              />
            </label>
            <label>
              Giá đến (₫)
              <input
                type="number"
                min="0"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                placeholder="Không giới hạn"
              />
            </label>
            {category && (
              <>
                <label>
                  Thuộc tính
                  <select
                    value={spec}
                    onChange={(e) => setSpec(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    {category.attributes.map((a) => (
                      <option key={a.name}>{a.name}</option>
                    ))}
                  </select>
                </label>
                {spec && (
                  <label>
                    Giá trị
                    <input
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="Ví dụ: DIP-40"
                    />
                  </label>
                )}
              </>
            )}
            <label className="check">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
              />{" "}
              Chỉ còn hàng
            </label>
            <button
              className="text-button"
              onClick={() => {
                setCat("");
                setMin("");
                setMax("");
                setAvailable(false);
                setSpec("");
                setValue("");
                setQ("");
              }}
            >
              Xóa bộ lọc
            </button>
            <div className="filter-note">
              Thông số rõ ràng.
              <br />
              Lựa chọn chủ động.
              <br />
              <strong>So sánh tối đa 4 mã.</strong>
            </div>
          </aside>
          <div>
            <div className="searchbar">
              <Search size={20} />
              <input
                aria-label="Tìm linh kiện"
                placeholder="Tìm theo tên hoặc mã linh kiện…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="product-grid">
              {list.map((p) => {
                const Icon = icons[(p.category_id - 1) % 4];
                return (
                  <article className="product-card" key={p.id}>
                    <button
                      className="product-visual"
                      onClick={() => setModal({ type: "detail", product: p })}
                    >
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <Icon size={66} strokeWidth={1.1} />
                      )}
                      <span className="sku">{p.sku}</span>
                      <span
                        className={
                          "stock-dot " + (p.available <= 0 ? "out" : "")
                        }
                      >
                        {p.available > 0 ? "Còn hàng" : "Hết hàng"}
                      </span>
                    </button>
                    <div className="product-body">
                      <small>{p.category}</small>
                      <button
                        className="product-name"
                        onClick={() => setModal({ type: "detail", product: p })}
                      >
                        {p.name}
                      </button>
                      <p>
                        {Object.entries(p.specs)
                          .slice(0, 2)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ") || "Thông số đang cập nhật"}
                      </p>
                      <div className="price-row">
                        <strong>{money(p.price)}</strong>
                        <button
                          className="add-button"
                          title="Thêm vào giỏ"
                          aria-label={"Thêm " + p.name + " vào giỏ"}
                          disabled={p.available <= 0}
                          onClick={() => add(p)}
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                      <label className="compare-check">
                        <input
                          type="checkbox"
                          checked={compare.includes(p.id)}
                          onChange={() => toggle(p)}
                        />{" "}
                        So sánh
                      </label>
                    </div>
                  </article>
                );
              })}
            </div>
            {!list.length && <Empty>Không tìm thấy linh kiện phù hợp.</Empty>}
          </div>
        </div>
      </section>
      {compare.length > 0 && (
        <div className="compare-bar">
          <GitCompareArrows size={20} />
          <span>Đã chọn {compare.length}/4 linh kiện</span>
          <button
            className="primary"
            disabled={compare.length < 2}
            onClick={() => setShowCompare(true)}
          >
            So sánh ngay
          </button>
          <button onClick={() => setCompare([])}>Bỏ chọn</button>
        </div>
      )}
      {showCompare && (
        <Modal
          title="So sánh linh kiện"
          wide
          onClose={() => setShowCompare(false)}
        >
          <p className="notice">
            So sánh thông số để hỗ trợ lựa chọn; không xác nhận khả năng thay
            thế tương thích.
          </p>
          <Table heads={["Thuộc tính", ...chosen.map((p) => p.name)]}>
            <tr>
              <td>Giá</td>
              {chosen.map((p) => (
                <td key={p.id}>{money(p.price)}</td>
              ))}
            </tr>
            <tr>
              <td>Khả dụng</td>
              {chosen.map((p) => (
                <td key={p.id}>{p.available}</td>
              ))}
            </tr>
            {[...new Set(chosen.flatMap((p) => Object.keys(p.specs)))].map(
              (k) => (
                <tr key={k}>
                  <td>{k}</td>
                  {chosen.map((p) => (
                    <td key={p.id}>{p.specs[k] || "Chưa có"}</td>
                  ))}
                </tr>
              ),
            )}
          </Table>
        </Modal>
      )}
    </>
  );
}
export function ProductDetail({ p }) {
  return (
    <>
      <div className="detail-title">
        <span className="badge">{p.sku}</span>
        <h2>{p.name}</h2>
        <strong className="big-price">{money(p.price)}</strong>
        <p>{p.description}</p>
        <p>
          Khả dụng: <b>{p.available}</b> {p.unit}
        </p>
      </div>
      <Table heads={["Thông số", "Giá trị"]}>
        {Object.entries(p.specs).map(([k, v]) => (
          <tr key={k}>
            <td>{k}</td>
            <td>
              {v || "Chưa có"} {p.attributes?.find((a) => a.name === k)?.unit}
            </td>
          </tr>
        ))}
      </Table>
      <div className="toolbar">
        {p.datasheet ? (
          <a
            className="button"
            href={p.datasheet}
            target="_blank"
            rel="noreferrer"
          >
            Mở tài liệu / datasheet ↗
          </a>
        ) : (
          <p>Chưa có datasheet.</p>
        )}
        {p.pinout && (
          <a
            className="button"
            href={p.pinout}
            target="_blank"
            rel="noreferrer"
          >
            Xem sơ đồ chân ↗
          </a>
        )}
      </div>
    </>
  );
}

import { useEffect, useState } from "react";
import {
  Cpu,
  Search,
  ShoppingBag,
  UserRound,
  LogOut,
  Layers,
  Package,
  ClipboardList,
  Warehouse,
  Users,
  ChartNoAxesCombined,
  Settings,
  History,
  MapPin,
  Truck,
  Tags,
  RefreshCw,
  Menu,
  X,
  CheckCircle2,
} from "lucide-react";
import { api, Modal, Form, field, permissions } from "./common.jsx";
import Catalog, { ProductDetail } from "./Catalog.jsx";
import { Cart, Boms, Orders } from "./Customer.jsx";
import {
  Products,
  ReferencePage,
  Inventory,
  Vouchers,
  Accounts,
  Reports,
  Logs,
} from "./Manage.jsx";
export default function App() {
  const [data, setData] = useState(null),
    [page, setPage] = useState("catalog"),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(null),
    [error, setError] = useState(""),
    [menu, setMenu] = useState(false),
    [sale, setSale] = useState(null),
    [busy, setBusy] = useState(false);
  const load = async () => {
    try {
      setData(await api("state"));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  const act = async (action, body, throwError = false, reload = true) => {
    try {
      setBusy(true);
      const result = await api("action/" + action, body);
      if (reload) {
        await load();
        setToast(result.message || "Đã lưu thành công.");
      }
      return result;
    } catch (e) {
      setToast({ error: e.message });
      if (throwError) throw e;
      return null;
    } finally {
      setBusy(false);
    }
  };
  if (!data)
    return (
      <div className="loading">
        <Cpu size={44} />
        <h2>
          {error ? "Chưa kết nối được máy chủ" : "Đang mở Component Lab…"}
        </h2>
        <p>{error || "Đang tải dữ liệu cửa hàng"}</p>
        <button onClick={load}>Thử lại</button>
      </div>
    );
  const user = data.user,
    internal = user && user.role !== "customer",
    isOwner = user?.role === "owner";
  const can = (p) =>
    isOwner || (user?.role === "employee" && user.permissions.includes(p));
  const nav = [
    ["catalog", "Danh mục linh kiện", Cpu, true],
    ["cart", "Giỏ hàng", ShoppingBag, user?.role === "customer"],
    ["boms", "BOM dự án", Layers, user?.role === "customer"],
    [
      "orders",
      internal ? "Xử lý đơn hàng" : "Đơn hàng của tôi",
      ClipboardList,
      user?.role === "customer" || can("orders") || can("shipping"),
    ],
    ["products", "Quản lý linh kiện", Package, can("products")],
    ["category", "Danh mục & thuộc tính", Tags, can("categories")],
    ["inventory", "Tồn kho & cảnh báo", Warehouse, can("inventory")],
    [
      "vouchers",
      "Phiếu nhập – xuất",
      Truck,
      can("receiving") || can("shipping") || can("inventory"),
    ],
    ["location", "Vị trí kho", MapPin, can("inventory")],
    ["supplier", "Nhà cung cấp", Truck, can("suppliers")],
    ["movements", "Lịch sử kho", History, can("inventory")],
    ["users", "Tài khoản & quyền", Users, isOwner],
    ["report", "Báo cáo bán hàng", ChartNoAxesCombined, isOwner],
    ["audit", "Nhật ký hoạt động", History, isOwner],
    ["settings", "Cấu hình", Settings, isOwner],
  ];
  const allowed = nav.some((n) => n[0] === page && n[3]);
  const currentPage = allowed ? page : "catalog";
  const go = (p) => {
    setPage(p);
    setMenu(false);
  };
  const onSale = (o) => {
    const existing = data.vouchers?.find((v) => v.order_id === o.id);
    if (existing) {
      setSale(existing);
    } else
      setSale({
        type: "sale",
        order_id: o.id,
        reason: "Xuất bán đơn #" + o.id,
        lines: o.lines.map((l) => ({
          product_id: l.product_id,
          quantity: l.quantity,
          location_id: "",
        })),
      });
    setPage("vouchers");
  };
  return (
    <>
      <div className="topline">
        <span>COMPONENT LAB / NHÓM 31</span>
        <span>Tra cứu · Mua bán · Quản lý kho</span>
      </div>
      <header className="site-header">
        <button className="brand" onClick={() => go("catalog")}>
          <span className="brand-icon">
            <Cpu size={24} />
          </span>
          <span>
            component<span className="brand-light">lab</span>
            <small>ELECTRONICS & IDEAS</small>
          </span>
        </button>
        <div className="header-links">
          <button
            className={currentPage === "catalog" ? "selected" : ""}
            onClick={() => go("catalog")}
          >
            Linh kiện
          </button>
          {user?.role === "customer" && (
            <>
              <button onClick={() => go("boms")}>BOM dự án</button>
              <button onClick={() => go("orders")}>Đơn hàng</button>
            </>
          )}
          {internal && (
            <span className="badge">
              {isOwner ? "Chủ cửa hàng" : "Nhân viên"}
            </span>
          )}
        </div>
        <div className="header-actions">
          {user?.role === "customer" && (
            <button
              className="cart-button"
              onClick={() => go("cart")}
              aria-label="Giỏ hàng"
            >
              <ShoppingBag size={20} />
              <span>
                {(data.cart || []).reduce((s, l) => s + l.quantity, 0)}
              </span>
            </button>
          )}
          {user ? (
            <>
              <button onClick={() => setModal({ type: "profile" })}>
                <UserRound size={17} />
                <span className="user-name">{user.name}</span>
              </button>
              <button
                className="icon-button"
                aria-label="Đăng xuất"
                onClick={async () => {
                  await api("logout", {});
                  setPage("catalog");
                  await load();
                }}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button onClick={() => setModal({ type: "login" })}>
              <UserRound size={17} /> Đăng nhập
            </button>
          )}
          <button
            className="menu-toggle"
            aria-label="Menu"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>
      <div className={"workspace " + (internal ? "internal" : "")}>
        {(internal || menu) && (
          <aside className={"sidebar " + (menu ? "open" : "")}>
            <div className="eyebrow muted">
              {internal ? "KHÔNG GIAN QUẢN LÝ" : "ĐIỀU HƯỚNG"}
            </div>
            {nav
              .filter((n) => n[3])
              .map(([key, label, Icon]) => (
                <button
                  key={key}
                  className={currentPage === key ? "active" : ""}
                  onClick={() => go(key)}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
          </aside>
        )}
        <main className="main-content">
          {error && <div className="error">{error}</div>}
          {currentPage !== "catalog" && (
            <div className="breadcrumb">
              <span>
                Component Lab / {nav.find((n) => n[0] === currentPage)?.[1]}
              </span>
              <button className="text-button" onClick={load}>
                <RefreshCw size={14} /> Tải lại
              </button>
            </div>
          )}
          {currentPage === "catalog" && (
            <Catalog data={data} act={act} setModal={setModal} />
          )}
          {currentPage === "cart" && <Cart data={data} act={act} />}
          {currentPage === "boms" && <Boms data={data} act={act} />}
          {currentPage === "orders" && (
            <Orders data={data} act={act} onSale={onSale} />
          )}
          {currentPage === "products" && <Products data={data} act={act} />}
          {["category", "supplier", "location"].includes(currentPage) && (
            <ReferencePage
              key={currentPage}
              kind={currentPage}
              data={data}
              act={act}
            />
          )}
          {currentPage === "inventory" && <Inventory data={data} />}
          {currentPage === "vouchers" && (
            <Vouchers
              key={sale ? JSON.stringify(sale) : "vouchers"}
              initial={sale}
              onInitialUsed={() => setSale(null)}
              data={data}
              act={act}
            />
          )}
          {currentPage === "users" && <Accounts data={data} act={act} />}
          {currentPage === "report" && <Reports act={act} />}
          {["movements", "audit"].includes(currentPage) && (
            <Logs key={currentPage} kind={currentPage} act={act} />
          )}
          {currentPage === "settings" && (
            <>
              <h1>Cấu hình cửa hàng</h1>
              <div className="panel">
                <Form
                  initial={data.settings}
                  fields={[
                    field("store_name", "Tên cửa hàng", "text", {
                      required: true,
                    }),
                    field("phone", "Điện thoại"),
                    field("address", "Địa chỉ", "textarea"),
                    field(
                      "low_stock",
                      "Ngưỡng cảnh báo tồn khả dụng",
                      "number",
                      { min: 0, required: true },
                    ),
                  ]}
                  onSubmit={(b) => act("settings.save", b, true)}
                />
              </div>
            </>
          )}
        </main>
      </div>
      <footer>
        <b>{data.settings.store_name}</b>
        <span>
          {data.settings.address}{" "}
          {data.settings.phone && "· " + data.settings.phone}
        </span>
        <small>Đồ án Nhóm 31 · Dữ liệu khởi tạo dùng cho minh họa</small>
      </footer>
      {busy && <div className="busy-line" />}
      {toast && (
        <div className={"toast " + (toast.error ? "bad" : "")} role="status">
          {toast.error || (
            <>
              <CheckCircle2 size={18} /> {toast}
            </>
          )}
          <button onClick={() => setToast(null)} aria-label="Đóng thông báo">
            <X size={15} />
          </button>
        </div>
      )}
      {modal && (
        <Modal
          title={
            {
              login: "Chào mừng trở lại",
              register: "Tạo tài khoản khách hàng",
              profile: "Hồ sơ cá nhân",
              detail: "Thông tin linh kiện",
            }[modal.type]
          }
          wide={modal.type === "detail"}
          onClose={() => setModal(null)}
        >
          {["login", "register"].includes(modal.type) && (
            <>
              <p className="muted">
                {modal.type === "login"
                  ? "Đăng nhập để lưu BOM, đặt hàng hoặc quản lý cửa hàng."
                  : "Tài khoản đăng ký công khai chỉ có vai trò khách hàng."}
              </p>
              <Form
                key={modal.type}
                fields={[
                  ...(modal.type === "register"
                    ? [field("name", "Họ tên", "text", { required: true })]
                    : []),
                  field("email", "Email", "email", { required: true }),
                  field("password", "Mật khẩu", "password", {
                    required: true,
                    minLength: modal.type === "register" ? 10 : undefined,
                  }),
                ]}
                submit={modal.type === "login" ? "Đăng nhập" : "Đăng ký"}
                onSubmit={async (b) => {
                  await api(modal.type, b);
                  if (modal.type === "register") {
                    setModal({ type: "login" });
                    setToast("Đăng ký thành công. Hãy đăng nhập.");
                  } else {
                    await load();
                    setModal(null);
                  }
                }}
              />
              <button
                className="text-button"
                onClick={() =>
                  setModal({
                    type: modal.type === "login" ? "register" : "login",
                  })
                }
              >
                {modal.type === "login"
                  ? "Chưa có tài khoản? Đăng ký"
                  : "Đã có tài khoản? Đăng nhập"}
              </button>
            </>
          )}
          {modal.type === "profile" && (
            <Form
              initial={user}
              fields={[
                field("name", "Họ tên", "text", { required: true }),
                field("phone", "Điện thoại"),
                field("address", "Địa chỉ", "textarea"),
                field(
                  "old_password",
                  "Mật khẩu hiện tại (khi đổi)",
                  "password",
                ),
                field(
                  "new_password",
                  "Mật khẩu mới (không đổi thì để trống)",
                  "password",
                  { minLength: 10 },
                ),
              ]}
              onSubmit={async (b) => {
                await act("profile", b, true);
                setModal(null);
              }}
            />
          )}
          {modal.type === "detail" && <ProductDetail p={modal.product} />}
        </Modal>
      )}
    </>
  );
}

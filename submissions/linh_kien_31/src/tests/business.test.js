import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { openDb, one, rows } from "../server/db.js";
import { initialize } from "../server/seed.js";
import { command, catalog } from "../server/service.js";
import { hashPassword } from "../server/security.js";
import { createApp } from "../server/app.js";
let db, owner, employee, c1, c2, server, base, customerCookie, ownerCookie;
const run = (u, a, b) => db.transaction((tx) => command(tx, u, a, b));
const get = (id) => one(db, "SELECT * FROM orders WHERE id=$1", [id]);
const product = async (id) =>
  (await catalog(db, true)).find((p) => p.id === id);
const checkout = async (u, pid, qty, key) => {
  await run(u, "cart.save", { lines: [{ product_id: pid, quantity: qty }] });
  return run(u, "order.create", {
    recipient: "Khách thử",
    phone: "0901234567",
    address: "Hà Nội",
    expected_total: (await product(pid)).price * qty,
    request_key: key,
  });
};
const request = async (path, body, cookie) => {
  const r = await fetch(base + "/api/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      "X-App-Request": "nhom31",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return {
    status: r.status,
    data: await r.json(),
    cookie: r.headers.get("set-cookie")?.split(";")[0],
  };
};
before(async () => {
  db = await openDb({ dir: "memory://" });
  await initialize(db, { password: "Owner-test-123", credentialDir: null });
  owner = await one(db, "SELECT * FROM users WHERE role='owner'");
  for (const [name, role] of [
    ["Khách 1", "customer"],
    ["Khách 2", "customer"],
    ["Nhân viên", "employee"],
  ])
    await db.query(
      "INSERT INTO users(name,email,role,password) VALUES($1,$2,$3,$4)",
      [
        name,
        role + name.replaceAll(" ", "").toLowerCase() + "@test.local",
        role,
        await hashPassword("Customer-123"),
      ],
    );
  [c1, c2, employee] = await rows(
    db,
    "SELECT * FROM users WHERE id>1 ORDER BY id",
  );
  server = createApp(db).listen(0, "127.0.0.1");
  await new Promise((r) => server.on("listening", r));
  base = "http://127.0.0.1:" + server.address().port;
});
after(async () => {
  await new Promise((r) => server.close(r));
  await db.close();
});
test("01 Public registration cannot choose owner role", async () => {
  const r = await request("register", {
    name: "Attacker",
    email: "attacker@test.local",
    password: "Customer-123",
    role: "owner",
    permissions: ["shipping"],
  });
  assert.equal(r.status, 200);
  const u = await one(
    db,
    "SELECT * FROM users WHERE email='attacker@test.local'",
  );
  assert.equal(u.role, "customer");
  assert.deepEqual(u.permissions, []);
  assert.notEqual(u.password, "Customer-123");
});
test("02 Login and authenticated session", async () => {
  let r = await request("login", { email: c1.email, password: "Customer-123" });
  assert.equal(r.status, 200);
  customerCookie = r.cookie;
  r = await request("login", {
    email: owner.email,
    password: "Owner-test-123",
  });
  ownerCookie = r.cookie;
  assert.equal(
    (await request("state", undefined, customerCookie)).data.user.id,
    c1.id,
  );
});
test("03 Unauthenticated / customer / employee admin calls rejected", async () => {
  assert.equal(
    (await request("action/price.save", { id: 1, price: 1 })).status,
    401,
  );
  assert.equal(
    (await request("action/price.save", { id: 1, price: 1 }, customerCookie))
      .status,
    403,
  );
  await assert.rejects(run(employee, "price.save", { id: 1, price: 1 }), /chủ/);
});
test("04 Cart and BOM do not reserve stock", async () => {
  const p = await product(1);
  await run(c1, "cart.save", { lines: [{ product_id: 1, quantity: 2 }] });
  await run(c1, "bom.save", {
    name: "Test BOM",
    lines: [{ product_id: 1, quantity: 2, note: "Thử" }],
  });
  assert.equal((await product(1)).reserved, p.reserved);
});
let orderId;
test("05 Checkout atomically reserves but does not reduce physical stock", async () => {
  const p = await product(1);
  orderId = (await checkout(c1, 1, 2, "order-1")).id;
  const now = await product(1);
  assert.equal(now.actual, p.actual);
  assert.equal(now.reserved, p.reserved + 2);
  assert.equal((await get(orderId)).status, "pending");
});
test("06 Retry same checkout three times returns same order", async () => {
  const b = {
    recipient: "Khách thử",
    phone: "0901234567",
    address: "Hà Nội",
    expected_total: 170000,
    request_key: "order-1",
  };
  for (let i = 0; i < 3; i++)
    assert.equal((await run(c1, "order.create", b)).id, orderId);
  assert.equal((await product(1)).reserved, 2);
  await assert.rejects(
    run(c1, "order.create", { ...b, address: "Khác" }),
    /nội dung khác/,
  );
});
test("07 Price snapshot is immutable and checkout detects changed price", async () => {
  await run(c2, "cart.save", { lines: [{ product_id: 1, quantity: 1 }] });
  await run(owner, "price.save", { id: 1, price: 90000 });
  assert.equal((await get(orderId)).lines[0].price, 85000);
  await assert.rejects(
    run(c2, "order.create", {
      recipient: "A",
      phone: "0901234567",
      address: "HN",
      request_key: "price-change",
      expected_total: 85000,
    }),
    /Giá đã thay đổi/,
  );
  assert.equal((await product(1)).reserved, 2);
});
test("08 Own data enforcement for orders and BOM", async () => {
  await assert.rejects(
    run(c2, "order.status", { id: orderId, status: "cancelled", note: "Test" }),
    /người khác/,
  );
  const bom = await one(db, "SELECT * FROM boms WHERE user_id=$1", [c1.id]);
  await assert.rejects(run(c2, "bom.delete", { id: bom.id }), /Không tìm/);
});
test("09 Invalid transitions rejected", async () => {
  await assert.rejects(
    run(owner, "order.status", {
      id: orderId,
      status: "completed",
      paid: true,
    }),
    /không hợp lệ/,
  );
});
test("10 Confirmed order cannot be cancelled", async () => {
  await run(owner, "order.status", { id: orderId, status: "confirmed" });
  await assert.rejects(
    run(c1, "order.status", { id: orderId, status: "cancelled", note: "Test" }),
    /không hợp lệ/,
  );
});
let saleId;
test("11 Draft voucher has no stock effect", async () => {
  const before = await product(1);
  saleId = (
    await run(owner, "voucher.save", {
      type: "sale",
      order_id: orderId,
      lines: [{ product_id: 1, location_id: 1, quantity: 2 }],
    })
  ).id;
  assert.deepEqual(await product(1), before);
});
test("12 Sale confirmation decreases physical and releases reservation exactly once", async () => {
  const before = await product(1);
  await Promise.all(
    [1, 2, 3].map(() => run(owner, "voucher.confirm", { id: saleId })),
  );
  const now = await product(1);
  assert.equal(now.actual, before.actual - 2);
  assert.equal(now.reserved, 0);
  assert.equal((await get(orderId)).status, "shipped");
  const n = await one(
    db,
    "SELECT COUNT(*) n FROM movements WHERE voucher_id=$1",
    [saleId],
  );
  assert.equal(Number(n.n), 1);
});
test("13 Confirmed vouchers cannot be changed; duplicate sale forbidden", async () => {
  await assert.rejects(
    run(owner, "voucher.save", {
      id: saleId,
      type: "sale",
      order_id: orderId,
      lines: [],
    }),
    /Không sửa/,
  );
  await assert.rejects(
    run(owner, "voucher.save", {
      type: "sale",
      order_id: orderId,
      lines: [{ product_id: 1, quantity: 2, location_id: 1 }],
    }),
    /đã xác nhận/,
  );
});
test("14 Revenue only recognizes completed COD orders", async () => {
  let r = await run(owner, "report", {});
  assert.equal(r.revenue, 0);
  await run(owner, "order.status", { id: orderId, status: "delivering" });
  await assert.rejects(
    run(owner, "order.status", { id: orderId, status: "completed" }),
    /thu tiền/,
  );
  await run(owner, "order.status", {
    id: orderId,
    status: "completed",
    paid: true,
  });
  r = await run(owner, "report", {});
  assert.equal(r.revenue, 170000);
  assert.equal(r.count, 1);
});
test("15 Cancellation releases once, preserves history", async () => {
  const id = (await checkout(c1, 2, 1, "cancel-me")).id;
  await run(c1, "order.status", {
    id,
    status: "cancelled",
    note: "Thay đổi nhu cầu",
  });
  await run(c1, "order.status", {
    id,
    status: "cancelled",
    note: "Thay đổi nhu cầu",
  });
  assert.equal((await product(2)).reserved, 0);
  assert.equal((await get(id)).history.length, 2);
});
test("16 Receiving stock only on confirmation and idempotent", async () => {
  const p = await product(2);
  const v = await run(owner, "voucher.save", {
    type: "in",
    supplier_id: 1,
    lines: [{ product_id: 2, location_id: 2, quantity: 5, cost: 1000 }],
  });
  assert.equal((await product(2)).actual, p.actual);
  await run(owner, "voucher.confirm", v);
  await run(owner, "voucher.confirm", v);
  assert.equal((await product(2)).actual, p.actual + 5);
});
test("17 Transfer conserves total and records both locations", async () => {
  const p = await product(2);
  const v = await run(owner, "voucher.save", {
    type: "transfer",
    reason: "Sắp xếp kho",
    lines: [{ product_id: 2, location_id: 2, target_id: 1, quantity: 3 }],
  });
  await run(owner, "voucher.confirm", v);
  assert.equal((await product(2)).actual, p.actual);
  assert.equal(
    Number(
      (
        await one(db, "SELECT COUNT(*) n FROM movements WHERE voucher_id=$1", [
          v.id,
        ])
      ).n,
    ),
    2,
  );
});
test("18 Failed multi-line voucher leaves all stock unchanged", async () => {
  const before = await catalog(db, true);
  const v = await run(owner, "voucher.save", {
    type: "out",
    reason: "Thử lỗi",
    lines: [
      { product_id: 1, location_id: 1, quantity: 1 },
      { product_id: 2, location_id: 2, quantity: 999 },
    ],
  });
  await assert.rejects(run(owner, "voucher.confirm", v), /Không đủ/);
  assert.deepEqual(await catalog(db, true), before);
  assert.equal(
    Number(
      (
        await one(db, "SELECT COUNT(*) n FROM movements WHERE voucher_id=$1", [
          v.id,
        ])
      ).n,
    ),
    0,
  );
});
test("19 Adjustment detects stale stock and cannot go below reservation", async () => {
  await checkout(c2, 2, 1, "reserve-adjust");
  const s = await one(
    db,
    "SELECT quantity FROM stock WHERE product_id=2 AND location_id=1",
  );
  let v = await run(owner, "voucher.save", {
    type: "adjust",
    reason: "Kiểm kê",
    lines: [
      { product_id: 2, location_id: 1, expected: s.quantity - 1, count: 1 },
    ],
  });
  await assert.rejects(run(owner, "voucher.confirm", v), /Tồn đã thay đổi/);
  v = await run(owner, "voucher.save", {
    type: "adjust",
    reason: "Kiểm kê",
    lines: [
      { product_id: 2, location_id: 1, expected: s.quantity, count: 0 },
      { product_id: 2, location_id: 2, expected: 2, count: 0 },
    ],
  });
  await assert.rejects(run(owner, "voucher.confirm", v), /lượng đang giữ/);
});
test("20 Race for last unit: only one of 20 checkouts succeeds", async () => {
  const p = await product(3);
  const v = await run(owner, "voucher.save", {
    type: "adjust",
    reason: "Chuẩn bị kiểm thử cạnh tranh",
    lines: [{ product_id: 3, location_id: 1, expected: p.actual, count: 1 }],
  });
  await run(owner, "voucher.confirm", v);
  const users = [];
  for (let i = 0; i < 20; i++) {
    const u = await one(
      db,
      "INSERT INTO users(email,name,password,role) VALUES($1,'Race','unused','customer') RETURNING *",
      [`race${i}@test.local`],
    );
    await run(u, "cart.save", { lines: [{ product_id: 3, quantity: 1 }] });
    users.push(u);
  }
  const results = await Promise.allSettled(
    users.map((u, i) =>
      run(u, "order.create", {
        recipient: "Race",
        phone: "0901234567",
        address: "HN",
        expected_total: 95000,
        request_key: "race-" + i,
      }),
    ),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await product(3)).available, 0);
});
test("21 Employee price injection blocked even with product permission", async () => {
  await run(owner, "user.permissions", {
    id: employee.id,
    version: employee.version,
    permissions: ["products"],
  });
  employee = await one(db, "SELECT * FROM users WHERE id=$1", [employee.id]);
  await assert.rejects(
    run(employee, "product.save", { ...(await product(1)), price: 1 }),
    /sửa giá/,
  );
});
test("22 Permission revocation effective in existing session", async () => {
  const r = await request("login", {
    email: employee.email,
    password: "Customer-123",
  });
  const cookie = r.cookie;
  assert.equal(
    (
      await request(
        "action/product.save",
        { sku: "TEST", name: "Test", category_id: 1, unit: "cái", specs: {} },
        cookie,
      )
    ).status,
    200,
  );
  await run(owner, "user.permissions", {
    id: employee.id,
    version: employee.version,
    permissions: [],
  });
  assert.equal(
    (
      await request(
        "action/product.save",
        { sku: "TEST2", name: "Test", category_id: 1, unit: "cái", specs: {} },
        cookie,
      )
    ).status,
    403,
  );
});
test("23 Locked customer loses session but existing orders stay", async () => {
  const count = Number(
    (await one(db, "SELECT COUNT(*) n FROM orders WHERE user_id=$1", [c1.id]))
      .n,
  );
  await run(owner, "user.active", {
    id: c1.id,
    version: c1.version,
    active: false,
    reason: "Test khóa",
  });
  assert.equal(
    (await request("action/cart.save", { lines: [] }, customerCookie)).status,
    401,
  );
  assert.equal(
    Number(
      (await one(db, "SELECT COUNT(*) n FROM orders WHERE user_id=$1", [c1.id]))
        .n,
    ),
    count,
  );
});
test("24 Owner account protected and audit excludes password", async () => {
  await assert.rejects(
    run(owner, "user.active", {
      id: owner.id,
      version: owner.version,
      active: false,
      reason: "test",
    }),
    /tài khoản chủ/,
  );
  const log = JSON.stringify(await rows(db, "SELECT * FROM audit"));
  assert.ok(!log.includes("Owner-test-123"));
  assert.ok(!log.includes(employee.password));
});
test("25 Negative quantities / invalid date ranges rejected", async () => {
  await assert.rejects(
    run(c2, "cart.save", { lines: [{ product_id: 1, quantity: -1 }] }),
    /Số lượng/,
  );
  await assert.rejects(
    run(owner, "report", { from: "2026-12-31", to: "2026-01-01" }),
    /Khoảng ngày/,
  );
});
test("26 CSRF missing header and foreign origin rejected", async () => {
  let r = await fetch(base + "/api/logout", {
    method: "POST",
    headers: { Cookie: ownerCookie },
  });
  assert.equal(r.status, 403);
  r = await fetch(base + "/api/logout", {
    method: "POST",
    headers: {
      Cookie: ownerCookie,
      "X-App-Request": "nhom31",
      Origin: "https://evil.example",
    },
  });
  assert.equal(r.status, 403);
});
test("27 Database transaction rollback after actual write", async () => {
  const before = (await product(1)).actual;
  await assert.rejects(
    db.transaction(async (tx) => {
      await tx.query(
        "UPDATE stock SET quantity=quantity+10 WHERE product_id=1",
      );
      throw new Error("Injected failure");
    }),
    /Injected/,
  );
  assert.equal((await product(1)).actual, before);
});
test("28 Backup restore into clean database preserves orders and stock", async () => {
  const { exportData, importData } = await import("../server/backup.js");
  const payload = JSON.parse(JSON.stringify(await exportData(db)));
  const clean = await openDb({ dir: "memory://" });
  try {
    await importData(clean, payload);
    assert.deepEqual(await catalog(clean, true), await catalog(db, true));
    assert.equal(
      Number((await one(clean, "SELECT COUNT(*) n FROM orders")).n),
      Number((await one(db, "SELECT COUNT(*) n FROM orders")).n),
    );
    assert.equal(
      (await one(clean, "SELECT * FROM users WHERE id=1")).password,
      owner.password,
    );
    await assert.rejects(importData(clean, payload), /trống/);
  } finally {
    await clean.close();
  }
});
test("29 Sale works when available is zero because the stock belongs to that reservation", async () => {
  const o = await one(
    db,
    "SELECT * FROM orders WHERE status='pending' AND lines @> '[{\"product_id\":3}]'::jsonb LIMIT 1",
  );
  assert.equal((await product(3)).available, 0);
  await run(owner, "order.status", { id: o.id, status: "confirmed" });
  const v = await run(owner, "voucher.save", {
    type: "sale",
    order_id: o.id,
    lines: [{ product_id: 3, quantity: 1, location_id: 1 }],
  });
  await run(owner, "voucher.confirm", v);
  assert.equal((await product(3)).actual, 0);
  assert.equal((await product(3)).reserved, 0);
});
test("30 Concurrent add-to-cart increments instead of losing updates", async () => {
  await run(c2, "cart.save", { lines: [] });
  await Promise.all(
    [1, 2, 3].map(() => run(c2, "cart.add", { product_id: 1, quantity: 1 })),
  );
  const cart = await one(db, "SELECT lines FROM carts WHERE user_id=$1", [
    c2.id,
  ]);
  assert.equal(cart.lines[0].quantity, 3);
});
test("31 File database survives close and reopen; exclusive data lock works", async () => {
  const { mkdtemp, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { acquireDataLock } = await import("../server/lock.js");
  const dir = await mkdtemp(join(tmpdir(), "nhom31-test-"));
  try {
    const release = await acquireDataLock(dir);
    await assert.rejects(acquireDataLock(dir), /tiến trình/);
    let disk = await openDb({ dir: join(dir, "db") });
    await disk.exec(
      "CREATE TABLE persistence_check(id int); INSERT INTO persistence_check VALUES(31)",
    );
    await disk.close();
    disk = await openDb({ dir: join(dir, "db") });
    assert.equal((await one(disk, "SELECT * FROM persistence_check")).id, 31);
    await disk.close();
    await release();
    const again = await acquireDataLock(dir);
    await again();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { one } from "./db.js";
import { hashPassword } from "./security.js";
export async function initialize(
  db,
  { password, credentialDir = "./data", demo = true } = {},
) {
  await db.exec(
    await readFile(new URL("./schema.sql", import.meta.url), "utf8"),
  );
  if (await one(db, "SELECT id FROM users LIMIT 1")) return;
  const pass =
    password ||
    process.env.OWNER_PASSWORD ||
    randomBytes(15).toString("base64url");
  await db.transaction(async (tx) => {
    await tx.query(
      "INSERT INTO users(email,name,password,role) VALUES($1,$2,$3,'owner')",
      ["owner@nhom31.local", "Chủ cửa hàng", await hashPassword(pass)],
    );
    await tx.query(
      "INSERT INTO settings(id,store_name,phone,address,low_stock) VALUES(1,'Component Lab','', 'Hà Nội',10)",
    );
    await tx.query(
      "INSERT INTO categories(name,attributes) VALUES('Vi điều khiển',$1),('Bo phát triển',$2),('Linh kiện thụ động',$3),('Cảm biến & module',$4)",
      [
        JSON.stringify([
          { name: "Kiến trúc", unit: "bit" },
          { name: "Đóng gói", unit: "" },
        ]),
        JSON.stringify([
          { name: "Vi điều khiển", unit: "" },
          { name: "Điện áp logic", unit: "V" },
        ]),
        JSON.stringify([
          { name: "Giá trị", unit: "" },
          { name: "Sai số", unit: "%" },
        ]),
        JSON.stringify([
          { name: "Giao tiếp", unit: "" },
          { name: "Nguồn cấp", unit: "V" },
        ]),
      ],
    );
    await tx.query(
      "INSERT INTO locations(name) VALUES('A1 • Tầng 1'),('A2 • Tầng 2'),('B1 • Module')",
    );
    await tx.query(
      "INSERT INTO suppliers(name,phone,address) VALUES('Nhà cung cấp mẫu','','Dữ liệu minh họa')",
    );
    if (demo) {
      const data = [
        [
          "PIC16F877A",
          "PIC16F877A • DIP-40",
          1,
          85000,
          "Vi điều khiển 8 bit cho thực hành hệ thống nhúng.",
          { "Kiến trúc": "8", "Đóng gói": "DIP-40" },
          "https://www.microchip.com/en-us/product/PIC16F877A",
        ],
        [
          "ATMEGA328P",
          "ATmega328P • DIP-28",
          1,
          65000,
          "Vi điều khiển AVR dùng trong nhiều dự án học tập.",
          { "Kiến trúc": "8", "Đóng gói": "DIP-28" },
          "https://www.microchip.com/en-us/product/ATmega328P",
        ],
        [
          "ARD-NANO",
          "Arduino Nano",
          2,
          95000,
          "Bo phát triển nhỏ gọn dành cho mạch thử nghiệm.",
          { "Vi điều khiển": "ATmega328P", "Điện áp logic": "5" },
          "",
        ],
        [
          "ESP32-DEV",
          "ESP32 DevKit",
          2,
          125000,
          "Bo phát triển kết nối Wi-Fi và Bluetooth.",
          { "Vi điều khiển": "ESP32", "Điện áp logic": "3.3" },
          "",
        ],
        [
          "RES-10K",
          "Điện trở 10 kΩ",
          3,
          1000,
          "Điện trở dùng cho mạch kéo lên và phân áp.",
          { "Giá trị": "10 kΩ", "Sai số": "5" },
          "",
        ],
        [
          "CAP-100N",
          "Tụ gốm 100 nF",
          3,
          1500,
          "Tụ điện dùng trong mạch lọc và tách nguồn.",
          { "Giá trị": "100 nF", "Sai số": "10" },
          "",
        ],
        [
          "RTC-DS3231",
          "Module RTC DS3231",
          4,
          45000,
          "Module đồng hồ thời gian thực giao tiếp I2C.",
          { "Giao tiếp": "I2C", "Nguồn cấp": "3.3–5" },
          "",
        ],
        [
          "LCD-1602",
          "LCD1602 I2C",
          4,
          55000,
          "Màn hình ký tự 16 × 2 kèm module I2C.",
          { "Giao tiếp": "I2C", "Nguồn cấp": "5" },
          "",
        ],
      ];
      for (const [sku, name, cat, price, description, specs, datasheet] of data)
        await tx.query(
          "INSERT INTO products(sku,name,category_id,price,description,specs,datasheet) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [
            sku,
            name,
            cat,
            price,
            description,
            JSON.stringify(specs),
            datasheet,
          ],
        );
      const lines = data.map((_, i) => ({
        product_id: i + 1,
        location_id: i < 4 ? 1 : 3,
        quantity: i === 1 ? 8 : 50,
        cost: 0,
      }));
      const v = await one(
        tx,
        "INSERT INTO vouchers(type,status,supplier_id,reason,lines,created_by,confirmed_at) VALUES('in','confirmed',1,'Tồn đầu kỳ mẫu để chạy demo',$1,1,NOW()) RETURNING id",
        [JSON.stringify(lines)],
      );
      for (const l of lines) {
        await tx.query("INSERT INTO stock VALUES($1,$2,$3)", [
          l.product_id,
          l.location_id,
          l.quantity,
        ]);
        await tx.query(
          "INSERT INTO movements(voucher_id,product_id,location_id,delta,balance,actor) VALUES($1,$2,$3,$4,$4,1)",
          [v.id, l.product_id, l.location_id, l.quantity],
        );
      }
    }
  });
  if (credentialDir) {
    await mkdir(credentialDir, { recursive: true });
    await writeFile(
      `${credentialDir}/first-login.txt`,
      `TAI KHOAN CHU CUA HANG\nEmail: owner@nhom31.local\nMat khau: ${pass}\n\nDoi mat khau trong Ho so sau khi dang nhap. Khong chia se file nay.\n`,
      { mode: 0o600 },
    );
    console.log(
      `Đã khởi tạo. Thông tin đăng nhập nằm trong ${credentialDir}/first-login.txt`,
    );
  }
  return pass;
}

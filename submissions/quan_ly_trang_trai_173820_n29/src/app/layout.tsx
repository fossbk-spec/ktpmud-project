import type { Metadata } from "next";
import "./globals.css";
import "../farm/readability.css";
import "../farm/layout.css";

export const metadata: Metadata = {
  title: "HaHa | Quản lý trang trại",
  description: "Chăm đàn khỏe, quản trại nhàn. Quản lý đàn gà, chuồng trại, nhật ký, kho và tài chính.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}

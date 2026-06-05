import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "출고관리 데모", description: "QR 출고관리" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}

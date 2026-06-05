"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { decodeQr } from "@/lib/qr";

export default function ScanPage() {
  const router = useRouter();
  const ref = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const scanner = new Html5Qrcode("reader");
    ref.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (text) => {
          try {
            const fields = decodeQr(text);
            scanner.stop().catch(() => {});
            const q = new URLSearchParams(fields as Record<string, string>).toString();
            router.push(`/entry?${q}`);
          } catch {
            setError("QR 인식 실패 — 다시 스캔하세요.");
          }
        },
        () => {}
      )
      .catch(() => setError("카메라를 시작할 수 없습니다. 권한을 확인하세요."));
    return () => {
      ref.current?.stop().catch(() => {});
    };
  }, [router]);

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-3 text-xl font-bold">QR 스캔</h1>
      <div id="reader" className="overflow-hidden rounded-lg border bg-black" />
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <a href="/entry" className="mt-4 block text-center text-sm text-slate-500 underline">
        카메라 없이 수동 입력
      </a>
    </main>
  );
}

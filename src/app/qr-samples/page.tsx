import QRCode from "qrcode";
import { encodeQr } from "@/lib/qr";
import type { QrFields } from "@/lib/types";

const SAMPLES: QrFields[] = [
  { mgmtNo: "26507KR101", item: "연포장_내포장지", vendor: "율림P&P", material: "PP",
    qtyRol: "2.9 ROL", fabricNo: "12", mfgDate: "2026.04.30", orderDate: "2026.05.07" },
  { mgmtNo: "26508KR202", item: "연포장_외포장지", vendor: "대성팩", material: "PET",
    qtyRol: "5.0 ROL", fabricNo: "07", mfgDate: "2026.05.02", orderDate: "2026.05.10" },
  { mgmtNo: "26509KR303", item: "스파우트파우치", vendor: "한빛소재", material: "NY",
    qtyRol: "1.2 ROL", fabricNo: "21", mfgDate: "2026.05.11", orderDate: "2026.05.15" },
];

export default async function QrSamples() {
  const items = await Promise.all(
    SAMPLES.map(async (f) => ({ f, png: await QRCode.toDataURL(encodeQr(f), { width: 240 }) }))
  );
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-2 text-xl font-bold">샘플 QR</h1>
      <p className="mb-6 text-sm text-slate-500">폰 /scan 화면으로 아래 QR을 스캔하세요.</p>
      <div className="space-y-8">
        {items.map(({ f, png }) => (
          <div key={f.mgmtNo} className="rounded-lg border bg-white p-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={png} alt={f.mgmtNo} className="mx-auto" />
            <div className="mt-2 text-sm">{f.mgmtNo} · {f.item} · {f.vendor}</div>
          </div>
        ))}
      </div>
    </main>
  );
}

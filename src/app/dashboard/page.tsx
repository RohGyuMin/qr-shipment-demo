"use client";
import { useEffect, useMemo, useState } from "react";
import { shipmentsToWorkbookBuffer } from "@/lib/excel";
import { QR_FIELD_LABELS, MANUAL_FIELD_LABELS } from "@/lib/fields";
import { subscribeShipments } from "@/lib/shipments";
import type { Shipment } from "@/lib/types";

export default function Dashboard() {
  const [data, setData] = useState<Shipment[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [item, setItem] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeShipments(setData);
    return () => unsubscribe();
  }, []);

  const items = useMemo(() => Array.from(new Set(data.map((d) => d.item))), [data]);

  const filtered = useMemo(
    () =>
      data.filter((d) => {
        const day = (d.shipAt || "").slice(0, 10);
        if (from && day < from) return false;
        if (to && day > to) return false;
        if (item && d.item !== item) return false;
        return true;
      }),
    [data, from, to, item]
  );

  const totalQty = filtered.reduce((s, d) => s + (d.shipQtyRol || 0), 0);

  function downloadExcel() {
    const buf = shipmentsToWorkbookBuffer(filtered);
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "출고내역.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="mb-4 text-2xl font-bold">출고 대시보드</h1>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">시작일
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="ml-1 rounded border p-1" />
        </label>
        <label className="text-sm">종료일
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="ml-1 rounded border p-1" />
        </label>
        <label className="text-sm">품목
          <select value={item} onChange={(e) => setItem(e.target.value)} className="ml-1 rounded border p-1">
            <option value="">전체</option>
            {items.map((i) => <option key={i}>{i}</option>)}
          </select>
        </label>
        <button onClick={downloadExcel} className="rounded bg-green-600 px-3 py-1.5 text-sm text-white">
          엑셀 다운로드
        </button>
      </div>

      <div className="mb-3 text-sm text-slate-600">
        총 <b>{filtered.length}</b>건 · 출고량 합계 <b>{totalQty.toFixed(1)}</b> ROL
        <span className="ml-2 text-slate-400">(실시간 자동 갱신)</span>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-2">출고일시</th>
              <th className="p-2">{QR_FIELD_LABELS.mgmtNo}</th>
              <th className="p-2">{QR_FIELD_LABELS.item}</th>
              <th className="p-2">{QR_FIELD_LABELS.vendor}</th>
              <th className="p-2">{MANUAL_FIELD_LABELS.customer}</th>
              <th className="p-2">{MANUAL_FIELD_LABELS.shipQtyRol}</th>
              <th className="p-2">{MANUAL_FIELD_LABELS.shipType}</th>
              <th className="p-2">{MANUAL_FIELD_LABELS.manager}</th>
              <th className="p-2">{MANUAL_FIELD_LABELS.hasClaim}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-2 whitespace-nowrap">{(d.shipAt || "").replace("T", " ")}</td>
                <td className="p-2">{d.mgmtNo}</td>
                <td className="p-2">{d.item}</td>
                <td className="p-2">{d.vendor}</td>
                <td className="p-2">{d.customer}</td>
                <td className="p-2">{d.shipQtyRol}</td>
                <td className="p-2">{d.shipType}</td>
                <td className="p-2">{d.manager}</td>
                <td className="p-2">{d.hasClaim ? "예" : "아니오"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="p-6 text-center text-slate-400">데이터 없음</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QR_FIELD_LABELS, MANUAL_FIELD_LABELS, SHIP_TYPES } from "@/lib/fields";
import type { ManualFields, QrFields } from "@/lib/types";

const QR_KEYS = Object.keys(QR_FIELD_LABELS) as (keyof QrFields)[];

function EntryForm() {
  const params = useSearchParams();
  const qr = Object.fromEntries(QR_KEYS.map((k) => [k, params.get(k) ?? ""])) as unknown as QrFields;

  const [m, setM] = useState<ManualFields>({
    shipAt: "", shipQtyRol: 0, sapCode: "", shipType: "정상", customer: "",
    vehicleNo: "", driver: "", manager: "", palletCount: 0, hasClaim: false,
    claimDetail: "", note: "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [badFields, setBadFields] = useState<string[]>([]);

  const set = <K extends keyof ManualFields>(k: K, v: ManualFields[K]) =>
    setM((prev) => ({ ...prev, [k]: v }));

  async function submit() {
    setStatus("saving");
    const res = await fetch("/api/shipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...qr, ...m }),
    });
    if (res.ok) {
      setStatus("done");
    } else {
      const body = await res.json().catch(() => ({}));
      setBadFields(body.fields ?? []);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="mb-4 text-2xl">✅ 출고 등록 완료</p>
        <a href="/dashboard" className="text-blue-600 underline">대시보드 보기</a>
        <a href="/scan" className="mt-3 block text-slate-500 underline">다음 QR 스캔</a>
      </main>
    );
  }

  const err = (k: string) => (badFields.includes(k) ? "border-red-500" : "border-slate-300");

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-3 text-xl font-bold">출고 입력</h1>

      <section className="mb-4 rounded-lg bg-slate-100 p-3">
        <p className="mb-2 text-sm font-semibold text-slate-500">QR 자동 입력</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {QR_KEYS.map((k) => (
            <div key={k}>
              <span className="text-slate-400">{QR_FIELD_LABELS[k]}</span>
              <div className="font-medium">{qr[k] || "-"}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Field label={MANUAL_FIELD_LABELS.shipAt}>
          <input type="datetime-local" className={`w-full rounded border p-2 ${err("shipAt")}`}
            value={m.shipAt} onChange={(e) => set("shipAt", e.target.value)} />
        </Field>
        <Field label={MANUAL_FIELD_LABELS.shipQtyRol}>
          <input type="number" step="0.1" className={`w-full rounded border p-2 ${err("shipQtyRol")}`}
            value={m.shipQtyRol} onChange={(e) => set("shipQtyRol", Number(e.target.value))} />
        </Field>
        <Field label={MANUAL_FIELD_LABELS.sapCode}>
          <input className={`w-full rounded border p-2 ${err("sapCode")}`}
            value={m.sapCode} onChange={(e) => set("sapCode", e.target.value)} />
        </Field>
        <Field label={MANUAL_FIELD_LABELS.shipType}>
          <select className="w-full rounded border border-slate-300 p-2"
            value={m.shipType} onChange={(e) => set("shipType", e.target.value as ManualFields["shipType"])}>
            {SHIP_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label={MANUAL_FIELD_LABELS.customer}>
          <input className={`w-full rounded border p-2 ${err("customer")}`}
            value={m.customer} onChange={(e) => set("customer", e.target.value)} />
        </Field>
        <Field label={MANUAL_FIELD_LABELS.vehicleNo}>
          <input className={`w-full rounded border p-2 ${err("vehicleNo")}`}
            value={m.vehicleNo} onChange={(e) => set("vehicleNo", e.target.value)} />
        </Field>
        <Field label={MANUAL_FIELD_LABELS.driver}>
          <input className={`w-full rounded border p-2 ${err("driver")}`}
            value={m.driver} onChange={(e) => set("driver", e.target.value)} />
        </Field>
        <Field label={MANUAL_FIELD_LABELS.manager}>
          <input className={`w-full rounded border p-2 ${err("manager")}`}
            value={m.manager} onChange={(e) => set("manager", e.target.value)} />
        </Field>
        <Field label={MANUAL_FIELD_LABELS.palletCount}>
          <input type="number" className={`w-full rounded border p-2 ${err("palletCount")}`}
            value={m.palletCount} onChange={(e) => set("palletCount", Number(e.target.value))} />
        </Field>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={m.hasClaim}
            onChange={(e) => set("hasClaim", e.target.checked)} />
          {MANUAL_FIELD_LABELS.hasClaim}
        </label>
        {m.hasClaim && (
          <Field label={MANUAL_FIELD_LABELS.claimDetail}>
            <textarea className={`w-full rounded border p-2 ${err("claimDetail")}`}
              value={m.claimDetail} onChange={(e) => set("claimDetail", e.target.value)} />
          </Field>
        )}
        <Field label={MANUAL_FIELD_LABELS.note}>
          <textarea className="w-full rounded border border-slate-300 p-2"
            value={m.note} onChange={(e) => set("note", e.target.value)} />
        </Field>
      </section>

      {status === "error" && <p className="mt-3 text-sm text-red-600">필수 항목을 확인하세요.</p>}
      <button onClick={submit} disabled={status === "saving"}
        className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white disabled:opacity-50">
        {status === "saving" ? "저장 중..." : "출고 등록"}
      </button>
    </main>
  );
}

export default function EntryPage() {
  return (
    <Suspense fallback={null}>
      <EntryForm />
    </Suspense>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-slate-500">{label}</label>
      {children}
    </div>
  );
}

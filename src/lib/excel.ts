import * as XLSX from "xlsx";
import type { Shipment } from "@/lib/types";
import { QR_FIELD_LABELS, MANUAL_FIELD_LABELS } from "@/lib/fields";

const COLUMNS: (keyof Shipment)[] = [
  "mgmtNo", "item", "vendor", "material", "qtyRol", "fabricNo", "mfgDate", "orderDate",
  "shipAt", "shipQtyRol", "sapCode", "shipType", "customer", "vehicleNo", "driver",
  "manager", "palletCount", "hasClaim", "claimDetail", "note",
];

const LABELS: Record<string, string> = { ...QR_FIELD_LABELS, ...MANUAL_FIELD_LABELS };

// 2차원 배열(헤더 1행 + 데이터 N행) 반환. 단위 테스트 + 워크북 생성 공용.
export function shipmentsToRows(shipments: Shipment[]): (string | number)[][] {
  const header = COLUMNS.map((c) => LABELS[c] ?? c);
  const rows = shipments.map((s) =>
    COLUMNS.map((c) => {
      const v = s[c];
      if (typeof v === "boolean") return v ? "예" : "아니오";
      return v as string | number;
    })
  );
  return [header, ...rows];
}

export function shipmentsToWorkbookBuffer(shipments: Shipment[]): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet(shipmentsToRows(shipments));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "출고내역");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}

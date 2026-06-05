import { describe, it, expect } from "vitest";
import { shipmentsToRows } from "@/lib/excel";
import type { Shipment } from "@/lib/types";

const s: Shipment = {
  id: "1", createdAt: "2026-06-05T09:05:00Z",
  mgmtNo: "26507KR101", item: "연포장_내포장지", vendor: "율림P&P", material: "PP",
  qtyRol: "2.9 ROL", fabricNo: "12", mfgDate: "2026.04.30", orderDate: "2026.05.07",
  shipAt: "2026-06-05T09:00", shipQtyRol: 2.5, sapCode: "SAP-001", shipType: "정상",
  customer: "OO식품", vehicleNo: "12가3456", driver: "홍길동", manager: "김현장",
  palletCount: 3, hasClaim: false, claimDetail: "", note: "비고1",
};

describe("shipmentsToRows", () => {
  it("produces a header row plus one row per shipment", () => {
    const rows = shipmentsToRows([s]);
    expect(rows[0]).toContain("관리번호");
    expect(rows[0]).toContain("출고량(ROL)");
    expect(rows.length).toBe(2);
  });
  it("renders boolean claim as 예/아니오", () => {
    const rows = shipmentsToRows([{ ...s, hasClaim: true, claimDetail: "스크래치" }]);
    expect(rows[1]).toContain("예");
  });
});

import { describe, it, expect } from "vitest";
import { validateShipment } from "@/lib/validation";
import type { ShipmentInput } from "@/lib/types";

const base: ShipmentInput = {
  mgmtNo: "26507KR101", item: "연포장_내포장지", vendor: "율림P&P", material: "PP",
  qtyRol: "2.9 ROL", fabricNo: "12", mfgDate: "2026.04.30", orderDate: "2026.05.07",
  shipAt: "2026-06-05T09:00", shipQtyRol: 2.5, sapCode: "SAP-001", shipType: "정상",
  customer: "OO식품", vehicleNo: "12가3456", driver: "홍길동", manager: "김현장",
  palletCount: 3, hasClaim: false, claimDetail: "", note: "",
};

describe("validateShipment", () => {
  it("passes a complete record", () => {
    expect(validateShipment(base)).toEqual([]);
  });
  it("flags missing required fields", () => {
    const errs = validateShipment({ ...base, mgmtNo: "", customer: "" });
    expect(errs).toContain("mgmtNo");
    expect(errs).toContain("customer");
  });
  it("requires claimDetail when hasClaim is true", () => {
    const errs = validateShipment({ ...base, hasClaim: true, claimDetail: "" });
    expect(errs).toContain("claimDetail");
  });
  it("flags non-positive shipQtyRol", () => {
    expect(validateShipment({ ...base, shipQtyRol: 0 })).toContain("shipQtyRol");
  });
});

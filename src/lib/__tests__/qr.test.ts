import { describe, it, expect } from "vitest";
import { encodeQr, decodeQr } from "@/lib/qr";
import type { QrFields } from "@/lib/types";

const sample: QrFields = {
  mgmtNo: "26507KR101", item: "연포장_내포장지", vendor: "율림P&P", material: "PP",
  qtyRol: "2.9 ROL", fabricNo: "12", mfgDate: "2026.04.30", orderDate: "2026.05.07",
};

describe("qr encode/decode", () => {
  it("round-trips all 8 fields", () => {
    expect(decodeQr(encodeQr(sample))).toEqual(sample);
  });
  it("decodes pipe-delimited legacy strings", () => {
    const raw = "26507KR101|연포장_내포장지|율림P&P|PP|2.9 ROL|12|2026.04.30|2026.05.07";
    expect(decodeQr(raw)).toEqual(sample);
  });
  it("throws on malformed input", () => {
    expect(() => decodeQr("not-valid")).toThrow();
  });
});

import type { ShipmentInput } from "@/lib/types";

const REQUIRED_STRINGS: (keyof ShipmentInput)[] = [
  "mgmtNo", "item", "vendor", "material", "qtyRol", "fabricNo", "mfgDate", "orderDate",
  "shipAt", "sapCode", "shipType", "customer", "vehicleNo", "driver", "manager",
];

// 누락/오류 필드명 배열 반환 (빈 배열 = 유효)
export function validateShipment(input: ShipmentInput): string[] {
  const errors: string[] = [];
  for (const key of REQUIRED_STRINGS) {
    if (!String(input[key] ?? "").trim()) errors.push(key);
  }
  if (!(input.shipQtyRol > 0)) errors.push("shipQtyRol");
  if (!(input.palletCount > 0)) errors.push("palletCount");
  if (input.hasClaim && !input.claimDetail.trim()) errors.push("claimDetail");
  return errors;
}

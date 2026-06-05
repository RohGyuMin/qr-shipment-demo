import type { QrFields } from "@/lib/types";

const ORDER: (keyof QrFields)[] = [
  "mgmtNo", "item", "vendor", "material", "qtyRol", "fabricNo", "mfgDate", "orderDate",
];

// 데모 인코딩: JSON. 실제 라벨 규칙 확정 시 decodeQr의 파싱 분기만 교체한다.
export function encodeQr(fields: QrFields): string {
  return JSON.stringify(fields);
}

export function decodeQr(raw: string): QrFields {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    const obj = JSON.parse(trimmed);
    const out = {} as QrFields;
    for (const k of ORDER) {
      if (typeof obj[k] !== "string") throw new Error(`missing field: ${k}`);
      out[k] = obj[k];
    }
    return out;
  }
  if (trimmed.includes("|")) {
    const parts = trimmed.split("|");
    if (parts.length !== ORDER.length) throw new Error("invalid field count");
    const out = {} as QrFields;
    ORDER.forEach((k, i) => (out[k] = parts[i].trim()));
    return out;
  }
  throw new Error("unrecognized QR format");
}

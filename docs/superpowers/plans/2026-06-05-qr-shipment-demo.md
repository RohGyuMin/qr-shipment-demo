# QR 출고관리 데모 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 연포장 출고관리 1단계 데모 — QR 스캔 → 모바일 입력폼 자동 pre-fill → 수동 12항목 입력 → 관리부서 공용 실시간 대시보드(필터 + 엑셀 다운로드)를 Vercel 배포 링크로 시연.

**Architecture:** Next.js 14 App Router 단일 코드베이스. 순수 함수(`decodeQr`/`encodeQr`/엑셀 변환/검증)는 UI·DB와 분리해 단위 테스트로 보호한다. 데이터는 Postgres(`@vercel/postgres`) 단일 `shipments` 테이블에 저장하고, 대시보드는 5초 폴링으로 실시간 공유를 흉내낸다. QR 파싱 규칙 미확정 → `decodeQr` 한 함수에 격리해 추후 교체.

**Tech Stack:** Next.js 14.2, React 18, TypeScript 5, TailwindCSS 3, `@vercel/postgres`(DB), `qrcode`(QR 생성), `html5-qrcode`(카메라 스캔), `xlsx`(엑셀), `vitest`(테스트).

---

## 파일 구조

```
qr-shipment-demo/
├── package.json
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── vitest.config.ts
├── .env.local.example
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 루트 레이아웃 + 글로벌 스타일
│   │   ├── globals.css
│   │   ├── page.tsx                # 랜딩: /scan, /dashboard, /qr-samples 링크
│   │   ├── scan/page.tsx           # 카메라 QR 스캐너 (클라이언트)
│   │   ├── entry/page.tsx          # 출고 입력폼 (pre-fill + 수동 12항목)
│   │   ├── dashboard/page.tsx      # 공용 대시보드 (필터/합계/엑셀/폴링)
│   │   ├── qr-samples/page.tsx     # 샘플 QR 3종 표시
│   │   └── api/
│   │       └── shipments/route.ts  # GET 목록 / POST 등록
│   ├── lib/
│   │   ├── fields.ts               # QR 8항목 + 수동 12항목 스키마/상수
│   │   ├── qr.ts                   # encodeQr / decodeQr (격리)
│   │   ├── validation.ts           # 출고 레코드 검증
│   │   ├── excel.ts                # 출고 목록 → 워크시트 행 변환
│   │   ├── db.ts                   # Postgres 접근 (init/insert/list)
│   │   └── types.ts                # ShipmentInput / Shipment 타입
│   └── lib/__tests__/
│       ├── qr.test.ts
│       ├── validation.test.ts
│       └── excel.test.ts
└── docs/superpowers/...
```

---

### Task 1: 프로젝트 스캐폴드 + 도구 설정

**Files:**
- Create: `package.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.gitignore`, `.env.local.example`
- Create: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "qr-shipment-demo",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "14.2.35",
    "react": "^18",
    "react-dom": "^18",
    "@vercel/postgres": "^0.10.0",
    "qrcode": "^1.5.4",
    "html5-qrcode": "^2.3.8",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/qrcode": "^1.5.5",
    "typescript": "^5",
    "tailwindcss": "^3.4.1",
    "postcss": "^8",
    "autoprefixer": "^10.4.20",
    "eslint": "^8",
    "eslint-config-next": "14.2.35",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: 설정 파일 작성**

`next.config.mjs`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

`postcss.config.mjs`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
});
```

`.gitignore`:
```
node_modules
.next
.env.local
*.tsbuildinfo
.vercel
```

`.env.local.example`:
```
# Vercel Postgres (Vercel 대시보드에서 연결 시 자동 주입)
POSTGRES_URL=
```

- [ ] **Step 3: globals.css / layout.tsx / page.tsx 작성**

`src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`src/app/layout.tsx`:
```tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "출고관리 데모", description: "QR 출고관리" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
```

`src/app/page.tsx`:
```tsx
import Link from "next/link";

export default function Home() {
  const links = [
    { href: "/scan", label: "📷 QR 스캔 (현장)" },
    { href: "/dashboard", label: "📊 대시보드 (관리부서)" },
    { href: "/qr-samples", label: "🔖 샘플 QR" },
  ];
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">출고관리 데모</h1>
      <div className="space-y-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href}
            className="block rounded-lg border bg-white p-4 text-lg shadow-sm">
            {l.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: 설치 + 빌드 점검**

Run: `cd qr-shipment-demo && npm install && npm run typecheck`
Expected: 타입 에러 없이 완료.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + Tailwind + Vitest project"
```

---

### Task 2: 필드 스키마 + 타입 정의

**Files:**
- Create: `src/lib/types.ts`, `src/lib/fields.ts`

- [ ] **Step 1: types.ts 작성**

```ts
// QR에서 채워지는 8개 항목
export interface QrFields {
  mgmtNo: string;      // 관리번호
  item: string;        // 품목
  vendor: string;      // 업체명
  material: string;    // 재질
  qtyRol: string;      // 수량 (예: "2.9 ROL")
  fabricNo: string;    // 원단번호
  mfgDate: string;     // 제조일자
  orderDate: string;   // 발주일자
}

// 현장에서 입력하는 12개 항목
export interface ManualFields {
  shipAt: string;       // 출고일시 (ISO 문자열)
  shipQtyRol: number;   // 출고량(ROL)
  sapCode: string;      // SAP 코드
  shipType: "정상" | "반품" | "샘플" | "추가";
  customer: string;     // 납품처
  vehicleNo: string;    // 차량번호
  driver: string;       // 기사명
  manager: string;      // 출고 담당자
  palletCount: number;  // 팔레트 수
  hasClaim: boolean;    // 클레임 여부
  claimDetail: string;  // 클레임 내용
  note: string;         // 비고
}

export type ShipmentInput = QrFields & ManualFields;

export interface Shipment extends ShipmentInput {
  id: number;
  createdAt: string;
}
```

- [ ] **Step 2: fields.ts 작성 (폼 렌더링/엑셀 헤더 공용 메타데이터)**

```ts
export const QR_FIELD_LABELS: Record<string, string> = {
  mgmtNo: "관리번호", item: "품목", vendor: "업체명", material: "재질",
  qtyRol: "수량(ROL)", fabricNo: "원단번호", mfgDate: "제조일자", orderDate: "발주일자",
};

export const MANUAL_FIELD_LABELS: Record<string, string> = {
  shipAt: "출고일시", shipQtyRol: "출고량(ROL)", sapCode: "SAP코드", shipType: "출고구분",
  customer: "납품처", vehicleNo: "차량번호", driver: "기사명", manager: "출고담당자",
  palletCount: "팔레트수", hasClaim: "클레임여부", claimDetail: "클레임내용", note: "비고",
};

export const SHIP_TYPES = ["정상", "반품", "샘플", "추가"] as const;
```

- [ ] **Step 3: typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/fields.ts
git commit -m "feat: add shipment field schema and types"
```

---

### Task 3: QR 인코딩/디코딩 (격리) — TDD

**Files:**
- Create: `src/lib/qr.ts`
- Test: `src/lib/__tests__/qr.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/__tests__/qr.test.ts`:
```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- qr`
Expected: FAIL ("decodeQr is not a function" 또는 모듈 없음).

- [ ] **Step 3: qr.ts 구현**

```ts
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
  // 1) JSON 포맷
  if (trimmed.startsWith("{")) {
    const obj = JSON.parse(trimmed);
    const out = {} as QrFields;
    for (const k of ORDER) {
      if (typeof obj[k] !== "string") throw new Error(`missing field: ${k}`);
      out[k] = obj[k];
    }
    return out;
  }
  // 2) 파이프 구분자 포맷 (레거시/실물 대비)
  if (trimmed.includes("|")) {
    const parts = trimmed.split("|");
    if (parts.length !== ORDER.length) throw new Error("invalid field count");
    const out = {} as QrFields;
    ORDER.forEach((k, i) => (out[k] = parts[i].trim()));
    return out;
  }
  throw new Error("unrecognized QR format");
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- qr`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/qr.ts src/lib/__tests__/qr.test.ts
git commit -m "feat: add isolated QR encode/decode with tests"
```

---

### Task 4: 출고 레코드 검증 — TDD

**Files:**
- Create: `src/lib/validation.ts`
- Test: `src/lib/__tests__/validation.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/__tests__/validation.test.ts`:
```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- validation`
Expected: FAIL (모듈 없음).

- [ ] **Step 3: validation.ts 구현**

```ts
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
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- validation`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation.ts src/lib/__tests__/validation.test.ts
git commit -m "feat: add shipment validation with tests"
```

---

### Task 5: 엑셀 변환 — TDD

**Files:**
- Create: `src/lib/excel.ts`
- Test: `src/lib/__tests__/excel.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/__tests__/excel.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { shipmentsToRows } from "@/lib/excel";
import type { Shipment } from "@/lib/types";

const s: Shipment = {
  id: 1, createdAt: "2026-06-05T09:05:00Z",
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
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- excel`
Expected: FAIL (모듈 없음).

- [ ] **Step 3: excel.ts 구현**

```ts
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
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- excel`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/excel.ts src/lib/__tests__/excel.test.ts
git commit -m "feat: add excel export conversion with tests"
```

---

### Task 6: DB 접근 모듈 (Postgres)

**Files:**
- Create: `src/lib/db.ts`

> 참고: DB는 단위 테스트 대상이 아님(외부 의존). 순수 로직은 Task 3~5에서 보호됨. 검증은 Task 9 통합 점검에서.

- [ ] **Step 1: db.ts 작성**

```ts
import { sql } from "@vercel/postgres";
import type { Shipment, ShipmentInput } from "@/lib/types";

export async function ensureTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS shipments (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      mgmt_no TEXT, item TEXT, vendor TEXT, material TEXT,
      qty_rol TEXT, fabric_no TEXT, mfg_date TEXT, order_date TEXT,
      ship_at TEXT, ship_qty_rol NUMERIC, sap_code TEXT, ship_type TEXT,
      customer TEXT, vehicle_no TEXT, driver TEXT, manager TEXT,
      pallet_count INTEGER, has_claim BOOLEAN, claim_detail TEXT, note TEXT
    );`;
}

export async function insertShipment(input: ShipmentInput): Promise<void> {
  await ensureTable();
  await sql`
    INSERT INTO shipments (
      mgmt_no, item, vendor, material, qty_rol, fabric_no, mfg_date, order_date,
      ship_at, ship_qty_rol, sap_code, ship_type, customer, vehicle_no, driver,
      manager, pallet_count, has_claim, claim_detail, note
    ) VALUES (
      ${input.mgmtNo}, ${input.item}, ${input.vendor}, ${input.material},
      ${input.qtyRol}, ${input.fabricNo}, ${input.mfgDate}, ${input.orderDate},
      ${input.shipAt}, ${input.shipQtyRol}, ${input.sapCode}, ${input.shipType},
      ${input.customer}, ${input.vehicleNo}, ${input.driver}, ${input.manager},
      ${input.palletCount}, ${input.hasClaim}, ${input.claimDetail}, ${input.note}
    );`;
}

export async function listShipments(): Promise<Shipment[]> {
  await ensureTable();
  const { rows } = await sql`SELECT * FROM shipments ORDER BY created_at DESC;`;
  return rows.map((r) => ({
    id: r.id, createdAt: r.created_at,
    mgmtNo: r.mgmt_no, item: r.item, vendor: r.vendor, material: r.material,
    qtyRol: r.qty_rol, fabricNo: r.fabric_no, mfgDate: r.mfg_date, orderDate: r.order_date,
    shipAt: r.ship_at, shipQtyRol: Number(r.ship_qty_rol), sapCode: r.sap_code,
    shipType: r.ship_type, customer: r.customer, vehicleNo: r.vehicle_no,
    driver: r.driver, manager: r.manager, palletCount: r.pallet_count,
    hasClaim: r.has_claim, claimDetail: r.claim_detail, note: r.note,
  })) as Shipment[];
}
```

- [ ] **Step 2: typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat: add Postgres shipment data access"
```

---

### Task 7: API 라우트 (GET 목록 / POST 등록)

**Files:**
- Create: `src/app/api/shipments/route.ts`

- [ ] **Step 1: route.ts 작성**

```ts
import { NextRequest, NextResponse } from "next/server";
import { insertShipment, listShipments } from "@/lib/db";
import { validateShipment } from "@/lib/validation";
import type { ShipmentInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const shipments = await listShipments();
    return NextResponse.json({ shipments });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const input = (await req.json()) as ShipmentInput;
    const errors = validateShipment(input);
    if (errors.length) {
      return NextResponse.json({ error: "validation", fields: errors }, { status: 400 });
    }
    await insertShipment(input);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
```

- [ ] **Step 2: typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/shipments/route.ts
git commit -m "feat: add shipments API route"
```

---

### Task 8: 샘플 QR 페이지

**Files:**
- Create: `src/app/qr-samples/page.tsx`

- [ ] **Step 1: page.tsx 작성 (서버 컴포넌트에서 QR PNG dataURL 생성)**

```tsx
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
```

- [ ] **Step 2: typecheck + 수동 확인**

Run: `npm run dev` → 브라우저 `http://localhost:3000/qr-samples`
Expected: QR 3개가 라벨과 함께 렌더링됨.

- [ ] **Step 3: Commit**

```bash
git add src/app/qr-samples/page.tsx
git commit -m "feat: add sample QR generation page"
```

---

### Task 9: 스캐너 화면

**Files:**
- Create: `src/app/scan/page.tsx`

- [ ] **Step 1: page.tsx 작성 (클라이언트 컴포넌트, html5-qrcode)**

```tsx
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
```

- [ ] **Step 2: typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/scan/page.tsx
git commit -m "feat: add camera QR scanner page"
```

---

### Task 10: 입력폼 화면

**Files:**
- Create: `src/app/entry/page.tsx`

- [ ] **Step 1: page.tsx 작성 (클라이언트 컴포넌트)**

```tsx
"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { QR_FIELD_LABELS, MANUAL_FIELD_LABELS, SHIP_TYPES } from "@/lib/fields";
import type { ManualFields, QrFields } from "@/lib/types";

const QR_KEYS = Object.keys(QR_FIELD_LABELS) as (keyof QrFields)[];

export default function EntryPage() {
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-slate-500">{label}</label>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/entry/page.tsx
git commit -m "feat: add shipment entry form"
```

---

### Task 11: 대시보드 화면 (필터 + 합계 + 엑셀 + 폴링)

**Files:**
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: page.tsx 작성 (클라이언트 컴포넌트)**

```tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { shipmentsToWorkbookBuffer } from "@/lib/excel";
import { QR_FIELD_LABELS, MANUAL_FIELD_LABELS } from "@/lib/fields";
import type { Shipment } from "@/lib/types";

export default function Dashboard() {
  const [data, setData] = useState<Shipment[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [item, setItem] = useState("");

  useEffect(() => {
    const load = () =>
      fetch("/api/shipments").then((r) => r.json()).then((d) => setData(d.shipments ?? []));
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
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
        <span className="ml-2 text-slate-400">(5초마다 자동 갱신)</span>
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
```

- [ ] **Step 2: typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add dashboard with filters, totals, excel export, polling"
```

---

### Task 12: 전체 점검 + README + 배포 준비

**Files:**
- Create: `README.md`

- [ ] **Step 1: 전체 테스트/빌드**

Run: `npm test && npm run typecheck && npm run build`
Expected: 모든 테스트 PASS, 빌드 성공.

- [ ] **Step 2: 로컬 통합 점검 (Postgres 연결 후)**

`.env.local`에 `POSTGRES_URL` 설정 → `npm run dev`:
- `/qr-samples`에서 QR 표시 확인
- 폰(또는 PC 카메라)으로 `/scan` → QR 인식 → `/entry`에 8항목 pre-fill 확인
- 12항목 입력 → 등록 → `/dashboard`에 5초 내 반영 확인
- 필터 동작 + 엑셀 다운로드 확인

- [ ] **Step 3: README.md 작성**

```markdown
# QR 출고관리 데모

연포장 출고관리 1단계 데모. QR 스캔 → 모바일 입력 → 관리부서 실시간 대시보드.

## 로컬 실행
1. `npm install`
2. `.env.local`에 `POSTGRES_URL` 설정 (Vercel Postgres / Neon)
3. `npm run dev`

## 배포 (Vercel)
1. GitHub 푸시 후 Vercel에서 import
2. Storage > Postgres 연결 (POSTGRES_URL 자동 주입)
3. 배포 → HTTPS 링크로 폰 카메라 스캔 가능

## 화면
- `/scan` 현장 QR 스캐너 · `/entry` 출고 입력 · `/dashboard` 관리부서 조회 · `/qr-samples` 데모용 QR

## QR 파싱 교체
실제 라벨 규칙 확정 시 `src/lib/qr.ts`의 `decodeQr`만 교체.
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with run and deploy instructions"
```

- [ ] **Step 5: GitHub 푸시**

```bash
git remote add origin https://github.com/RohGyuMin/qr-shipment-demo.git
git branch -M main
git push -u origin main
```

---

## 자체 점검 (Self-Review)

- **스펙 커버리지:** QR 스캔(T9)·자동 pre-fill(T9→T10)·수동 12항목(T10)·실시간 대시보드(T11)·날짜/품목 필터(T11)·엑셀 다운로드(T5+T11)·앱 설치 없이 접속(웹/Vercel, T1+T12)·샘플 QR(T8)·DB(T6)·API(T7)·파싱 격리(T3) — 모든 스펙 항목 매핑됨.
- **플레이스홀더:** 모든 코드 스텝에 실제 코드 포함. TODO/TBD 없음.
- **타입 일관성:** `QrFields`/`ManualFields`/`ShipmentInput`/`Shipment`(T2) 전 태스크 일관 사용. `encodeQr`/`decodeQr`(T3), `validateShipment`(T4), `shipmentsToRows`/`shipmentsToWorkbookBuffer`(T5), `insertShipment`/`listShipments`(T6) 시그니처 후속 태스크와 일치.
```

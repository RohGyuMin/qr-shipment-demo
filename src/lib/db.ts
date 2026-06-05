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

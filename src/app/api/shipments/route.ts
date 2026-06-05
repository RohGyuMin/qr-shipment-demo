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

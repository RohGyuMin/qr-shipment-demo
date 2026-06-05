import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Shipment, ShipmentInput } from "@/lib/types";

const COL = "shipments";

// 출고 1건을 Firestore에 추가한다. createdAt은 서버 타임스탬프.
export async function addShipment(input: ShipmentInput): Promise<void> {
  await addDoc(collection(db, COL), { ...input, createdAt: serverTimestamp() });
}

// 출고 목록을 createdAt 내림차순으로 실시간 구독한다. 반환된 함수로 구독 해제.
export function subscribeShipments(cb: (shipments: Shipment[]) => void): Unsubscribe {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => {
      const data = d.data();
      const createdAt =
        data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : "";
      return { ...(data as ShipmentInput), id: d.id, createdAt } as Shipment;
    });
    cb(list);
  });
}

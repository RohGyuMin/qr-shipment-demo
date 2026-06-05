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

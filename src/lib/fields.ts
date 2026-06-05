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

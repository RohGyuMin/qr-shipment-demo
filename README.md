# QR 출고관리 데모

연포장 출고관리 1단계 데모. QR 스캔 → 모바일 입력 → 관리부서 실시간 대시보드.

## 화면

- `/scan` — 현장 QR 스캐너 (카메라)
- `/entry` — 출고 입력 (QR 8항목 자동 pre-fill + 수동 12항목)
- `/dashboard` — 관리부서 공용 조회 (날짜/품목 필터 + 합계 + 엑셀 다운로드 + 5초 자동 갱신)
- `/qr-samples` — 데모용 샘플 QR 3종

## 로컬 실행

1. `npm install`
2. `.env.local`에 `POSTGRES_URL` 설정 (Vercel Postgres 또는 Neon)
3. `npm run dev` → http://localhost:3000

## 배포 (Vercel)

1. GitHub 푸시 후 Vercel에서 import
2. Storage > Postgres 연결 (`POSTGRES_URL` 자동 주입)
3. 배포 → HTTPS 링크로 폰 카메라 스캔 가능

> 카메라 스캔은 HTTPS에서만 동작합니다. 로컬 폰 테스트 시 `https` 터널(예: ngrok)이나 Vercel 배포 링크를 사용하세요.

## QR 파싱 교체

실제 라벨 파싱 규칙이 확정되면 `src/lib/qr.ts`의 `decodeQr` 함수만 교체하면 됩니다. 나머지 코드는 영향받지 않습니다 (격리 설계).

## 테스트

```
npm test         # 단위 테스트 (qr / validation / excel)
npm run typecheck
npm run build
```

## 범위

1단계: QR 스캔, 자동 pre-fill, 수동 입력, 실시간 대시보드, 필터, 엑셀.
2단계(범위 외): 재고 QR 연동, 시험성적서 자동 작성, SAP 연동, 내부 서버 이전, 통계 고도화.

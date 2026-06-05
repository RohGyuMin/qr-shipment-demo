# QR 출고관리 데모

연포장 출고관리 1단계 데모. QR 스캔 → 모바일 입력 → 관리부서 실시간 대시보드.

## 화면

- `/scan` — 현장 QR 스캐너 (카메라)
- `/entry` — 출고 입력 (QR 8항목 자동 pre-fill + 수동 12항목)
- `/dashboard` — 관리부서 공용 조회 (날짜/품목 필터 + 합계 + 엑셀 다운로드 + 실시간 자동 갱신)
- `/qr-samples` — 데모용 샘플 QR 3종

## 기술 스택

Next.js 14(정적 export) + TypeScript + TailwindCSS. 데이터는 **Firebase Firestore**(실시간 구독), 배포는 **Firebase Hosting**.

## 로컬 실행

1. `npm install`
2. Firebase 콘솔에서 프로젝트 생성 → Firestore 사용 설정(테스트 모드) → 웹 앱 등록
3. `.env.local`에 웹 앱 설정값 입력 (`.env.local.example` 참고, `NEXT_PUBLIC_FIREBASE_*`)
4. `npm run dev` → http://localhost:3000

## 배포 (Firebase Hosting)

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # 본인 Firebase 프로젝트 선택 (.firebaserc 갱신)
npm run build                 # 정적 파일을 out/ 에 생성
firebase deploy               # Hosting + Firestore 규칙 배포
```

배포 후 `https://<project-id>.web.app` 링크가 생성됩니다. HTTPS이므로 폰 카메라 스캔이 바로 동작합니다.

> ⚠️ `firestore.rules`는 데모용으로 누구나 읽기/쓰기 가능하게 열려 있습니다. 운영 전 반드시 인증/권한 규칙으로 교체하세요.
> 카메라 스캔은 HTTPS에서만 동작합니다. 로컬(`localhost`)은 PC에서만 되고, 폰 테스트는 배포 링크를 사용하세요.

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

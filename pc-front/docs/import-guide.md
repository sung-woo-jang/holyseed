# JSON 임포트 가이드

단가표 데이터를 JSON으로 일괄 등록하는 방법입니다.

---

## 사전 준비

임포트 전에 아래 마스터 데이터가 DB에 등록되어 있어야 합니다.

| 항목 | 관리 화면 | 비고 |
|---|---|---|
| 카테고리 | `/categories` | `autoCreateCategory` 옵션 없이 임포트 시 필수 |
| 업체 | `/vendors` | `autoCreateVendor` 옵션 없이 임포트 시 필수 |

> 첫 임포트라면 카테고리·업체 자동생성 옵션을 켜서 한 번에 처리할 수 있습니다. 이후 임포트에서는 옵션을 끄고 명시적으로 관리하는 것을 권장합니다.

---

## JSON 포맷

최상위가 배열이거나 `{ "items": [...] }` 형태 모두 허용됩니다.

```json
[
  {
    "categoryPath": ["주방후드", "슬라이드후드"],
    "modelCode": "G60AL",
    "displayName": "G60 실버",
    "brand": "린나이",
    "spec": "기본형 실버 가로600",
    "unit": "EA",
    "note": "단종 예정",
    "prices": [
      { "vendor": "A업체", "price": 46000 },
      { "vendor": "B업체", "price": 43000, "note": "택배비포함" }
    ]
  }
]
```

### 필드 설명

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `categoryPath` | `string[]` | 신규 제품 시 필수 | 루트→리프 순서의 카테고리 경로 |
| `modelCode` | `string` | ✅ | 제품 고유 키. 동일 코드면 업데이트, 없으면 신규 생성 |
| `displayName` | `string` | 신규 시 필수 | 화면에 표시되는 제품명 |
| `brand` | `string` | 선택 | 브랜드명 |
| `spec` | `string` | 선택 | 스펙/규격 설명 |
| `unit` | `string` | 선택 | 단위 (기본값: `EA`) |
| `note` | `string` | 선택 | 비고 |
| `prices` | `array` | 선택 | 업체별 가격 목록 |
| `prices[].vendor` | `string` | ✅ | 업체명 (DB에 등록된 이름과 정확히 일치해야 함) |
| `prices[].price` | `number` | ✅ | 단가 |
| `prices[].note` | `string` | 선택 | 가격 비고 (예: 택배비포함) |

---

## 임포트 옵션

| 옵션 | 기본값 | 설명 |
|---|---|---|
| 카테고리 자동생성 | OFF | ON 시 `categoryPath`에 없는 카테고리를 자동 생성 |
| 업체 자동생성 | OFF | ON 시 `prices[].vendor`에 없는 업체를 자동 생성 |
| 1개 실패 시 전체 롤백 | OFF | ON 시 하나라도 오류면 전체 취소, OFF 시 오류 항목만 건너뜀 |

---

## 임포트 절차

1. `http://localhost:3100/import` 접속
2. **옵션** 체크박스 설정
3. JSON 데이터를 텍스트 영역에 붙여넣기 (또는 **예시 불러오기** 버튼으로 포맷 확인)
4. **파싱 미리보기** 클릭 → 상단 20개 행 미리보기 확인
5. **N개 임포트 실행** 클릭
6. 결과 확인 (신규 생성 / 업데이트 / 오류 건수)

---

## 동작 규칙

- `modelCode` 기준으로 upsert: **이미 존재하면 업데이트, 없으면 신규 생성**
- 가격은 `(제품 ID, 업체 ID)` 조합으로 upsert: **같은 조합이면 덮어쓰기**
- `categoryPath`는 순서대로 매칭. 예) `["주방후드", "슬라이드후드"]` → `주방후드` 하위의 `슬라이드후드`
- 업체명은 앞뒤 공백 제거 후 일치 여부 확인

---

## 실전 예시 — 첫 임포트

카테고리·업체가 아직 없는 상태에서 전부 자동 생성하며 임포트합니다.

```json
[
  {
    "categoryPath": ["주방후드", "슬라이드후드"],
    "modelCode": "G60AL",
    "displayName": "G60 실버",
    "spec": "가로600 실버",
    "prices": [
      { "vendor": "A업체", "price": 46000 },
      { "vendor": "B업체", "price": 43000 }
    ]
  },
  {
    "categoryPath": ["주방후드", "슬라이드후드"],
    "modelCode": "G90BL",
    "displayName": "G90 블랙",
    "spec": "가로900 블랙",
    "prices": [
      { "vendor": "A업체", "price": 62000 },
      { "vendor": "B업체", "price": 59000, "note": "재고한정" }
    ]
  },
  {
    "categoryPath": ["전기쿡탑"],
    "modelCode": "EC-3B",
    "displayName": "3구 전기쿡탑",
    "brand": "SK매직",
    "prices": [
      { "vendor": "A업체", "price": 215000 }
    ]
  }
]
```

옵션: **카테고리 자동생성 ON**, **업체 자동생성 ON**

---

## 실전 예시 — 가격 갱신

기존 제품의 가격만 업데이트합니다. `categoryPath`나 `displayName`은 생략 가능합니다.

```json
[
  {
    "modelCode": "G60AL",
    "prices": [
      { "vendor": "A업체", "price": 48000 },
      { "vendor": "B업체", "price": 45000 }
    ]
  }
]
```

옵션: 모두 OFF

---

## 오류 예시 및 해결

| 오류 메시지 | 원인 | 해결 |
|---|---|---|
| `카테고리를 찾을 수 없습니다: "슬라이드후드"` | 해당 카테고리 미등록 | `/categories`에서 먼저 생성하거나 자동생성 옵션 ON |
| `업체를 찾을 수 없습니다: "C업체"` | 해당 업체 미등록 | `/vendors`에서 먼저 생성하거나 자동생성 옵션 ON |
| `이미 존재하는 모델코드입니다` | 신규 생성 시 중복 (정상적으로는 발생 안 함) | — |
| `신규 제품에는 categoryPath가 필요합니다` | 새 제품인데 `categoryPath` 누락 | `categoryPath` 추가 |

---

## CSV/XLSX → JSON 변환 팁

엑셀 단가표를 JSON으로 변환할 때 아래 구조를 참고하세요.

**엑셀 예시:**

| 카테고리1 | 카테고리2 | 모델코드 | 제품명 | 스펙 | A업체 | B업체 |
|---|---|---|---|---|---|---|
| 주방후드 | 슬라이드후드 | G60AL | G60 실버 | 가로600 | 46000 | 43000 |

**변환 결과:**

```json
[
  {
    "categoryPath": ["주방후드", "슬라이드후드"],
    "modelCode": "G60AL",
    "displayName": "G60 실버",
    "spec": "가로600",
    "prices": [
      { "vendor": "A업체", "price": 46000 },
      { "vendor": "B업체", "price": 43000 }
    ]
  }
]
```

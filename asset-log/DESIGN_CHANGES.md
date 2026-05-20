# 자산 탭 디자인 수정 요청

> 이 문서는 `asset-log` Claude Design 프로젝트에 적용할 변경사항 명세입니다.
> 대상 파일: `screens-assets.jsx`, `app.jsx`

---

## 배경

자산 탭(`AssetsScreen`)이 조회 전용으로 설계되어 있어, **자산 추가** 기능이 없음.
아울러 "개별 입력" 버튼이 클릭해도 아무 동작을 하지 않음.
실제 앱 구현 전에 디자인을 먼저 확정하기 위해 수정 요청.

---

## 1. 신규 컴포넌트: `AddAssetSheet`

`screens-assets.jsx` 하단에 새로운 시트 컴포넌트를 추가하세요.

### 동작 흐름

```
[+ 자산 추가] 버튼 클릭
  → AddAssetSheet 열림
    → Step 1: 자산 이름 입력 + 카테고리 선택
    → Step 2: 초기 평가액 입력 + 통화 선택 (선택 사항)
    → 저장 → ✅ 완료 상태 0.7초 → 시트 닫힘
```

### Step 1 — 기본 정보

| 필드 | UI | 비고 |
|------|----|------|
| 자산 이름 | `<input type="text">` | placeholder: "예: 토스뱅크 파킹통장" |
| 카테고리 | 선택 버튼 그리드 (2열) | 아래 6개 옵션 |

카테고리 옵션 (아이콘 + 라벨, 선택 시 파란 테두리 강조):

```
💰 예적금 (CASH)       📈 주식·ETF (INVESTMENT)
🪙 코인 (CRYPTO)        🏠 부동산 (REAL_ESTATE)
🏦 연금 (PENSION)       💳 부채 (LIABILITY)
```

- `LIABILITY` 선택 시 → 카드 색상을 `theme.danger` 계열(연한 빨간)로 강조
- 다른 카테고리는 `theme.brandSoft` 강조

### Step 2 — 평가액 입력

- 큰 숫자 입력 필드 (중앙 정렬, 36px 폰트, 단위 "원")
- 기본 통화는 KRW. "외화 자산이에요" 토글(Switch)을 추가하고, 활성화 시 통화 선택 드롭다운(USD / EUR / JPY / CNY) 노출
- "건너뛰기" 링크 텍스트 → 평가액 0으로 저장 후 완료
- "저장하기" 버튼 → 금액 입력 시 활성화

### 저장 완료 상태

```
✅ (크게)
자산이 추가됐어요!
스냅샷을 입력하면 순자산에 반영돼요
```

### 스타일 참고

`SheetShell` 컴포넌트와 동일한 구조 사용. 단, 전체화면이 아닌 **바텀시트** 형태로:
```jsx
position: 'absolute', bottom: 0, left: 0, right: 0,
borderTopLeftRadius: 20, borderTopRightRadius: 20,
background: theme.card
// 딤 배경: 반투명 오버레이 위에 올라옴
```

---

## 2. `AssetsScreen` — FAB 추가

`AssetsScreen` 컴포넌트 가장 바깥 `<div>` 안에 FAB(Floating Action Button)을 추가하세요.
`BookScreen`의 FAB 패턴과 동일하게 구현.

```jsx
{!isViewer && (
  <button
    onClick={onAddAsset}   // 새로 추가할 prop
    style={{
      position: 'sticky',
      bottom: 20,
      marginLeft: 'auto',
      marginRight: 20,
      display: 'block',
      width: 56, height: 56,
      borderRadius: 28,
      background: theme.brand,
      border: 'none',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 6px 20px rgba(49,130,246,0.40)',
      fontSize: 28, color: '#fff',
    }}>
    +
  </button>
)}
```

**props 추가**: `AssetsScreen`에 `onAddAsset` prop 추가 (기존 `onAsset`, `onSnapshot`과 동일 패턴).

---

## 3. `AssetsScreen` — "개별 입력" 버튼 연결

현재 "개별 입력" 버튼에 `onClick` handler가 없음. 다음과 같이 수정하세요.

### 동작

클릭 시 → 인라인 자산 피커 노출. 별도 시트 없이 **자산 리스트 위에 오버레이 형태로 각 자산 행에 "선택" 버튼**이 나타남:

```
[자산 리스트]
 ┌─────────────────────────────┐
 │ 토스뱅크    3,200만원  [선택] │
 │ 삼성전자    1,800만원  [선택] │
 └─────────────────────────────┘
```

`[선택]` 클릭 → `onSnapshot(assetId)` 호출 (이미 있는 `onSnapshot` prop을 asset ID 인자와 함께 호출).

구현 방법: `AssetsScreen`에 `const [pickingAsset, setPickingAsset] = React.useState(false)` state 추가.
- `pickingAsset === true`일 때 각 자산 행 오른쪽에 `[선택]` 버튼 노출
- 자산 클릭 시 `onSnapshot(a.id)` 호출 후 `setPickingAsset(false)`
- 상단에 "개별 입력할 자산을 선택하세요" 배너 + [취소] 버튼 표시

---

## 4. `AssetDetailScreen` — 편집/삭제 옵션 추가

`ScreenHeader`의 `right` 영역에 케밥 메뉴(⋯) 버튼을 추가하세요.

```jsx
// AssetDetailScreen 내부
const [menuOpen, setMenuOpen] = React.useState(false);

// ScreenHeader right prop으로 전달:
right={
  <button onClick={() => setMenuOpen(v => !v)} style={{ ... }}>
    ⋯
  </button>
}
```

메뉴 열리면 카드 형태로 아래 두 옵션 표시 (헤더 아래 드롭다운):

| 옵션 | 아이콘 | 색상 |
|------|--------|------|
| 자산명 수정 | ✏️ | `theme.text` |
| 자산 삭제 | 🗑️ | `theme.danger` |

**"자산명 수정"** 클릭 시: 이름 표시 부분이 `<input>`으로 전환 (인라인 편집). 확인 버튼으로 저장.

**"자산 삭제"** 클릭 시: 아래 confirm 배너 노출:
```
⚠️ 이 자산과 모든 스냅샷 기록이 삭제돼요. 계속할까요?
[취소]  [삭제하기]
```
"삭제하기" 클릭 → `onBack()` 호출 (상세 화면 종료).

---

## 5. `app.jsx` — 상태 연결

`App` 컴포넌트에 아래 state와 handler를 추가하세요.

```jsx
// 기존 sheet state에 'addasset' 추가
// sheet: 'snapshot' | 'addtx' | 'addrec' | 'addasset' | null

// AssetsScreen에 onAddAsset prop 추가
{!top && tab === 'assets' && (
  <AssetsScreen data={data} theme={theme} role={role}
    onAsset={(a) => push('asset', a)}
    onSnapshot={(assetId) => {
      setSnapshotFocusId(assetId || null);  // 새 state
      setSheet('snapshot');
    }}
    onAddAsset={() => setSheet('addasset')}
  />
)}

// sheet 렌더링에 추가
{sheet === 'addasset' && (
  <AddAssetSheet theme={theme} onClose={() => setSheet(null)} />
)}

// SnapshotSheet에 focusAssetId 전달 (기존 코드 수정)
{sheet === 'snapshot' && (
  <SnapshotSheet
    data={data} theme={theme}
    focusAssetId={snapshotFocusId}   // 신규
    onClose={() => { setSheet(null); setSnapshotFocusId(null); }}
    onSave={...}
  />
)}
```

새로 추가할 state:
```jsx
const [snapshotFocusId, setSnapshotFocusId] = React.useState(null);
```

---

## 수정 우선순위

| 순위 | 항목 | 중요도 |
|------|------|--------|
| 1 | `AddAssetSheet` 컴포넌트 신규 생성 | 🔴 필수 |
| 2 | `AssetsScreen` FAB 추가 + `app.jsx` 연결 | 🔴 필수 |
| 3 | "개별 입력" 버튼 자산 피커 플로우 | 🟡 중요 |
| 4 | `AssetDetailScreen` 케밥 메뉴 (편집/삭제) | 🟢 있으면 좋음 |

---

## 디자인 일관성 참고

- 기존 `AddTxSheet`(거래 추가)의 Step 구조, 색상, 버튼 스타일 그대로 따를 것
- 저장 완료 ✅ 애니메이션은 `AddTxSheet`의 `saved` state 패턴과 동일하게
- FAB 그림자: `boxShadow: '0 6px 20px rgba(49,130,246,0.40)'` — 기존 BookScreen FAB 참고
- 카테고리 선택 그리드: `TweaksPanel`의 role/persona 선택 카드 스타일 참고

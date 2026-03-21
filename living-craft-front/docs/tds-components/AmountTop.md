# AmountTop

AmountTop 컴포넌트는 금액 정보를 강조하여 상단에 표시하는 컴포넌트예요. 잔액, 총액 등 중요한 금액 정보를 눈에 띄게 보여줄 때 사용해요.

## 사용 예제

### 기본 사용

AmountTop을 사용하려면 amount를 지정하세요.

```tsx
import { AmountTop } from '@toss/tds-react-native';

<AmountTop amount={1500000} />
```

### 레이블과 함께

label 속성을 사용해 금액의 설명을 추가할 수 있어요.

```tsx
<AmountTop
  label="내 자산"
  amount={1500000}
/>
```

### 통화 단위 설정

currency 속성을 사용해 통화 단위를 지정할 수 있어요.

```tsx
<AmountTop
  label="총 잔액"
  amount={1500000}
  currency="원"
/>
```

### 색상 커스터마이즈

color 속성을 사용해 금액 색상을 변경할 수 있어요.

```tsx
import { colors } from '@toss/tds-react-native';

<AmountTop
  label="수익"
  amount={250000}
  currency="원"
  color={colors.blue500}
/>
```

### 음수 표시

음수 금액을 표시할 수 있어요.

```tsx
<AmountTop
  label="지출"
  amount={-150000}
  currency="원"
  color={colors.red500}
/>
```

### 부가 정보

description을 사용해 추가 정보를 표시할 수 있어요.

```tsx
<AmountTop
  label="예상 수익"
  amount={3500000}
  currency="원"
  description="세전 금액이에요"
/>
```

### 액션 버튼

button 속성을 사용해 액션 버튼을 추가할 수 있어요.

```tsx
<AmountTop
  label="사용 가능 금액"
  amount={500000}
  currency="원"
  button={
    <Button size="medium" onPress={handleCharge}>
      충전하기
    </Button>
  }
/>
```

### 카드에서 사용

Card 컴포넌트와 함께 사용할 수 있어요.

```tsx
<Card>
  <AmountTop
    label="이번 달 사용액"
    amount={850000}
    currency="원"
    description="전월 대비 15% 증가"
  />
</Card>
```

## 인터페이스

### AmountTopProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| amount* | - | number | 표시할 금액을 지정해요 |
| label | - | string | 금액의 설명 레이블을 지정해요 |
| currency | '원' | string | 통화 단위를 지정해요 |
| description | - | string | 부가 설명을 지정해요 |
| color | - | string | 금액 텍스트의 색상을 지정해요 |
| button | - | React.ReactNode | 액션 버튼을 지정해요 |
| showSign | false | boolean | 양수에도 + 기호를 표시할지 여부를 지정해요 |
| style | - | StyleProp<ViewStyle> | 컴포넌트의 커스텀 스타일을 지정해요 |

*필수 속성

---
*마지막 업데이트: 2025-11-28*

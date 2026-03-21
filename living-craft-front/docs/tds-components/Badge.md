# Badge

Badge 컴포넌트는 아이템의 상태를 빠르게 인식할 수 있도록 강조하는 컴포넌트예요. 작고 간결한 텍스트로 정보를 전달해요.

## 사용 예제

### 기본 사용

Badge를 사용하려면 children으로 텍스트를 전달하세요.

```tsx
import { Badge } from '@toss/tds-react-native';

<Badge>새로운</Badge>
```

### 크기 설정

size 속성을 사용해 Badge의 크기를 지정할 수 있어요.

```tsx
<Badge size="tiny">tiny</Badge>
<Badge size="small">small</Badge>
<Badge size="medium">medium</Badge>
<Badge size="large">large</Badge>
```

### 색상 타입

type 속성을 사용해 Badge의 색상을 변경할 수 있어요.

```tsx
<Badge type="blue">파란색</Badge>
<Badge type="teal">청록색</Badge>
<Badge type="green">초록색</Badge>
<Badge type="red">빨간색</Badge>
<Badge type="yellow">노란색</Badge>
<Badge type="elephant">회색</Badge>
```

### 스타일 변형

badgeStyle 속성을 사용해 시각적 스타일을 변경할 수 있어요.

```tsx
{/* 채도가 높아 시각적으로 강렬함 */}
<Badge badgeStyle="fill" type="blue">fill</Badge>

{/* 채도가 낮아 시각적으로 부드러움 */}
<Badge badgeStyle="weak" type="blue">weak</Badge>
```

### 상태 표시

다양한 상태를 표시할 때 사용해요.

```tsx
<Badge type="green">완료</Badge>
<Badge type="yellow">대기중</Badge>
<Badge type="red">취소</Badge>
<Badge type="blue">진행중</Badge>
```

### 리스트와 함께 사용

ListRow와 함께 사용할 수 있어요.

```tsx
<List>
  <ListRow
    contents={<ListRow.Texts texts={[{ text: '새로운 기능' }]} />}
    right={<Badge type="blue" size="small">NEW</Badge>}
  />
  <ListRow
    contents={<ListRow.Texts texts={[{ text: '인기 항목' }]} />}
    right={<Badge type="red" size="small">HOT</Badge>}
  />
</List>
```

### 여백 조정

marginLeft와 marginRight를 사용해 여백을 조정할 수 있어요.

```tsx
<View style={{ flexDirection: 'row', alignItems: 'center' }}>
  <Txt typography="h5">제목</Txt>
  <Badge type="red" size="small" marginLeft={8}>NEW</Badge>
</View>
```

### 알림 개수 표시

Badge로 알림 개수를 표시할 수 있어요.

```tsx
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
  <Txt>새 메시지</Txt>
  <Badge type="red" size="small" badgeStyle="fill">5</Badge>
</View>
```

### 카드에서 사용

카드 컴포넌트와 함께 사용할 수 있어요.

```tsx
<Card>
  <View>
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
      <Badge type="blue" size="tiny">혜택</Badge>
      <Badge type="green" size="tiny">무료배송</Badge>
    </View>
    <Txt typography="h5">상품 제목</Txt>
    <Txt typography="t6" color={colors.grey600}>상품 설명</Txt>
  </View>
</Card>
```

## 인터페이스

### BadgeProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| children* | - | string | Badge에 표시될 텍스트를 지정해요 |
| size | 'small' | "tiny" \| "small" \| "medium" \| "large" | Badge의 크기를 지정해요 |
| badgeStyle | 'fill' | "fill" \| "weak" | Badge의 시각적 스타일을 지정해요 |
| type | 'blue' | "blue" \| "teal" \| "green" \| "red" \| "yellow" \| "elephant" | Badge의 색상을 지정해요 |
| typography | 't5' | string | 텍스트 타이포그래피를 지정해요 |
| fontWeight | 'semiBold' | string | 텍스트 굵기를 지정해요 |
| marginLeft | 0 | number | 왼쪽 여백을 픽셀 단위로 지정해요 |
| marginRight | 0 | number | 오른쪽 여백을 픽셀 단위로 지정해요 |
| style | - | StyleProp<ViewStyle> | Badge의 커스텀 스타일을 지정해요 |

*필수 속성

---
*마지막 업데이트: 2025-11-28*

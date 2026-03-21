# Border

Border 컴포넌트는 요소에 테두리를 추가하는 컴포넌트예요. 다양한 스타일과 색상의 테두리로 콘텐츠를 강조하거나 구분할 수 있어요.

## 사용 예제

### 기본 사용

Border를 사용하려면 children을 전달하세요.

```tsx
import { Border } from '@toss/tds-react-native';

<Border>
  <View style={{ padding: 16 }}>
    <Txt>테두리가 있는 콘텐츠예요</Txt>
  </View>
</Border>
```

### 색상 설정

color 속성을 사용해 테두리 색상을 지정할 수 있어요.

```tsx
import { colors } from '@toss/tds-react-native';

<Border color={colors.blue500}>
  <View style={{ padding: 16 }}>
    <Txt>파란색 테두리</Txt>
  </View>
</Border>

<Border color={colors.red500}>
  <View style={{ padding: 16 }}>
    <Txt>빨간색 테두리</Txt>
  </View>
</Border>
```

### 두께 설정

width 속성을 사용해 테두리 두께를 지정할 수 있어요.

```tsx
<Border width={1}>
  <View style={{ padding: 16 }}>
    <Txt>얇은 테두리</Txt>
  </View>
</Border>

<Border width={3}>
  <View style={{ padding: 16 }}>
    <Txt>두꺼운 테두리</Txt>
  </View>
</Border>
```

### 모서리 둥글기

radius 속성을 사용해 테두리 모서리를 둥글게 할 수 있어요.

```tsx
<Border radius={8}>
  <View style={{ padding: 16 }}>
    <Txt>둥근 테두리</Txt>
  </View>
</Border>

<Border radius={20}>
  <View style={{ padding: 16 }}>
    <Txt>더 둥근 테두리</Txt>
  </View>
</Border>
```

### 점선 스타일

style 속성을 사용해 점선 테두리를 만들 수 있어요.

```tsx
<Border style="dashed">
  <View style={{ padding: 16 }}>
    <Txt>점선 테두리</Txt>
  </View>
</Border>

<Border style="dotted">
  <View style={{ padding: 16 }}>
    <Txt>점 테두리</Txt>
  </View>
</Border>
```

### 특정 방향만

sides 속성을 사용해 특정 방향에만 테두리를 추가할 수 있어요.

```tsx
<Border sides={['top']}>
  <View style={{ padding: 16 }}>
    <Txt>상단 테두리만</Txt>
  </View>
</Border>

<Border sides={['bottom']}>
  <View style={{ padding: 16 }}>
    <Txt>하단 테두리만</Txt>
  </View>
</Border>

<Border sides={['left', 'right']}>
  <View style={{ padding: 16 }}>
    <Txt>좌우 테두리</Txt>
  </View>
</Border>
```

### 카드 구분

여러 카드를 테두리로 구분할 수 있어요.

```tsx
<View style={{ gap: 16 }}>
  <Border color={colors.grey200} radius={12}>
    <View style={{ padding: 16 }}>
      <Txt typography="h5">카드 1</Txt>
      <Txt typography="t6">첫 번째 카드 내용</Txt>
    </View>
  </Border>

  <Border color={colors.grey200} radius={12}>
    <View style={{ padding: 16 }}>
      <Txt typography="h5">카드 2</Txt>
      <Txt typography="t6">두 번째 카드 내용</Txt>
    </View>
  </Border>
</View>
```

### 강조 영역

중요한 영역을 테두리로 강조할 수 있어요.

```tsx
<Border color={colors.blue500} width={2} radius={8}>
  <View style={{ padding: 16, backgroundColor: colors.blue50 }}>
    <Txt typography="h5" color={colors.blue700}>중요 공지</Txt>
    <Txt typography="t6" color={colors.blue600} style={{ marginTop: 8 }}>
      중요한 내용이 여기에 표시돼요
    </Txt>
  </View>
</Border>
```

### 입력 필드 스타일

입력 필드에 테두리를 추가할 수 있어요.

```tsx
const [focused, setFocused] = useState(false);

<Border
  color={focused ? colors.blue500 : colors.grey300}
  width={focused ? 2 : 1}
  radius={8}
>
  <TextInput
    onFocus={() => setFocused(true)}
    onBlur={() => setFocused(false)}
    style={{ padding: 12 }}
    placeholder="입력하세요"
  />
</Border>
```

## 인터페이스

### BorderProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| children* | - | React.ReactNode | 테두리를 적용할 콘텐츠를 지정해요 |
| color | colors.grey200 | string | 테두리 색상을 지정해요 |
| width | 1 | number | 테두리 두께를 픽셀 단위로 지정해요 |
| radius | 0 | number | 모서리 둥글기를 픽셀 단위로 지정해요 |
| style | 'solid' | "solid" \| "dashed" \| "dotted" | 테두리 스타일을 지정해요 |
| sides | ['top','right','bottom','left'] | Array<'top'\|'right'\|'bottom'\|'left'> | 테두리를 적용할 방향을 지정해요 |

*필수 속성

## 관련 컴포넌트

- Shadow: 그림자 효과가 필요할 때 사용해요

---
*마지막 업데이트: 2025-11-28*

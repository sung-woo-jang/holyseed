# Shadow

Shadow 컴포넌트는 요소에 그림자 효과를 추가하는 컴포넌트예요. 깊이감을 표현하고 요소를 시각적으로 돋보이게 만들어요.

## 사용 예제

### 기본 사용

Shadow를 사용하려면 children을 전달하세요.

```tsx
import { Shadow } from '@toss/tds-react-native';

<Shadow>
  <View style={{ padding: 20, backgroundColor: 'white', borderRadius: 12 }}>
    <Txt>그림자가 있는 카드예요</Txt>
  </View>
</Shadow>
```

### 그림자 크기 설정

size 속성을 사용해 그림자의 크기를 지정할 수 있어요.

```tsx
<Shadow size="small">
  <View style={{ padding: 16, backgroundColor: 'white', borderRadius: 8 }}>
    <Txt>작은 그림자</Txt>
  </View>
</Shadow>

<Shadow size="medium">
  <View style={{ padding: 16, backgroundColor: 'white', borderRadius: 8 }}>
    <Txt>중간 그림자</Txt>
  </View>
</Shadow>

<Shadow size="large">
  <View style={{ padding: 16, backgroundColor: 'white', borderRadius: 8 }}>
    <Txt>큰 그림자</Txt>
  </View>
</Shadow>
```

### 카드에 적용

카드 컴포넌트에 그림자를 적용할 수 있어요.

```tsx
<Shadow>
  <Card>
    <Txt typography="h5">제목</Txt>
    <Txt typography="t6" style={{ marginTop: 8 }}>
      카드 내용이 여기에 표시돼요
    </Txt>
  </Card>
</Shadow>
```

### 버튼에 적용

떠있는 효과의 버튼을 만들 수 있어요.

```tsx
<Shadow size="medium">
  <Button onPress={handlePress}>
    그림자 버튼
  </Button>
</Shadow>
```

### 이미지에 적용

이미지 주변에 그림자를 추가할 수 있어요.

```tsx
<Shadow>
  <Image
    source={{ uri: 'https://example.com/image.jpg' }}
    style={{ width: 200, height: 200, borderRadius: 12 }}
  />
</Shadow>
```

### 색상 설정

color 속성을 사용해 그림자 색상을 변경할 수 있어요.

```tsx
import { colors } from '@toss/tds-react-native';

<Shadow color={colors.blue500} opacity={0.2}>
  <View style={{ padding: 20, backgroundColor: 'white', borderRadius: 12 }}>
    <Txt>파란색 그림자</Txt>
  </View>
</Shadow>
```

### 투명도 조절

opacity 속성을 사용해 그림자 투명도를 조절할 수 있어요.

```tsx
<Shadow opacity={0.1}>
  <Card>연한 그림자</Card>
</Shadow>

<Shadow opacity={0.3}>
  <Card>진한 그림자</Card>
</Shadow>
```

### 그림자 방향

offset 속성을 사용해 그림자 방향을 조절할 수 있어요.

```tsx
<Shadow offset={{ width: 0, height: 4 }}>
  <Card>아래쪽 그림자</Card>
</Shadow>

<Shadow offset={{ width: 4, height: 0 }}>
  <Card>오른쪽 그림자</Card>
</Shadow>
```

### 플로팅 액션 버튼

떠있는 액션 버튼을 만들 수 있어요.

```tsx
<Shadow size="large">
  <Pressable
    onPress={handleAdd}
    style={{
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.blue500,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Asset.Icon name="plus" color="white" size={24} />
  </Pressable>
</Shadow>
```

## 인터페이스

### ShadowProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| children* | - | React.ReactNode | 그림자를 적용할 콘텐츠를 지정해요 |
| size | 'medium' | "small" \| "medium" \| "large" | 그림자 크기를 지정해요 |
| color | colors.grey900 | string | 그림자 색상을 지정해요 |
| opacity | 0.15 | number | 그림자 투명도를 0-1 사이 값으로 지정해요 |
| offset | {width: 0, height: 2} | {width: number, height: number} | 그림자 오프셋을 지정해요 |
| radius | 8 | number | 그림자 블러 반경을 픽셀 단위로 지정해요 |
| style | - | StyleProp<ViewStyle> | 컴포넌트의 커스텀 스타일을 지정해요 |

*필수 속성

## 중요 사항

- iOS와 Android에서 그림자 표현 방식이 다를 수 있어요
- 성능을 위해 그림자는 적절히 사용하는 것이 좋아요

---
*마지막 업데이트: 2025-11-28*

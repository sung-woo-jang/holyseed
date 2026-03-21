# Gradient

Gradient 컴포넌트는 그라데이션 배경 효과를 제공하는 컴포넌트예요. 부드러운 색상 전환으로 시각적으로 매력적인 배경을 만들어요.

## 사용 예제

### 기본 사용

Gradient를 사용하려면 colors 배열을 전달하세요.

```tsx
import { Gradient, colors } from '@toss/tds-react-native';

<Gradient colors={[colors.blue500, colors.blue700]}>
  <View style={{ padding: 20 }}>
    <Txt color="white">그라데이션 배경이에요</Txt>
  </View>
</Gradient>
```

### 방향 설정

direction 속성을 사용해 그라데이션 방향을 지정할 수 있어요.

```tsx
{/* 세로 그라데이션 */}
<Gradient
  colors={[colors.blue500, colors.purple500]}
  direction="vertical"
>
  <View style={{ padding: 20, height: 200 }}>
    <Txt color="white">세로 그라데이션</Txt>
  </View>
</Gradient>

{/* 가로 그라데이션 */}
<Gradient
  colors={[colors.blue500, colors.purple500]}
  direction="horizontal"
>
  <View style={{ padding: 20, height: 200 }}>
    <Txt color="white">가로 그라데이션</Txt>
  </View>
</Gradient>
```

### 여러 색상

여러 색상을 사용한 그라데이션을 만들 수 있어요.

```tsx
<Gradient
  colors={[colors.red500, colors.orange500, colors.yellow500]}
>
  <View style={{ padding: 20, height: 200 }}>
    <Txt color="white">다채로운 그라데이션</Txt>
  </View>
</Gradient>
```

### 대각선 그라데이션

start와 end 속성을 사용해 대각선 그라데이션을 만들 수 있어요.

```tsx
<Gradient
  colors={[colors.blue500, colors.purple500]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
>
  <View style={{ padding: 20, height: 200 }}>
    <Txt color="white">대각선 그라데이션</Txt>
  </View>
</Gradient>
```

### 헤더 배경

헤더에 그라데이션 배경을 적용할 수 있어요.

```tsx
<Gradient
  colors={[colors.blue600, colors.blue800]}
  style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 }}
>
  <Txt typography="h2" color="white">앱 제목</Txt>
  <Txt typography="t6" color="white" style={{ marginTop: 8 }}>
    부제목
  </Txt>
</Gradient>
```

### 카드 배경

카드에 그라데이션을 적용할 수 있어요.

```tsx
<Gradient
  colors={[colors.teal500, colors.green500]}
  style={{ borderRadius: 16, padding: 20 }}
>
  <Txt typography="h4" color="white">프리미엄 혜택</Txt>
  <Txt typography="t6" color="white" style={{ marginTop: 8 }}>
    특별한 혜택을 누려보세요
  </Txt>
  <Button
    type="light"
    style={{ marginTop: 16 }}
    onPress={() => {}}
  >
    자세히 보기
  </Button>
</Gradient>
```

### 투명도가 있는 그라데이션

투명도를 포함한 그라데이션을 만들 수 있어요.

```tsx
<View style={{ position: 'relative' }}>
  <Image
    source={{ uri: 'https://example.com/image.jpg' }}
    style={{ width: '100%', height: 300 }}
  />
  <Gradient
    colors={['transparent', 'rgba(0,0,0,0.7)']}
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 150,
      padding: 20,
      justifyContent: 'flex-end'
    }}
  >
    <Txt typography="h3" color="white">이미지 제목</Txt>
    <Txt typography="t6" color="white">설명 텍스트</Txt>
  </Gradient>
</View>
```

### 상태 표시

다양한 상태를 색상으로 표현할 수 있어요.

```tsx
<Gradient
  colors={[colors.green400, colors.green600]}
  style={{ borderRadius: 12, padding: 16 }}
>
  <Txt typography="h5" color="white">성공</Txt>
  <Txt typography="t6" color="white">작업이 완료되었어요</Txt>
</Gradient>

<Gradient
  colors={[colors.red400, colors.red600]}
  style={{ borderRadius: 12, padding: 16, marginTop: 12 }}
>
  <Txt typography="h5" color="white">오류</Txt>
  <Txt typography="t6" color="white">문제가 발생했어요</Txt>
</Gradient>
```

### 위치 커스터마이즈

locations 속성을 사용해 색상 전환 위치를 조절할 수 있어요.

```tsx
<Gradient
  colors={[colors.blue500, colors.purple500]}
  locations={[0, 0.8]}
>
  <View style={{ padding: 20, height: 200 }}>
    <Txt color="white">커스텀 위치 그라데이션</Txt>
  </View>
</Gradient>
```

## 인터페이스

### GradientProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| colors* | - | string[] | 그라데이션 색상 배열을 지정해요 |
| children | - | React.ReactNode | 그라데이션 위에 표시할 콘텐츠를 지정해요 |
| direction | 'vertical' | "vertical" \| "horizontal" | 그라데이션 방향을 지정해요 |
| start | {x: 0, y: 0} | {x: number, y: number} | 그라데이션 시작 위치를 0-1 사이 값으로 지정해요 |
| end | {x: 0, y: 1} | {x: number, y: number} | 그라데이션 끝 위치를 0-1 사이 값으로 지정해요 |
| locations | - | number[] | 각 색상의 위치를 0-1 사이 값으로 지정해요 |
| style | - | StyleProp<ViewStyle> | 컴포넌트의 커스텀 스타일을 지정해요 |

*필수 속성

## 중요 사항

- colors 배열은 최소 2개 이상의 색상을 포함해야 해요
- locations를 사용할 경우, 배열 길이는 colors 배열과 같아야 해요

---
*마지막 업데이트: 2025-11-28*

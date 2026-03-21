# Asset

Asset 컴포넌트는 이미지, 아이콘, Lottie 애니메이션 등을 표준화된 프레임 안에 표시하는 컴포넌트예요. 다양한 크기와 모양의 프레임을 지원해요.

## 사용 예제

### 기본 이미지

Asset.Image를 사용해 이미지를 표시할 수 있어요.

```tsx
import { Asset, colors } from '@toss/tds-react-native';

<Asset.Image
  source={{ uri: 'https://static.toss.im/2d-emojis/svg/u1F600.svg' }}
  frameShape={Asset.frameShape.SquareLarge}
  backgroundColor={colors.grey100}
/>
```

### 아이콘

Asset.Icon을 사용해 아이콘을 표시할 수 있어요.

```tsx
<Asset.Icon name="heart-line" />
```

### 색상 있는 아이콘

color 속성을 사용해 아이콘 색상을 변경할 수 있어요.

```tsx
<Asset.Icon color="green" name="heart-line" />
<Asset.Icon color="red" name="heart-line" />
<Asset.Icon color="blue" name="heart-line" />
```

### Lottie 애니메이션

Asset.Lottie를 사용해 Lottie 애니메이션을 표시할 수 있어요.

```tsx
<Asset.Lottie
  frameShape={Asset.frameShape.CleanW60}
  src="https://static.toss.im/lotties-common/alarm-spot.json"
  loop
/>
```

### 커스텀 프레임

frame 속성을 사용해 커스텀 프레임을 지정할 수 있어요.

```tsx
<Asset
  resource={<Asset.Image source={{ uri: imageUrl }} />}
  frame={{
    width: 80,
    height: 80,
    radius: 12,
    color: '#f5f5f5',
  }}
/>
```

### 이미지 스케일 조정

scale 속성을 사용해 프레임 내부의 이미지 크기를 조정할 수 있어요.

```tsx
<Asset.Image
  source={{ uri: imageUrl }}
  frameShape={Asset.frameShape.SquareLarge}
  scale={0.55}
  backgroundColor={colors.grey100}
/>
```

### 원형 프로필 이미지

원형 프레임으로 프로필 이미지를 표시할 수 있어요.

```tsx
<Asset.Image
  source={{ uri: 'https://example.com/profile.jpg' }}
  frameShape={Asset.frameShape.CircleLarge}
/>
```

### ListRow와 함께 사용

ListRow의 왼쪽 아이콘으로 사용할 수 있어요.

```tsx
<ListRow
  left={
    <Asset.Image
      source={{ uri: profileImageUrl }}
      frameShape={Asset.frameShape.CircleMedium}
    />
  }
  contents={
    <ListRow.Texts
      texts={[
        { text: '홍길동' },
        { text: 'hong@example.com' }
      ]}
    />
  }
/>
```

### 아이콘 그리드

여러 Asset을 그리드로 배치할 수 있어요.

```tsx
<View style={{ flexDirection: 'row', gap: 16 }}>
  <Asset.Icon name="home" color="blue" />
  <Asset.Icon name="search" color="green" />
  <Asset.Icon name="heart" color="red" />
  <Asset.Icon name="settings" color="grey" />
</View>
```

## 인터페이스

### AssetProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| resource* | - | React.ReactElement | 표시할 요소를 지정해요 |
| frame* | - | LegacyFrameShape | 프레임 설정을 지정해요 |
| union | - | object | 오버랩 효과 설정을 지정해요 |
| style | - | StyleProp<ViewStyle> | Asset의 커스텀 스타일을 지정해요 |

*필수 속성

### Asset.ImageProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| source* | - | ImageSourcePropType | 이미지 소스를 지정해요 |
| frameShape* | - | FrameShape | 프레임 모양을 지정해요 |
| backgroundColor | - | string | 배경 색상을 지정해요 |
| scale | 1 | number | 이미지 크기 배율을 지정해요 |

*필수 속성

### Asset.IconProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| name* | - | string | 아이콘 이름을 지정해요 |
| color | - | string | 아이콘 색상을 지정해요 |
| size | - | number | 아이콘 크기를 픽셀 단위로 지정해요 |

*필수 속성

### Asset.LottieProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| src* | - | string | Lottie 애니메이션 파일 URL을 지정해요 |
| frameShape* | - | FrameShape | 프레임 모양을 지정해요 |
| loop | false | boolean | 애니메이션을 반복 재생할지 여부를 지정해요 |

*필수 속성

### LegacyFrameShape

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| width* | - | number | 프레임 너비를 픽셀 단위로 지정해요 |
| height* | - | number | 프레임 높이를 픽셀 단위로 지정해요 |
| radius* | - | number | 프레임 모서리 둥글기를 픽셀 단위로 지정해요 |
| color* | - | string | 프레임 배경 색상을 지정해요 |
| overlap | - | object | 그림자/오버랩 설정을 지정해요 |

*필수 속성

## 관련 컴포넌트

- ListRow: 리스트 아이템과 함께 사용해요

---
*마지막 업데이트: 2025-11-28*

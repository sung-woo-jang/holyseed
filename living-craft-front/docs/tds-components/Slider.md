# Slider

Slider 컴포넌트는 슬라이딩 제스처를 통해 값을 선택할 수 있는 컴포넌트예요. 볼륨 조절, 밝기 조정, 범위 선택 등에 사용해요.

## 사용 예제

### 기본 사용

Slider를 사용하려면 value와 onChange를 지정하세요.

```tsx
import { Slider } from '@toss/tds-react-native';
import { useState } from 'react';

const [value, setValue] = useState(50);

<Slider value={value} onChange={setValue} />
```

### 범위 설정

min과 max를 사용해 최소값과 최대값을 설정할 수 있어요.

```tsx
const [volume, setVolume] = useState(50);

<Slider
  min={0}
  max={100}
  value={volume}
  onChange={setVolume}
/>
```

### 단계 설정

step 속성을 사용해 값의 증가 단위를 지정할 수 있어요.

```tsx
const [brightness, setBrightness] = useState(50);

<Slider
  min={0}
  max={100}
  step={5}
  value={brightness}
  onChange={setBrightness}
/>
```

### 색상 커스터마이즈

color 속성을 사용해 슬라이더 트랙 색상을 변경할 수 있어요.

```tsx
import { colors } from '@toss/tds-react-native';

<Slider
  value={value}
  onChange={setValue}
  color={colors.blue400}
/>
```

### 값 표시와 함께

현재 값을 텍스트로 함께 표시할 수 있어요.

```tsx
const [volume, setVolume] = useState(50);

<View>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
    <Txt typography="t5">볼륨</Txt>
    <Txt typography="t5" fontWeight="bold">{volume}%</Txt>
  </View>

  <Slider
    min={0}
    max={100}
    value={volume}
    onChange={setVolume}
  />
</View>
```

### 별점 선택

별점 선택 UI를 만들 수 있어요.

```tsx
const [rating, setRating] = useState(3);

<View>
  <View style={{ flexDirection: 'row', gap: 4, marginBottom: 16 }}>
    {Array.from({ length: 5 }).map((_, index) => (
      <Asset.Icon
        key={index}
        name={index < rating ? 'star-fill' : 'star'}
        color={index < rating ? colors.yellow500 : colors.grey300}
        size={32}
      />
    ))}
  </View>

  <Slider
    min={1}
    max={5}
    step={1}
    value={rating}
    onChange={setRating}
  />
</View>
```

### 가격 범위 선택

가격 범위를 선택할 수 있어요.

```tsx
const [price, setPrice] = useState(50000);

<View>
  <Txt typography="h4" style={{ marginBottom: 16 }}>
    {price.toLocaleString()}원
  </Txt>

  <Slider
    min={0}
    max={100000}
    step={1000}
    value={price}
    onChange={setPrice}
  />

  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
    <Txt typography="t7" color={colors.grey600}>0원</Txt>
    <Txt typography="t7" color={colors.grey600}>100,000원</Txt>
  </View>
</View>
```

### 시간 선택

시간을 슬라이더로 선택할 수 있어요.

```tsx
const [hour, setHour] = useState(12);

<View>
  <Txt typography="h4">{hour}시</Txt>

  <Slider
    min={0}
    max={23}
    step={1}
    value={hour}
    onChange={setHour}
  />
</View>
```

### 접근성 지원

accessibilityLabel과 accessibilityHint를 사용해 스크린 리더를 지원할 수 있어요.

```tsx
<Slider
  value={volume}
  onChange={setVolume}
  accessibilityLabel="볼륨 조절"
  accessibilityHint="슬라이더를 좌우로 움직여 볼륨을 조절하세요"
/>
```

### 설정 화면에서 사용

설정 화면에서 Slider를 사용할 수 있어요.

```tsx
const [fontSize, setFontSize] = useState(16);

<View>
  <ListHeader>화면 설정</ListHeader>

  <View style={{ padding: 20 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
      <Txt typography="t5">글자 크기</Txt>
      <Txt typography="t5" color={colors.grey600}>{fontSize}px</Txt>
    </View>

    <Slider
      min={12}
      max={24}
      step={1}
      value={fontSize}
      onChange={setFontSize}
    />

    <View style={{ marginTop: 16, padding: 12, backgroundColor: colors.grey100, borderRadius: 8 }}>
      <Txt style={{ fontSize }}>
        미리보기 텍스트예요
      </Txt>
    </View>
  </View>
</View>
```

## 인터페이스

### SliderProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| min | 0 | number | 슬라이더의 최소값을 지정해요 |
| max | 100 | number | 슬라이더의 최대값을 지정해요 |
| value | (min+max)/2 | number | 슬라이더의 현재 값을 지정해요 |
| step | 1 | number | 값의 증가 단위를 지정해요 (양의 정수만 가능) |
| onChange | - | (value: number) => void | 값이 변경될 때 호출되는 함수예요 |
| color | - | string | 슬라이더 트랙의 색상을 지정해요 |
| accessibilityLabel | - | string | 스크린 리더를 위한 레이블을 지정해요 |
| accessibilityHint | - | string | 스크린 리더를 위한 힌트를 지정해요 |
| style | - | StyleProp<ViewStyle> | 슬라이더의 커스텀 스타일을 지정해요 |

## 중요 사항

- iOS에서는 스와이프 제스처로, Android에서는 볼륨 키로도 슬라이더를 조작할 수 있어요
- step은 양의 정수만 사용할 수 있어요

## 관련 컴포넌트

- Stepper: 숫자 증감 버튼이 필요할 때 사용해요
- NumericSpinner: 회전 방식의 숫자 선택이 필요할 때 사용해요

---
*마지막 업데이트: 2025-11-28*

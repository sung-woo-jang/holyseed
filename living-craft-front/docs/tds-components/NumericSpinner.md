# NumericSpinner

NumericSpinner 컴포넌트는 회전 방식으로 숫자를 선택하는 컴포넌트예요. 날짜, 시간, 수량 선택 등에 사용해요.

## 사용 예제

### 기본 사용

NumericSpinner를 사용하려면 value, onChange, min, max를 지정하세요.

```tsx
import { NumericSpinner } from '@toss/tds-react-native';
import { useState } from 'react';

const [value, setValue] = useState(5);

<NumericSpinner
  value={value}
  onChange={setValue}
  min={1}
  max={10}
/>
```

### 수량 선택

상품 수량을 선택할 수 있어요.

```tsx
const [quantity, setQuantity] = useState(1);

<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
  <Txt typography="t5">수량</Txt>

  <NumericSpinner
    value={quantity}
    onChange={setQuantity}
    min={1}
    max={99}
  />
</View>
```

### 나이 선택

나이를 선택할 수 있어요.

```tsx
const [age, setAge] = useState(25);

<View>
  <Txt typography="h5" style={{ marginBottom: 12 }}>나이를 선택하세요</Txt>

  <NumericSpinner
    value={age}
    onChange={setAge}
    min={1}
    max={100}
  />
</View>
```

### 시간 선택

시간을 선택할 수 있어요.

```tsx
const [hour, setHour] = useState(12);
const [minute, setMinute] = useState(0);

<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
  <NumericSpinner
    value={hour}
    onChange={setHour}
    min={0}
    max={23}
  />

  <Txt typography="h4">:</Txt>

  <NumericSpinner
    value={minute}
    onChange={setMinute}
    min={0}
    max={59}
  />
</View>
```

### 단위 표시

단위를 함께 표시할 수 있어요.

```tsx
const [weight, setWeight] = useState(70);

<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
  <NumericSpinner
    value={weight}
    onChange={setWeight}
    min={30}
    max={150}
  />

  <Txt typography="h5">kg</Txt>
</View>
```

### 증가 단위 설정

step 속성을 사용해 증가 단위를 지정할 수 있어요.

```tsx
const [temperature, setTemperature] = useState(20);

<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
  <NumericSpinner
    value={temperature}
    onChange={setTemperature}
    min={16}
    max={30}
    step={0.5}
  />

  <Txt typography="h5">°C</Txt>
</View>
```

### 날짜 선택기

년, 월, 일을 선택할 수 있어요.

```tsx
const [year, setYear] = useState(2025);
const [month, setMonth] = useState(11);
const [day, setDay] = useState(28);

<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
  <NumericSpinner
    value={year}
    onChange={setYear}
    min={1900}
    max={2100}
  />
  <Txt typography="h5">년</Txt>

  <NumericSpinner
    value={month}
    onChange={setMonth}
    min={1}
    max={12}
  />
  <Txt typography="h5">월</Txt>

  <NumericSpinner
    value={day}
    onChange={setDay}
    min={1}
    max={31}
  />
  <Txt typography="h5">일</Txt>
</View>
```

### 가격 선택

천 단위로 증가하는 가격을 선택할 수 있어요.

```tsx
const [price, setPrice] = useState(10000);

<View>
  <Txt typography="h3" style={{ marginBottom: 12 }}>
    {price.toLocaleString()}원
  </Txt>

  <NumericSpinner
    value={price}
    onChange={setPrice}
    min={1000}
    max={100000}
    step={1000}
  />
</View>
```

### 비활성화 상태

disabled 속성을 사용해 스피너를 비활성화할 수 있어요.

```tsx
<NumericSpinner
  value={value}
  onChange={setValue}
  min={1}
  max={10}
  disabled
/>
```

### 순환 모드

loop 속성을 사용해 최대값에서 최소값으로 순환하도록 할 수 있어요.

```tsx
const [hour, setHour] = useState(0);

<NumericSpinner
  value={hour}
  onChange={setHour}
  min={0}
  max={23}
  loop
/>
```

## 인터페이스

### NumericSpinnerProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| value* | - | number | 현재 선택된 값을 지정해요 |
| onChange* | - | (value: number) => void | 값이 변경될 때 호출되는 함수예요 |
| min* | - | number | 최소값을 지정해요 |
| max* | - | number | 최대값을 지정해요 |
| step | 1 | number | 값의 증가 단위를 지정해요 |
| loop | false | boolean | 순환 모드 활성화 여부를 지정해요 |
| disabled | false | boolean | 스피너를 비활성화할지 여부를 지정해요 |
| formatter | - | (value: number) => string | 값을 포맷팅하는 함수를 지정해요 |
| style | - | StyleProp<ViewStyle> | 스피너의 커스텀 스타일을 지정해요 |

*필수 속성

## 관련 컴포넌트

- Slider: 슬라이딩으로 값을 선택할 때 사용해요
- Stepper: 단계별 프로세스를 표시할 때 사용해요

---
*마지막 업데이트: 2025-11-28*

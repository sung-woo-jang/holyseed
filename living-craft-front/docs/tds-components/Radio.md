# Radio

Radio 컴포넌트는 여러 옵션 중 하나만 선택할 수 있는 UI 요소예요. 부드러운 애니메이션과 강조된 선택 상태를 제공해요.

## 사용 예제

### 기본 사용

Radio를 사용하려면 value, onChange, 그리고 Radio.Option을 지정하세요.

```tsx
import { Radio } from '@toss/tds-react-native';
import { useState } from 'react';

const [value, setValue] = useState('option1');

<Radio value={value} onChange={setValue}>
  <Radio.Option value="option1">옵션 1</Radio.Option>
  <Radio.Option value="option2">옵션 2</Radio.Option>
  <Radio.Option value="option3">옵션 3</Radio.Option>
</Radio>
```

### 두 개 옵션 (이진 선택)

예/아니오, 참/거짓과 같은 이진 선택을 처리할 수 있어요.

```tsx
const [agree, setAgree] = useState('yes');

<Radio value={agree} onChange={setAgree}>
  <Radio.Option value="yes">예</Radio.Option>
  <Radio.Option value="no">아니오</Radio.Option>
</Radio>
```

### 여러 개 옵션

네 개 이상의 옵션도 처리할 수 있어요.

```tsx
const [period, setPeriod] = useState('3months');

<Radio value={period} onChange={setPeriod}>
  <Radio.Option value="1month">1개월</Radio.Option>
  <Radio.Option value="3months">3개월</Radio.Option>
  <Radio.Option value="6months">6개월</Radio.Option>
  <Radio.Option value="12months">12개월</Radio.Option>
</Radio>
```

### 비활성화 상태

전체 Radio를 비활성화하거나 개별 옵션만 비활성화할 수 있어요.

```tsx
{/* 전체 비활성화 */}
<Radio value={value} onChange={setValue} disabled>
  <Radio.Option value="option1">옵션 1</Radio.Option>
  <Radio.Option value="option2">옵션 2</Radio.Option>
</Radio>

{/* 개별 옵션 비활성화 */}
<Radio value={value} onChange={setValue}>
  <Radio.Option value="option1">옵션 1</Radio.Option>
  <Radio.Option value="option2" disabled>옵션 2 (비활성화)</Radio.Option>
  <Radio.Option value="option3">옵션 3</Radio.Option>
</Radio>
```

### 좌우 여백 조정

horizontalMargin을 사용해 옵션 사이의 좌우 간격을 조정할 수 있어요.

```tsx
<Radio value={value} onChange={setValue} horizontalMargin={16}>
  <Radio.Option value="option1">옵션 1</Radio.Option>
  <Radio.Option value="option2">옵션 2</Radio.Option>
  <Radio.Option value="option3">옵션 3</Radio.Option>
</Radio>
```

### 커스텀 onPress 핸들러

개별 옵션에 onPress를 추가해 선택 시 추가 로직을 실행할 수 있어요.

```tsx
<Radio value={value} onChange={setValue}>
  <Radio.Option
    value="option1"
    onPress={() => console.log('옵션 1 선택됨')}
  >
    옵션 1
  </Radio.Option>
  <Radio.Option
    value="option2"
    onPress={() => console.log('옵션 2 선택됨')}
  >
    옵션 2
  </Radio.Option>
</Radio>
```

## 인터페이스

### RadioProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| value* | - | string | 현재 선택된 옵션의 값을 지정해요 |
| onChange* | - | (value: string) => void | 옵션이 선택될 때 호출되는 함수예요 |
| children* | - | React.ReactNode | Radio.Option 컴포넌트들을 지정해요 |
| disabled | false | boolean | 전체 Radio를 비활성화할지 여부를 지정해요 |
| horizontalMargin | 0 | number | 옵션 사이의 좌우 간격을 픽셀 단위로 지정해요 |

*필수 속성

### RadioOptionProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| value* | - | string | 옵션의 값을 지정해요 |
| children* | - | React.ReactNode | 옵션에 표시될 콘텐츠를 지정해요 |
| checked | false | boolean | 옵션의 선택 상태를 지정해요 |
| disabled | false | boolean | 개별 옵션을 비활성화할지 여부를 지정해요 |
| onPress | - | () => void | 옵션을 클릭했을 때 호출되는 함수예요 |

*필수 속성

## 관련 컴포넌트

- Checkbox: 여러 옵션을 동시에 선택할 때 사용해요
- SegmentedControl: 탭 형태의 선택 UI가 필요할 때 사용해요

---
*마지막 업데이트: 2025-11-28*

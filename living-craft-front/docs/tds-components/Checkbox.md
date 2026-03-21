# Checkbox

Checkbox 컴포넌트는 사용자가 하나 이상의 옵션을 선택할 수 있는 UI 요소예요. 두 가지 스타일 변형을 제공해요.

## 사용 예제

### 기본 사용 (Circle)

Checkbox.Circle을 사용해 원형 체크박스를 표시할 수 있어요.

```tsx
import { Checkbox } from '@toss/tds-react-native';
import { useState } from 'react';

const [checked, setChecked] = useState(false);

<Checkbox.Circle
  checked={checked}
  onCheckedChange={setChecked}
/>
```

### 라인 스타일

Checkbox.Line을 사용해 독립적인 체크마크 아이콘을 표시할 수 있어요.

```tsx
const [checked, setChecked] = useState(false);

<Checkbox.Line
  checked={checked}
  onCheckedChange={setChecked}
/>
```

### 기본값으로 선택된 상태

defaultChecked를 사용해 컴포넌트 내부에서 상태를 관리할 수 있어요.

```tsx
<Checkbox.Circle defaultChecked={true} />
```

### 크기 조정

size 속성을 사용해 체크박스의 크기를 조정할 수 있어요.

```tsx
<Checkbox.Circle size={24} checked={checked} onCheckedChange={setChecked} />
<Checkbox.Circle size={32} checked={checked} onCheckedChange={setChecked} />
<Checkbox.Circle size={40} checked={checked} onCheckedChange={setChecked} />
```

### 비활성화 상태

disabled 속성을 사용해 체크박스를 비활성화할 수 있어요. 비활성화된 상태에서 클릭하면 흔들림 애니메이션이 표시돼요.

```tsx
<Checkbox.Circle
  checked={false}
  disabled
  onCheckedChange={setChecked}
/>

<Checkbox.Circle
  checked={true}
  disabled
  onCheckedChange={setChecked}
/>
```

### 여러 개 사용하기

여러 체크박스를 함께 사용할 수 있어요.

```tsx
const [options, setOptions] = useState({
  option1: false,
  option2: false,
  option3: true,
});

<View>
  <Checkbox.Circle
    checked={options.option1}
    onCheckedChange={(checked) => setOptions({...options, option1: checked})}
  />
  <Checkbox.Circle
    checked={options.option2}
    onCheckedChange={(checked) => setOptions({...options, option2: checked})}
  />
  <Checkbox.Circle
    checked={options.option3}
    onCheckedChange={(checked) => setOptions({...options, option3: checked})}
  />
</View>
```

## 인터페이스

### CheckboxProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| checked | - | boolean | 체크박스가 선택된 상태인지 여부를 지정해요 |
| defaultChecked | - | boolean | 체크박스의 초기 선택 상태를 지정해요 (내부 상태 관리) |
| onCheckedChange | - | (checked: boolean) => void | 선택 상태가 변경될 때 호출되는 함수예요 |
| disabled | false | boolean | 체크박스를 비활성화할지 여부를 지정해요 |
| size | 24 | number | 체크박스의 크기를 픽셀 단위로 지정해요 |
| style | - | StyleProp<ViewStyle> | 체크박스의 커스텀 스타일을 지정해요 |

## 관련 컴포넌트

- Radio: 여러 옵션 중 하나만 선택할 때 사용해요

---
*마지막 업데이트: 2025-11-28*

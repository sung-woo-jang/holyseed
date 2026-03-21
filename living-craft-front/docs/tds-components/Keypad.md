# Keypad

Keypad 컴포넌트(NumberKeypad)는 숫자 입력을 위한 가상 키패드 컴포넌트예요. 금액 입력, PIN 코드, 전화번호 등 다양한 숫자 입력 상황에서 사용해요.

## 사용 예제

### 기본 사용

NumberKeypad를 사용하려면 onKeyPress와 onBackspacePress를 지정하세요.

```tsx
import { NumberKeypad } from '@toss/tds-react-native';
import { useState } from 'react';

const [value, setValue] = useState('');

<NumberKeypad
  onKeyPress={(num) => setValue(prev => prev + num)}
  onBackspacePress={() => setValue(prev => prev.slice(0, -1))}
/>
```

### 금액 입력

금액 입력 시나리오에서 사용할 수 있어요.

```tsx
const [amount, setAmount] = useState('');

const handleKeyPress = (num: number) => {
  const newAmount = amount + num;
  if (Number(newAmount) <= 1000000) {
    setAmount(newAmount);
  }
};

const handleBackspace = () => {
  setAmount(prev => prev.slice(0, -1));
};

<View>
  <View style={{ padding: 20, alignItems: 'center' }}>
    <Txt typography="h2">
      {amount ? Number(amount).toLocaleString() : '0'}원
    </Txt>
  </View>

  <NumberKeypad
    onKeyPress={handleKeyPress}
    onBackspacePress={handleBackspace}
  />
</View>
```

### PIN 코드 입력

PIN 코드 입력을 구현할 수 있어요.

```tsx
const [pin, setPin] = useState('');
const maxLength = 6;

const handleKeyPress = (num: number) => {
  if (pin.length < maxLength) {
    const newPin = pin + num;
    setPin(newPin);

    if (newPin.length === maxLength) {
      verifyPin(newPin);
    }
  }
};

<View>
  <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center', padding: 20 }}>
    {Array.from({ length: maxLength }).map((_, index) => (
      <View
        key={index}
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: index < pin.length ? colors.blue500 : colors.grey300,
        }}
      />
    ))}
  </View>

  <NumberKeypad
    onKeyPress={handleKeyPress}
    onBackspacePress={() => setPin(prev => prev.slice(0, -1))}
  />
</View>
```

### 전화번호 입력

전화번호 입력 시 자동으로 포맷팅할 수 있어요.

```tsx
const [phone, setPhone] = useState('');

const formatPhoneNumber = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{0,3})(\d{0,4})(\d{0,4})$/);

  if (match) {
    return [match[1], match[2], match[3]].filter(Boolean).join('-');
  }
  return value;
};

const handleKeyPress = (num: number) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 11) {
    setPhone(formatPhoneNumber(cleaned + num));
  }
};

<View>
  <Txt typography="h3" style={{ textAlign: 'center', padding: 20 }}>
    {phone || '010-0000-0000'}
  </Txt>

  <NumberKeypad
    onKeyPress={handleKeyPress}
    onBackspacePress={() => {
      const cleaned = phone.replace(/\D/g, '');
      setPhone(formatPhoneNumber(cleaned.slice(0, -1)));
    }}
  />
</View>
```

### 커스텀 숫자 배열

numbers 속성을 사용해 숫자 배열을 커스터마이즈할 수 있어요.

```tsx
<NumberKeypad
  numbers={[1, 2, 3, 4, 5, 6, 7, 8, 9, 0]}
  onKeyPress={handleKeyPress}
  onBackspacePress={handleBackspace}
/>
```

### 계산기

간단한 계산기를 만들 수 있어요.

```tsx
const [display, setDisplay] = useState('0');

const handleKeyPress = (num: number) => {
  if (display === '0') {
    setDisplay(String(num));
  } else {
    setDisplay(prev => prev + num);
  }
};

const handleBackspace = () => {
  setDisplay(prev => {
    const newValue = prev.slice(0, -1);
    return newValue || '0';
  });
};

<View>
  <View style={{ backgroundColor: colors.grey100, padding: 20, minHeight: 80 }}>
    <Txt typography="h1" style={{ textAlign: 'right' }}>
      {display}
    </Txt>
  </View>

  <NumberKeypad
    onKeyPress={handleKeyPress}
    onBackspacePress={handleBackspace}
  />
</View>
```

### 검증과 함께 사용

입력값 검증을 추가할 수 있어요.

```tsx
const [value, setValue] = useState('');
const [error, setError] = useState('');

const handleKeyPress = (num: number) => {
  const newValue = value + num;

  if (Number(newValue) > 100) {
    setError('100 이하의 숫자만 입력할 수 있어요');
  } else {
    setError('');
    setValue(newValue);
  }
};

<View>
  <Txt typography="h2">{value || '0'}</Txt>
  {error && <Txt color={colors.red500}>{error}</Txt>}

  <NumberKeypad
    onKeyPress={handleKeyPress}
    onBackspacePress={() => {
      setError('');
      setValue(prev => prev.slice(0, -1));
    }}
  />
</View>
```

## 인터페이스

### NumberKeypadProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| onKeyPress* | - | (value: number) => void | 숫자 키를 클릭했을 때 호출되는 함수예요 |
| onBackspacePress* | - | () => void | Backspace 키를 클릭했을 때 호출되는 함수예요 |
| numbers | [1,2,3,4,5,6,7,8,9,0] | number[] | 키패드에 표시할 숫자 배열을 지정해요 |
| style | - | StyleProp<ViewStyle> | 키패드의 커스텀 스타일을 지정해요 |

*필수 속성

## 관련 컴포넌트

- TextField: 일반 텍스트 입력이 필요할 때 사용해요
- Slider: 범위 내에서 값을 선택할 때 사용해요

---
*마지막 업데이트: 2025-11-28*

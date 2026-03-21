# Switch

Switch 컴포넌트는 두 가지 상태(켜짐/꺼짐, 활성화/비활성화) 사이를 전환하는 UI 요소예요. 주로 설정이나 옵션을 제어할 때 사용하며, 사용자 상호작용 시 직관적인 시각적 피드백을 제공해요.

## 사용 예제

### 기본 사용

Switch를 사용하려면 checked와 onCheckedChange를 지정하세요.

```tsx
import { Switch } from '@toss/tds-react-native';
import { useState } from 'react';

const [checked, setChecked] = useState(true);

<Switch checked={checked} onCheckedChange={setChecked} />
```

### 기본값 설정

defaultChecked를 사용해 컴포넌트 내부에서 상태를 관리할 수 있어요.

```tsx
<Switch defaultChecked={true} />
<Switch defaultChecked={false} />
```

### 여러 개 사용하기

여러 Switch를 함께 배치할 수 있어요.

```tsx
const [checked1, setChecked1] = useState(true);
const [checked2, setChecked2] = useState(false);

<View style={{ flexDirection: 'row', gap: 8 }}>
  <Switch checked={checked1} onCheckedChange={setChecked1} />
  <Switch checked={checked2} onCheckedChange={setChecked2} />
</View>
```

### 비활성화 상태

disabled 속성을 사용해 Switch를 비활성화할 수 있어요.

```tsx
<Switch checked={true} disabled />
<Switch checked={false} disabled />
```

### 설정 화면에서 사용

Switch는 설정 화면에서 자주 사용돼요.

```tsx
const [notifications, setNotifications] = useState(true);
const [darkMode, setDarkMode] = useState(false);

<View>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
    <Txt typography="h5">알림 받기</Txt>
    <Switch checked={notifications} onCheckedChange={setNotifications} />
  </View>

  <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
    <Txt typography="h5">다크 모드</Txt>
    <Switch checked={darkMode} onCheckedChange={setDarkMode} />
  </View>
</View>
```

### onPress 이벤트 추가

onPress를 사용해 Switch 클릭 시 추가 로직을 실행할 수 있어요.

```tsx
<Switch
  checked={checked}
  onCheckedChange={setChecked}
  onPress={() => console.log('Switch 클릭됨')}
/>
```

## 인터페이스

### SwitchProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| checked | - | boolean | Switch의 켜짐/꺼짐 상태를 지정해요 |
| onCheckedChange | - | (checked: boolean) => void | 상태가 변경될 때 호출되는 함수예요 |
| defaultChecked | false | boolean | Switch의 초기 상태를 지정해요 (내부 상태 관리) |
| disabled | false | boolean | Switch를 비활성화할지 여부를 지정해요 |
| onPress | - | () => void | Switch를 클릭했을 때 호출되는 함수예요 |
| style | - | StyleProp<ViewStyle> | Switch의 커스텀 스타일을 지정해요 |

## 관련 컴포넌트

- Checkbox: 여러 옵션을 선택할 때 사용해요

---
*마지막 업데이트: 2025-11-28*

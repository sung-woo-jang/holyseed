# TextField

텍스트 입력을 받는 컴포넌트입니다. 다양한 입력 상황에 맞는 스타일과 옵션을 제공합니다.

## Import

```tsx
import { TextField } from '@toss/tds-react-native';
```

## Variants

TextField는 4가지 변형을 제공합니다:

- **box** - 박스 스타일
- **line** - 라인 스타일
- **big** - 큰 크기
- **hero** - 히어로 크기

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'box' \| 'line' \| 'big' \| 'hero'` | Required | 필드 외형 스타일 |
| `value` | `string \| number` | - | 현재 입력 값 |
| `onChangeText` | `(text: string) => void` | - | 텍스트 변경 시 호출되는 콜백 |
| `label` | `string` | - | 상단 라벨 텍스트 |
| `labelOption` | `'appear' \| 'sustain'` | `'appear'` | 라벨 표시 방식 제어 |
| `help` | `ReactNode` | - | 필드 하단에 표시되는 도움말 텍스트 |
| `hasError` | `boolean` | `false` | 에러 상태 표시 여부 |
| `disabled` | `boolean` | `false` | 필드 비활성화 여부 |
| `prefix` | `string` | - | 입력 값 앞에 표시되는 텍스트 |
| `suffix` | `string` | - | 입력 값 뒤에 표시되는 텍스트 |
| `placeholder` | `string` | - | 플레이스홀더 텍스트 |
| `format` | `object` | - | 입력 포맷팅 규칙 |
| `maxLength` | `number` | - | 최대 입력 길이 |
| `keyboardType` | `string` | - | 키보드 타입 선택 |

## 기본 사용 예제

### Box Variant

```tsx
import { TextField } from '@toss/tds-react-native';

function BasicExample() {
  const [value, setValue] = useState('');

  return (
    <TextField
      variant="box"
      label="이름"
      value={value}
      onChangeText={setValue}
      placeholder="이름을 입력하세요"
    />
  );
}
```

### Line Variant

```tsx
<TextField
  variant="line"
  label="이메일"
  value={email}
  onChangeText={setEmail}
  placeholder="example@email.com"
  keyboardType="email-address"
/>
```

## 특수 변형

### TextField.Clearable

입력 값을 쉽게 지울 수 있는 클리어 버튼을 제공합니다.

```tsx
<TextField.Clearable
  variant="box"
  label="검색"
  value={searchText}
  onChangeText={setSearchText}
  placeholder="검색어를 입력하세요"
/>
```

### TextField.Button

클릭 가능하지만 직접 편집할 수 없는 필드입니다. 날짜 선택기 등에 유용합니다.

```tsx
<TextField.Button
  variant="box"
  label="생년월일"
  value={selectedDate}
  onPress={handleDatePickerOpen}
  placeholder="날짜를 선택하세요"
/>
```

## 고급 사용 예제

### 금액 입력 (Prefix/Suffix)

```tsx
<TextField
  variant="box"
  label="금액"
  value={amount}
  onChangeText={setAmount}
  prefix="₩"
  suffix="원"
  keyboardType="numeric"
/>
```

### 에러 상태

```tsx
<TextField
  variant="box"
  label="비밀번호"
  value={password}
  onChangeText={setPassword}
  hasError={passwordError}
  help={passwordError ? "비밀번호는 8자 이상이어야 합니다" : ""}
  secureTextEntry
/>
```

### Label Option

```tsx
{/* appear: 값이 있을 때만 라벨 표시 */}
<TextField
  variant="box"
  label="이름"
  labelOption="appear"
  value={name}
  onChangeText={setName}
/>

{/* sustain: 항상 라벨 표시 */}
<TextField
  variant="box"
  label="이메일"
  labelOption="sustain"
  value={email}
  onChangeText={setEmail}
/>
```

### 포맷팅

```tsx
<TextField
  variant="box"
  label="전화번호"
  value={phone}
  onChangeText={setPhone}
  format={{
    // 포맷팅 규칙 설정
  }}
  placeholder="010-0000-0000"
  keyboardType="phone-pad"
/>
```

## 일반적인 사용 사례

- **금액 입력**: prefix/suffix를 사용한 금액 포맷팅
- **전화번호**: format을 사용한 전화번호 포맷팅
- **이메일**: keyboardType과 함께 이메일 입력 검증
- **검색 필드**: Clearable 변형을 사용한 검색
- **날짜/시간 선택**: Button 변형을 사용한 날짜 선택기

## 참고 사항

- `variant`는 필수 prop입니다
- 접근성을 위해 `label`을 제공하는 것이 권장됩니다
- 에러 상태일 때는 `hasError`와 함께 `help`로 에러 메시지를 제공하세요
- `format` prop의 상세한 사용법은 TDS 문서를 참조하세요

## 참고 문서

- [TDS TextField 공식 문서](https://tossmini-docs.toss.im/tds-react-native/components/text-field/)

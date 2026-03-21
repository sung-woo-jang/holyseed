# TextButton

TextButton 컴포넌트는 텍스트만으로 구성된 버튼이에요. 배경이나 테두리 없이 텍스트로만 액션을 표현할 때 사용해요.

## 사용 예제

### 기본 사용

TextButton을 사용하려면 children과 onPress를 지정하세요.

```tsx
import { TextButton } from '@toss/tds-react-native';

<TextButton onPress={() => console.log('클릭!')}>
  더보기
</TextButton>
```

### 크기 설정

size 속성을 사용해 버튼의 크기를 지정할 수 있어요.

```tsx
<TextButton size="small" onPress={() => {}}>
  작은 버튼
</TextButton>

<TextButton size="medium" onPress={() => {}}>
  중간 버튼
</TextButton>

<TextButton size="large" onPress={() => {}}>
  큰 버튼
</TextButton>
```

### 색상 변경

color 속성을 사용해 텍스트 색상을 변경할 수 있어요.

```tsx
import { colors } from '@toss/tds-react-native';

<TextButton color={colors.blue500} onPress={() => {}}>
  파란색 버튼
</TextButton>

<TextButton color={colors.red500} onPress={() => {}}>
  빨간색 버튼
</TextButton>

<TextButton color={colors.grey700} onPress={() => {}}>
  회색 버튼
</TextButton>
```

### 비활성화 상태

disabled 속성을 사용해 버튼을 비활성화할 수 있어요.

```tsx
<TextButton disabled onPress={() => {}}>
  비활성화된 버튼
</TextButton>
```

### 보조 액션으로 사용

주 버튼 옆에 보조 액션으로 자주 사용돼요.

```tsx
<View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
  <Button onPress={handleSubmit}>
    제출하기
  </Button>

  <TextButton onPress={handleCancel}>
    취소
  </TextButton>
</View>
```

### 링크 스타일

underline 속성을 사용해 밑줄을 추가할 수 있어요.

```tsx
<TextButton underline onPress={() => openTerms()}>
  이용약관 보기
</TextButton>
```

### 목록 하단에서 사용

더보기 기능을 위해 목록 하단에 자주 사용돼요.

```tsx
<View>
  {/* 아이템 목록 */}
  {items.slice(0, 5).map(item => (
    <ListRow key={item.id} {...item} />
  ))}

  {items.length > 5 && (
    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
      <TextButton onPress={handleShowMore}>
        전체보기
      </TextButton>
    </View>
  )}
</View>
```

### 아이콘과 함께 사용

아이콘을 포함한 TextButton을 만들 수 있어요.

```tsx
<TextButton
  icon="arrow-right"
  iconPosition="right"
  onPress={() => navigate('/detail')}
>
  자세히 보기
</TextButton>

<TextButton
  icon="download"
  iconPosition="left"
  onPress={() => handleDownload()}
>
  다운로드
</TextButton>
```

## 인터페이스

### TextButtonProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| children* | - | React.ReactNode | 버튼에 표시될 텍스트를 지정해요 |
| onPress* | - | () => void | 버튼을 클릭했을 때 호출되는 함수예요 |
| size | 'medium' | "small" \| "medium" \| "large" | 버튼의 크기를 지정해요 |
| color | - | string | 텍스트의 색상을 지정해요 |
| disabled | false | boolean | 버튼을 비활성화할지 여부를 지정해요 |
| underline | false | boolean | 텍스트에 밑줄을 추가할지 여부를 지정해요 |
| icon | - | string | 표시할 아이콘의 이름을 지정해요 |
| iconPosition | 'left' | "left" \| "right" | 아이콘의 위치를 지정해요 |
| style | - | StyleProp<ViewStyle> | 버튼의 커스텀 스타일을 지정해요 |

*필수 속성

## 관련 컴포넌트

- Button: 배경이 있는 버튼이 필요할 때 사용해요
- IconButton: 아이콘만으로 구성된 버튼이 필요할 때 사용해요

---
*마지막 업데이트: 2025-11-28*

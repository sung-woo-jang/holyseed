# IconButton

IconButton 컴포넌트는 아이콘만으로 구성된 버튼이에요. 간결한 UI를 위해 텍스트 없이 아이콘으로만 액션을 표현할 때 사용해요.

## 사용 예제

### 기본 사용

IconButton을 사용하려면 icon과 onPress를 지정하세요.

```tsx
import { IconButton } from '@toss/tds-react-native';

<IconButton
  icon="close"
  onPress={() => console.log('닫기 버튼 클릭')}
/>
```

### 다양한 아이콘

여러 종류의 아이콘을 사용할 수 있어요.

```tsx
<View style={{ flexDirection: 'row', gap: 12 }}>
  <IconButton icon="heart" onPress={() => {}} />
  <IconButton icon="share" onPress={() => {}} />
  <IconButton icon="settings" onPress={() => {}} />
  <IconButton icon="search" onPress={() => {}} />
  <IconButton icon="menu" onPress={() => {}} />
</View>
```

### 크기 설정

size 속성을 사용해 버튼의 크기를 지정할 수 있어요.

```tsx
<IconButton icon="heart" size="small" onPress={() => {}} />
<IconButton icon="heart" size="medium" onPress={() => {}} />
<IconButton icon="heart" size="large" onPress={() => {}} />
```

### 색상 변경

color 속성을 사용해 아이콘의 색상을 변경할 수 있어요.

```tsx
import { colors } from '@toss/tds-react-native';

<IconButton
  icon="heart"
  color={colors.red500}
  onPress={() => {}}
/>

<IconButton
  icon="star"
  color={colors.yellow500}
  onPress={() => {}}
/>
```

### 비활성화 상태

disabled 속성을 사용해 버튼을 비활성화할 수 있어요.

```tsx
<IconButton
  icon="heart"
  disabled
  onPress={() => {}}
/>
```

### 헤더에서 사용

네비게이션 헤더의 좌우 버튼으로 자주 사용돼요.

```tsx
<View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
  <IconButton
    icon="arrow-left"
    onPress={() => navigation.goBack()}
  />

  <Txt typography="h4">페이지 제목</Txt>

  <IconButton
    icon="more"
    onPress={() => openMenu()}
  />
</View>
```

### 툴바에서 사용

여러 IconButton을 함께 배치해 툴바를 구성할 수 있어요.

```tsx
<View style={{ flexDirection: 'row', gap: 16, padding: 16 }}>
  <IconButton icon="edit" onPress={() => handleEdit()} />
  <IconButton icon="share" onPress={() => handleShare()} />
  <IconButton icon="bookmark" onPress={() => handleBookmark()} />
  <IconButton icon="delete" onPress={() => handleDelete()} />
</View>
```

### 접근성 레이블

accessibilityLabel을 사용해 스크린 리더를 위한 설명을 추가할 수 있어요.

```tsx
<IconButton
  icon="heart"
  accessibilityLabel="좋아요 추가"
  onPress={() => handleLike()}
/>
```

## 인터페이스

### IconButtonProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| icon* | - | string | 표시할 아이콘의 이름을 지정해요 |
| onPress* | - | () => void | 버튼을 클릭했을 때 호출되는 함수예요 |
| size | 'medium' | "small" \| "medium" \| "large" | 버튼의 크기를 지정해요 |
| color | - | string | 아이콘의 색상을 지정해요 |
| disabled | false | boolean | 버튼을 비활성화할지 여부를 지정해요 |
| accessibilityLabel | - | string | 스크린 리더를 위한 설명을 지정해요 |
| style | - | StyleProp<ViewStyle> | 버튼의 커스텀 스타일을 지정해요 |

*필수 속성

## 관련 컴포넌트

- Button: 텍스트가 있는 버튼이 필요할 때 사용해요
- TextButton: 텍스트만으로 구성된 버튼이 필요할 때 사용해요

---
*마지막 업데이트: 2025-11-28*

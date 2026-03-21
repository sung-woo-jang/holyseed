# Dropdown

Dropdown 컴포넌트는 버튼을 클릭하면 나타나는 메뉴 인터페이스를 제공하는 컴포넌트예요. 여러 옵션 중 하나를 선택할 때 사용해요.

## 사용 예제

### 기본 사용

Dropdown을 사용하려면 Dropdown.Item을 children으로 전달하세요.

```tsx
import { Dropdown } from '@toss/tds-react-native';

<Dropdown>
  <Dropdown.Item onPress={() => console.log('옵션 1 선택')}>
    옵션 1
  </Dropdown.Item>
  <Dropdown.Item onPress={() => console.log('옵션 2 선택')}>
    옵션 2
  </Dropdown.Item>
  <Dropdown.Item onPress={() => console.log('옵션 3 선택')}>
    옵션 3
  </Dropdown.Item>
</Dropdown>
```

### 비활성화된 아이템

disabled 속성을 사용해 특정 옵션을 비활성화할 수 있어요.

```tsx
<Dropdown>
  <Dropdown.Item onPress={() => handleAction('edit')}>
    수정
  </Dropdown.Item>
  <Dropdown.Item onPress={() => handleAction('share')}>
    공유
  </Dropdown.Item>
  <Dropdown.Item disabled>
    사용 불가
  </Dropdown.Item>
</Dropdown>
```

### 메뉴 액션

수정, 공유, 삭제 등의 메뉴 액션을 구현할 수 있어요.

```tsx
<Dropdown>
  <Dropdown.Item onPress={handleEdit}>
    수정
  </Dropdown.Item>
  <Dropdown.Item onPress={handleShare}>
    공유
  </Dropdown.Item>
  <Dropdown.Item onPress={handleDelete}>
    삭제
  </Dropdown.Item>
</Dropdown>
```

### 아이콘과 함께

아이콘을 포함한 메뉴 아이템을 만들 수 있어요.

```tsx
<Dropdown>
  <Dropdown.Item onPress={handleEdit}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Asset.Icon name="edit" size={20} />
      <Txt>수정</Txt>
    </View>
  </Dropdown.Item>
  <Dropdown.Item onPress={handleShare}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Asset.Icon name="share" size={20} />
      <Txt>공유</Txt>
    </View>
  </Dropdown.Item>
  <Dropdown.Item onPress={handleDelete}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Asset.Icon name="delete" size={20} color={colors.red500} />
      <Txt color={colors.red500}>삭제</Txt>
    </View>
  </Dropdown.Item>
</Dropdown>
```

### 설정 메뉴

ListRow와 함께 사용해 설정 메뉴를 만들 수 있어요.

```tsx
<ListRow
  contents={<ListRow.Texts texts={[{ text: '항목 설정' }]} />}
  right={
    <Dropdown>
      <Dropdown.Item onPress={() => handleSort('name')}>
        이름순
      </Dropdown.Item>
      <Dropdown.Item onPress={() => handleSort('date')}>
        날짜순
      </Dropdown.Item>
      <Dropdown.Item onPress={() => handleSort('size')}>
        크기순
      </Dropdown.Item>
    </Dropdown>
  }
/>
```

### 더보기 메뉴

게시글이나 댓글에 더보기 메뉴를 추가할 수 있어요.

```tsx
<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
  <View>
    <Txt typography="h5">게시글 제목</Txt>
    <Txt typography="t6" color={colors.grey600}>2025-11-28</Txt>
  </View>

  <Dropdown>
    <Dropdown.Item onPress={handleEdit}>수정</Dropdown.Item>
    <Dropdown.Item onPress={handleReport}>신고</Dropdown.Item>
    <Dropdown.Item onPress={handleDelete}>삭제</Dropdown.Item>
  </Dropdown>
</View>
```

### 필터 선택

필터 옵션을 드롭다운으로 제공할 수 있어요.

```tsx
const [filter, setFilter] = useState('all');

<Dropdown>
  <Dropdown.Item onPress={() => setFilter('all')}>
    전체
  </Dropdown.Item>
  <Dropdown.Item onPress={() => setFilter('unread')}>
    읽지 않음
  </Dropdown.Item>
  <Dropdown.Item onPress={() => setFilter('important')}>
    중요
  </Dropdown.Item>
</Dropdown>
```

## 인터페이스

### DropdownProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| children* | - | React.ReactNode | Dropdown.Item 컴포넌트들을 지정해요 |
| trigger | - | React.ReactNode | 드롭다운을 열 트리거 요소를 지정해요 |
| position | 'bottom' | "top" \| "bottom" \| "left" \| "right" | 드롭다운 메뉴의 위치를 지정해요 |
| style | - | StyleProp<ViewStyle> | 드롭다운의 커스텀 스타일을 지정해요 |

*필수 속성

### DropdownItemProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| children* | - | React.ReactNode | 아이템에 표시될 콘텐츠를 지정해요 |
| onPress | - | () => void | 아이템을 클릭했을 때 호출되는 함수예요 |
| disabled | false | boolean | 아이템을 비활성화할지 여부를 지정해요 |
| style | - | StyleProp<ViewStyle> | 아이템의 커스텀 스타일을 지정해요 |

*필수 속성

## 관련 컴포넌트

- Radio: 여러 옵션 중 하나를 선택할 때 사용해요
- SegmentedControl: 탭 형태의 선택이 필요할 때 사용해요

---
*마지막 업데이트: 2025-11-28*

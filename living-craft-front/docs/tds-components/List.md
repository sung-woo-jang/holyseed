# List

List 컴포넌트는 여러 아이템을 세로로 나열하여 표시하는 컴포넌트예요. 아이템 사이에 구분선을 추가할 수 있어요.

## 사용 예제

### 기본 사용

List를 사용하려면 ListRow를 children으로 전달하세요.

```tsx
import { List, ListRow } from '@toss/tds-react-native';

<List>
  <ListRow contents={<ListRow.Texts texts={[{ text: '아이템 1' }]} />} />
  <ListRow contents={<ListRow.Texts texts={[{ text: '아이템 2' }]} />} />
  <ListRow contents={<ListRow.Texts texts={[{ text: '아이템 3' }]} />} />
</List>
```

### 구분선 스타일

rowSeparator 속성을 사용해 아이템 사이의 구분선 스타일을 지정할 수 있어요.

```tsx
{/* 들여쓰기된 구분선 (기본값) */}
<List rowSeparator="indented">
  <ListRow contents={<ListRow.Texts texts={[{ text: '아이템 1' }]} />} />
  <ListRow contents={<ListRow.Texts texts={[{ text: '아이템 2' }]} />} />
</List>

{/* 전체 너비 구분선 */}
<List rowSeparator="full">
  <ListRow contents={<ListRow.Texts texts={[{ text: '아이템 1' }]} />} />
  <ListRow contents={<ListRow.Texts texts={[{ text: '아이템 2' }]} />} />
</List>

{/* 구분선 없음 */}
<List rowSeparator="none">
  <ListRow contents={<ListRow.Texts texts={[{ text: '아이템 1' }]} />} />
  <ListRow contents={<ListRow.Texts texts={[{ text: '아이템 2' }]} />} />
</List>
```

### 설정 화면 패턴

화살표와 함께 설정 메뉴를 구현할 수 있어요.

```tsx
<List>
  <ListRow
    contents={<ListRow.Texts texts={[{ text: '계정 설정' }]} />}
    right={<ListRow.RightIcon name="chevron-right" />}
    onPress={() => navigate('/settings/account')}
  />
  <ListRow
    contents={<ListRow.Texts texts={[{ text: '알림 설정' }]} />}
    right={<ListRow.RightIcon name="chevron-right" />}
    onPress={() => navigate('/settings/notifications')}
  />
  <ListRow
    contents={<ListRow.Texts texts={[{ text: '보안 설정' }]} />}
    right={<ListRow.RightIcon name="chevron-right" />}
    onPress={() => navigate('/settings/security')}
  />
</List>
```

### 아이콘과 함께 사용

왼쪽에 아이콘을 추가할 수 있어요.

```tsx
<List>
  <ListRow
    left={<Asset.Icon name="heart" color="red" />}
    contents={<ListRow.Texts texts={[{ text: '좋아요' }]} />}
  />
  <ListRow
    left={<Asset.Icon name="star" color="yellow" />}
    contents={<ListRow.Texts texts={[{ text: '즐겨찾기' }]} />}
  />
  <ListRow
    left={<Asset.Icon name="bookmark" color="blue" />}
    contents={<ListRow.Texts texts={[{ text: '저장됨' }]} />}
  />
</List>
```

### Switch와 함께 사용

Switch를 오른쪽에 배치할 수 있어요.

```tsx
const [notifications, setNotifications] = useState(true);
const [darkMode, setDarkMode] = useState(false);

<List>
  <ListRow
    contents={<ListRow.Texts texts={[{ text: '알림 받기' }]} />}
    right={<Switch checked={notifications} onCheckedChange={setNotifications} />}
  />
  <ListRow
    contents={<ListRow.Texts texts={[{ text: '다크 모드' }]} />}
    right={<Switch checked={darkMode} onCheckedChange={setDarkMode} />}
  />
</List>
```

### 정보 표시

레이블과 값을 함께 표시할 수 있어요.

```tsx
<List>
  <ListRow
    contents={
      <ListRow.Texts
        texts={[
          { text: '이름', typography: 't6', color: colors.grey600 },
          { text: '홍길동', typography: 't5', color: colors.grey900 }
        ]}
      />
    }
  />
  <ListRow
    contents={
      <ListRow.Texts
        texts={[
          { text: '이메일', typography: 't6', color: colors.grey600 },
          { text: 'hong@example.com', typography: 't5', color: colors.grey900 }
        ]}
      />
    }
  />
  <ListRow
    contents={
      <ListRow.Texts
        texts={[
          { text: '전화번호', typography: 't6', color: colors.grey600 },
          { text: '010-1234-5678', typography: 't5', color: colors.grey900 }
        ]}
      />
    }
  />
</List>
```

## 인터페이스

### ListProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| children* | - | React.ReactNode | 리스트의 아이템들을 지정해요 |
| rowSeparator | 'indented' | "full" \| "indented" \| "none" | 아이템 사이 구분선 스타일을 지정해요 |
| style | - | StyleProp<ViewStyle> | 리스트의 커스텀 스타일을 지정해요 |

*필수 속성

## 관련 컴포넌트

- ListRow: List의 개별 아이템을 표시해요
- ListHeader: 리스트 섹션의 헤더를 표시해요
- ListFooter: 리스트 섹션의 푸터를 표시해요

---
*마지막 업데이트: 2025-11-28*

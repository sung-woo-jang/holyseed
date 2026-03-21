# ListHeader

ListHeader 컴포넌트는 리스트 섹션의 헤더를 표시하는 컴포넌트예요. 섹션을 구분하고 제목을 표시할 때 사용해요.

## 사용 예제

### 기본 사용

ListHeader를 사용하려면 children으로 텍스트를 전달하세요.

```tsx
import { ListHeader } from '@toss/tds-react-native';

<ListHeader>기본 정보</ListHeader>
```

### List와 함께 사용

List의 섹션을 구분할 때 사용해요.

```tsx
<View>
  <ListHeader>계정 정보</ListHeader>
  <List>
    <ListRow contents={<ListRow.Texts texts={[{ text: '이름', value: '홍길동' }]} />} />
    <ListRow contents={<ListRow.Texts texts={[{ text: '이메일', value: 'hong@example.com' }]} />} />
  </List>

  <ListHeader>설정</ListHeader>
  <List>
    <ListRow
      contents={<ListRow.Texts texts={[{ text: '알림 설정' }]} />}
      right={<ListRow.RightIcon name="chevron-right" />}
      onPress={() => {}}
    />
    <ListRow
      contents={<ListRow.Texts texts={[{ text: '보안 설정' }]} />}
      right={<ListRow.RightIcon name="chevron-right" />}
      onPress={() => {}}
    />
  </List>
</View>
```

### 여러 섹션 구분

여러 섹션을 구분할 때 유용해요.

```tsx
<View>
  <ListHeader>최근 활동</ListHeader>
  <List>
    <ListRow contents={<ListRow.Texts texts={[{ text: '송금' }]} />} />
    <ListRow contents={<ListRow.Texts texts={[{ text: '결제' }]} />} />
  </List>

  <ListHeader>자주 쓰는 메뉴</ListHeader>
  <List>
    <ListRow contents={<ListRow.Texts texts={[{ text: '송금' }]} />} />
    <ListRow contents={<ListRow.Texts texts={[{ text: '카드' }]} />} />
  </List>

  <ListHeader>설정</ListHeader>
  <List>
    <ListRow contents={<ListRow.Texts texts={[{ text: '프로필' }]} />} />
    <ListRow contents={<ListRow.Texts texts={[{ text: '알림' }]} />} />
  </List>
</View>
```

### 오른쪽 액션

오른쪽에 액션 버튼을 추가할 수 있어요.

```tsx
<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 }}>
  <ListHeader>친구 목록</ListHeader>
  <TextButton onPress={() => navigate('/friends/add')}>
    추가
  </TextButton>
</View>
```

### 설명 추가

subtitle을 사용해 헤더에 설명을 추가할 수 있어요.

```tsx
<ListHeader subtitle="계정과 관련된 정보를 확인하세요">
  계정 정보
</ListHeader>
```

## 인터페이스

### ListHeaderProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| children* | - | React.ReactNode | 헤더에 표시될 제목을 지정해요 |
| subtitle | - | string | 헤더 아래에 표시될 부가 설명을 지정해요 |
| style | - | StyleProp<ViewStyle> | 헤더의 커스텀 스타일을 지정해요 |

*필수 속성

## 관련 컴포넌트

- List: 리스트 아이템을 표시해요
- ListFooter: 리스트 섹션의 푸터를 표시해요

---
*마지막 업데이트: 2025-11-28*

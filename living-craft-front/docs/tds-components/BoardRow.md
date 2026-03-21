# BoardRow

BoardRow 컴포넌트는 게시판 형태의 아이템을 표시하는 컴포넌트예요. 제목, 내용, 작성자, 날짜 등을 포함한 카드 형태로 표시해요.

## 사용 예제

### 기본 사용

BoardRow를 사용하려면 제목과 내용을 지정하세요.

```tsx
import { BoardRow } from '@toss/tds-react-native';

<BoardRow
  title="게시글 제목"
  description="게시글 내용의 미리보기 텍스트예요"
/>
```

### 작성자 정보

author 속성을 사용해 작성자 정보를 표시할 수 있어요.

```tsx
<BoardRow
  title="공지사항"
  description="중요한 공지사항입니다"
  author="관리자"
  date="2025-11-28"
/>
```

### 썸네일 이미지

thumbnail 속성을 사용해 썸네일 이미지를 추가할 수 있어요.

```tsx
<BoardRow
  title="이미지가 있는 게시글"
  description="썸네일 이미지와 함께 표시되는 게시글이에요"
  thumbnail={{ uri: 'https://example.com/image.jpg' }}
  author="홍길동"
  date="2025-11-28"
/>
```

### 클릭 이벤트

onPress를 사용해 게시글 상세 페이지로 이동할 수 있어요.

```tsx
<BoardRow
  title="클릭 가능한 게시글"
  description="클릭하면 상세 페이지로 이동해요"
  author="작성자"
  date="2025-11-28"
  onPress={() => navigate('/board/123')}
/>
```

### 게시판 목록

여러 BoardRow를 함께 사용해 게시판을 구성할 수 있어요.

```tsx
const posts = [
  { id: 1, title: '첫 번째 게시글', content: '내용 1', author: '홍길동', date: '2025-11-28' },
  { id: 2, title: '두 번째 게시글', content: '내용 2', author: '김철수', date: '2025-11-27' },
  { id: 3, title: '세 번째 게시글', content: '내용 3', author: '이영희', date: '2025-11-26' },
];

<View>
  {posts.map(post => (
    <BoardRow
      key={post.id}
      title={post.title}
      description={post.content}
      author={post.author}
      date={post.date}
      onPress={() => navigate(`/board/${post.id}`)}
    />
  ))}
</View>
```

### 배지와 함께

Badge를 추가해 게시글 상태를 표시할 수 있어요.

```tsx
<BoardRow
  title="새 공지사항"
  description="중요한 내용이 포함되어 있어요"
  author="관리자"
  date="2025-11-28"
  badge={<Badge type="red" size="small">NEW</Badge>}
/>
```

### 조회수/댓글 수 표시

통계 정보를 표시할 수 있어요.

```tsx
<BoardRow
  title="인기 게시글"
  description="많은 사람들이 관심을 가진 게시글이에요"
  author="홍길동"
  date="2025-11-28"
  stats={{
    views: 1234,
    comments: 56,
    likes: 78
  }}
  onPress={() => {}}
/>
```

## 인터페이스

### BoardRowProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| title* | - | string | 게시글 제목을 지정해요 |
| description | - | string | 게시글 내용 미리보기를 지정해요 |
| author | - | string | 작성자 이름을 지정해요 |
| date | - | string | 작성 날짜를 지정해요 |
| thumbnail | - | ImageSourcePropType | 썸네일 이미지를 지정해요 |
| badge | - | React.ReactNode | 게시글 상태를 나타내는 배지를 지정해요 |
| stats | - | {views?: number, comments?: number, likes?: number} | 조회수, 댓글 수, 좋아요 수를 지정해요 |
| onPress | - | () => void | 게시글을 클릭했을 때 호출되는 함수예요 |
| style | - | StyleProp<ViewStyle> | 컴포넌트의 커스텀 스타일을 지정해요 |

*필수 속성

## 관련 컴포넌트

- ListRow: 간단한 리스트 아이템을 표시해요
- Card: 카드 형태의 컨테이너가 필요할 때 사용해요

---
*마지막 업데이트: 2025-11-28*

# Post

Post 컴포넌트는 게시글이나 피드 아이템을 표시하는 컴포넌트예요. 작성자, 내용, 이미지, 좋아요 등의 정보를 포함한 소셜 미디어 형식의 콘텐츠를 보여줘요.

## 사용 예제

### 기본 사용

Post를 사용하려면 author, content를 지정하세요.

```tsx
import { Post } from '@toss/tds-react-native';

<Post
  author={{
    name: '홍길동',
    avatar: 'https://example.com/avatar.jpg'
  }}
  content="게시글 내용이 여기에 표시돼요"
  timestamp="1시간 전"
/>
```

### 이미지 포함

images 속성을 사용해 게시글에 이미지를 추가할 수 있어요.

```tsx
<Post
  author={{
    name: '김철수',
    avatar: 'https://example.com/avatar2.jpg'
  }}
  content="멋진 풍경을 공유해요"
  images={[
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg'
  ]}
  timestamp="2시간 전"
/>
```

### 좋아요 및 댓글

likes, comments 속성을 사용해 상호작용 정보를 표시할 수 있어요.

```tsx
<Post
  author={{
    name: '이영희',
    avatar: 'https://example.com/avatar3.jpg'
  }}
  content="오늘의 일상을 공유합니다"
  timestamp="3시간 전"
  likes={42}
  comments={8}
  onLike={() => handleLike()}
  onComment={() => handleComment()}
/>
```

### 액션 메뉴

actions 속성을 사용해 게시글 메뉴를 추가할 수 있어요.

```tsx
<Post
  author={{
    name: '박민수',
    avatar: 'https://example.com/avatar4.jpg'
  }}
  content="공지사항입니다"
  timestamp="5시간 전"
  actions={
    <Dropdown>
      <Dropdown.Item onPress={handleEdit}>수정</Dropdown.Item>
      <Dropdown.Item onPress={handleDelete}>삭제</Dropdown.Item>
      <Dropdown.Item onPress={handleReport}>신고</Dropdown.Item>
    </Dropdown>
  }
/>
```

### 태그 포함

tags 속성을 사용해 해시태그를 추가할 수 있어요.

```tsx
<Post
  author={{
    name: '최지은',
    avatar: 'https://example.com/avatar5.jpg'
  }}
  content="새로운 프로젝트를 시작했어요"
  tags={['#개발', '#프로젝트', '#시작']}
  timestamp="1일 전"
/>
```

### 링크 미리보기

linkPreview 속성을 사용해 링크 카드를 표시할 수 있어요.

```tsx
<Post
  author={{
    name: '정우진',
    avatar: 'https://example.com/avatar6.jpg'
  }}
  content="유용한 글을 공유해요"
  timestamp="2일 전"
  linkPreview={{
    url: 'https://example.com/article',
    title: '글 제목',
    description: '글에 대한 간단한 설명',
    image: 'https://example.com/preview.jpg'
  }}
/>
```

### 공유 기능

onShare 속성을 사용해 공유 버튼을 추가할 수 있어요.

```tsx
<Post
  author={{
    name: '강서연',
    avatar: 'https://example.com/avatar7.jpg'
  }}
  content="이 내용을 공유하고 싶어요"
  timestamp="3일 전"
  likes={156}
  comments={23}
  onLike={() => {}}
  onComment={() => {}}
  onShare={() => handleShare()}
/>
```

### 여러 게시글 목록

여러 Post를 함께 표시할 수 있어요.

```tsx
const posts = [
  {
    id: 1,
    author: { name: '홍길동', avatar: 'url1' },
    content: '첫 번째 게시글',
    timestamp: '1시간 전',
    likes: 10
  },
  {
    id: 2,
    author: { name: '김철수', avatar: 'url2' },
    content: '두 번째 게시글',
    timestamp: '2시간 전',
    likes: 25
  }
];

<ScrollView>
  {posts.map(post => (
    <Post
      key={post.id}
      author={post.author}
      content={post.content}
      timestamp={post.timestamp}
      likes={post.likes}
      onLike={() => handleLike(post.id)}
    />
  ))}
</ScrollView>
```

### 댓글 미리보기

commentPreview를 사용해 최근 댓글을 미리 볼 수 있어요.

```tsx
<Post
  author={{
    name: '윤성호',
    avatar: 'https://example.com/avatar8.jpg'
  }}
  content="댓글 달아주세요"
  timestamp="4시간 전"
  likes={30}
  comments={5}
  commentPreview={[
    { author: '댓글작성자1', content: '좋은 글이에요!' },
    { author: '댓글작성자2', content: '도움이 됐어요' }
  ]}
  onComment={() => {}}
/>
```

## 인터페이스

### PostProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| author* | - | {name: string, avatar?: string} | 작성자 정보를 지정해요 |
| content* | - | string | 게시글 내용을 지정해요 |
| timestamp* | - | string | 작성 시간을 지정해요 |
| images | - | string[] | 게시글 이미지 URL 배열을 지정해요 |
| likes | 0 | number | 좋아요 개수를 지정해요 |
| comments | 0 | number | 댓글 개수를 지정해요 |
| tags | - | string[] | 해시태그 배열을 지정해요 |
| linkPreview | - | {url: string, title: string, description?: string, image?: string} | 링크 미리보기 정보를 지정해요 |
| commentPreview | - | Array<{author: string, content: string}> | 댓글 미리보기를 지정해요 |
| actions | - | React.ReactNode | 액션 메뉴를 지정해요 |
| onLike | - | () => void | 좋아요 버튼을 클릭했을 때 호출되는 함수예요 |
| onComment | - | () => void | 댓글 버튼을 클릭했을 때 호출되는 함수예요 |
| onShare | - | () => void | 공유 버튼을 클릭했을 때 호출되는 함수예요 |
| style | - | StyleProp<ViewStyle> | 컴포넌트의 커스텀 스타일을 지정해요 |

*필수 속성

## 관련 컴포넌트

- BoardRow: 게시판 형태의 아이템을 표시해요
- ListRow: 간단한 리스트 아이템을 표시해요

---
*마지막 업데이트: 2025-11-28*

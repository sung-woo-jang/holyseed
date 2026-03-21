# Loader

Loader 컴포넌트는 데이터를 불러오거나 처리하는 동안 로딩 상태를 시각적으로 표시하는 컴포넌트예요. 애니메이션으로 진행 중인 작업을 나타내고 사용자의 인내심을 유도해요.

## 사용 예제

### 기본 사용

Loader를 기본 설정으로 사용할 수 있어요.

```tsx
import { Loader } from '@toss/tds-react-native';

<Loader />
```

### 크기 설정

size 속성을 사용해 로더의 크기를 지정할 수 있어요.

```tsx
<Loader size="small" />
<Loader size="medium" />
<Loader size="large" />
```

### 색상 타입

type 속성을 사용해 배경에 맞는 색상을 선택할 수 있어요.

```tsx
<Loader type="primary" />
<Loader type="dark" />
<Loader type="light" />
```

### 레이블 추가

label 속성을 사용해 로딩 메시지를 표시할 수 있어요.

```tsx
<Loader label="불러오는 중..." />
<Loader label="처리 중입니다" size="medium" />
```

### 지연 표시

delay 속성을 사용해 로더 표시를 지연시킬 수 있어요. 빠른 응답에는 로더를 보여주지 않아요.

```tsx
<Loader delay={700} />
```

### 전체 화면 로더

Loader.FullScreen을 사용해 전체 화면 로더를 표시할 수 있어요.

```tsx
<Loader.FullScreen />

<Loader.FullScreen label="데이터를 불러오는 중..." />
```

### 중앙 정렬 로더

Loader.Centered를 사용해 컨테이너 중앙에 로더를 배치할 수 있어요.

```tsx
<Loader.Centered />

<Loader.Centered size="large" label="잠시만 기다려주세요" />
```

### 커스텀 색상

customStrokeColor를 사용해 커스텀 색상을 지정할 수 있어요.

```tsx
import { colors } from '@toss/tds-react-native';

<Loader customStrokeColor={colors.blue500} />
```

### 커스텀 크기

customSize를 사용해 픽셀 단위로 정확한 크기를 지정할 수 있어요.

```tsx
<Loader customSize={60} />
```

### 데이터 로딩 시나리오

실제 데이터 로딩 시나리오에서 사용할 수 있어요.

```tsx
const [loading, setLoading] = useState(true);
const [data, setData] = useState([]);

useEffect(() => {
  fetchData().then(result => {
    setData(result);
    setLoading(false);
  });
}, []);

if (loading) {
  return <Loader.Centered label="데이터를 불러오는 중..." />;
}

return (
  <List>
    {data.map(item => (
      <ListRow key={item.id} {...item} />
    ))}
  </List>
);
```

### 버튼 로딩 상태

Button의 loading 상태와 함께 사용할 수 있어요.

```tsx
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async () => {
  setSubmitting(true);
  await submitForm();
  setSubmitting(false);
};

<Button loading={submitting} onPress={handleSubmit}>
  제출하기
</Button>
```

## 인터페이스

### LoaderProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| size | 'large' | "small" \| "medium" \| "large" | 로더의 크기를 지정해요 |
| type | 'primary' | "primary" \| "dark" \| "light" | 배경에 맞는 색상을 지정해요 |
| label | - | string | 로딩 메시지를 지정해요 |
| delay | - | number | 로더 표시를 지연할 시간을 밀리초 단위로 지정해요 |
| customStrokeColor | - | string | 커스텀 색상을 직접 지정해요 |
| customSize | - | number | 커스텀 크기를 픽셀 단위로 지정해요 |
| style | - | StyleProp<ViewStyle> | 로더의 커스텀 스타일을 지정해요 |

## 관련 컴포넌트

- Skeleton: 콘텐츠 로딩 플레이스홀더를 표시해요
- ProgressBar: 진행률을 표시해요

---
*마지막 업데이트: 2025-11-28*

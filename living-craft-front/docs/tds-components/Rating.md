# Rating

Rating 컴포넌트는 별점 평가를 표시하거나 입력받는 컴포넌트예요. 사용자 리뷰, 평점, 만족도 조사 등에 사용해요.

## 사용 예제

### 기본 사용

Rating을 사용하려면 value를 지정하세요.

```tsx
import { Rating } from '@toss/tds-react-native';

<Rating value={3.5} />
```

### 읽기 전용

readonly 속성을 사용해 평점을 표시만 할 수 있어요.

```tsx
<Rating value={4.5} readonly />
```

### 상호작용 가능

onChange를 사용해 사용자가 별점을 입력할 수 있어요.

```tsx
const [rating, setRating] = useState(0);

<Rating value={rating} onChange={setRating} />
```

### 별 개수 설정

count 속성을 사용해 별의 개수를 지정할 수 있어요.

```tsx
<Rating value={7} count={10} onChange={setRating} />
```

### 크기 조정

size 속성을 사용해 별의 크기를 조절할 수 있어요.

```tsx
<Rating value={4} size="small" />
<Rating value={4} size="medium" />
<Rating value={4} size="large" />
```

### 색상 커스터마이즈

color 속성을 사용해 별의 색상을 변경할 수 있어요.

```tsx
import { colors } from '@toss/tds-react-native';

<Rating value={4} color={colors.orange500} />
<Rating value={4} color={colors.red500} />
```

### 평점과 함께 표시

평점 숫자를 함께 표시할 수 있어요.

```tsx
const [rating, setRating] = useState(4.2);

<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
  <Rating value={rating} readonly />
  <Txt typography="h5" fontWeight="bold">{rating.toFixed(1)}</Txt>
  <Txt typography="t6" color={colors.grey600}>(128)</Txt>
</View>
```

### 리뷰 작성

리뷰 작성 폼에서 사용할 수 있어요.

```tsx
const [rating, setRating] = useState(0);
const [review, setReview] = useState('');

<View style={{ gap: 16 }}>
  <View>
    <Txt typography="h5" style={{ marginBottom: 8 }}>별점을 선택하세요</Txt>
    <Rating value={rating} onChange={setRating} size="large" />
  </View>

  <View>
    <Txt typography="h5" style={{ marginBottom: 8 }}>리뷰 작성</Txt>
    <TextField
      value={review}
      onChange={setReview}
      placeholder="리뷰를 작성해주세요"
      multiline
      numberOfLines={4}
    />
  </View>

  <Button
    onPress={handleSubmit}
    disabled={rating === 0 || review === ''}
  >
    등록하기
  </Button>
</View>
```

### 상품 평점

상품 카드에서 평점을 표시할 수 있어요.

```tsx
<Card>
  <Image source={{ uri: productImage }} style={{ width: '100%', height: 200, borderRadius: 8 }} />

  <View style={{ marginTop: 12 }}>
    <Txt typography="h5">상품명</Txt>

    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
      <Rating value={4.5} readonly size="small" />
      <Txt typography="t6" color={colors.grey600}>4.5 (234)</Txt>
    </View>

    <Txt typography="h4" fontWeight="bold" style={{ marginTop: 8 }}>
      29,900원
    </Txt>
  </View>
</Card>
```

### 만족도 조사

만족도 조사에서 사용할 수 있어요.

```tsx
const [satisfaction, setSatisfaction] = useState(0);

const labels = ['매우 불만', '불만', '보통', '만족', '매우 만족'];

<View>
  <Txt typography="h5" style={{ marginBottom: 12 }}>서비스에 만족하셨나요?</Txt>

  <View style={{ alignItems: 'center', gap: 12 }}>
    <Rating value={satisfaction} onChange={setSatisfaction} size="large" />

    {satisfaction > 0 && (
      <Txt typography="t5" color={colors.blue500}>
        {labels[satisfaction - 1]}
      </Txt>
    )}
  </View>
</View>
```

### 반별 단위

allowHalf를 사용해 0.5 단위로 평가할 수 있어요.

```tsx
<Rating value={3.5} onChange={setRating} allowHalf />
```

### 평점 분포

여러 평점을 함께 표시할 수 있어요.

```tsx
const ratings = [
  { stars: 5, count: 50, percentage: 0.5 },
  { stars: 4, count: 30, percentage: 0.3 },
  { stars: 3, count: 15, percentage: 0.15 },
  { stars: 2, count: 3, percentage: 0.03 },
  { stars: 1, count: 2, percentage: 0.02 },
];

<View>
  {ratings.map((item) => (
    <View key={item.stars} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <Rating value={item.stars} readonly size="small" />
      <ProgressBar progress={item.percentage} style={{ flex: 1 }} />
      <Txt typography="t6" color={colors.grey600} style={{ width: 40, textAlign: 'right' }}>
        {item.count}
      </Txt>
    </View>
  ))}
</View>
```

## 인터페이스

### RatingProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| value* | - | number | 현재 별점 값을 지정해요 |
| count | 5 | number | 별의 개수를 지정해요 |
| onChange | - | (value: number) => void | 별점이 변경될 때 호출되는 함수예요 |
| readonly | false | boolean | 읽기 전용으로 설정할지 여부를 지정해요 |
| allowHalf | false | boolean | 0.5 단위 평가를 허용할지 여부를 지정해요 |
| size | 'medium' | "small" \| "medium" \| "large" | 별의 크기를 지정해요 |
| color | colors.yellow500 | string | 별의 색상을 지정해요 |
| emptyColor | colors.grey300 | string | 빈 별의 색상을 지정해요 |
| style | - | StyleProp<ViewStyle> | 컴포넌트의 커스텀 스타일을 지정해요 |

*필수 속성

## 관련 컴포넌트

- Slider: 연속적인 값을 선택할 때 사용해요

---
*마지막 업데이트: 2025-11-28*

# Skeleton

Skeleton 컴포넌트는 콘텐츠가 로딩되는 동안 임시 플레이스홀더를 표시하는 컴포넌트예요. 실제 콘텐츠와 유사한 레이아웃을 보여줘서 사용자 경험을 개선해요.

## 사용 예제

### 기본 사용

Skeleton을 사용하려면 width와 height를 지정하세요.

```tsx
import { Skeleton } from '@toss/tds-react-native';

<Skeleton width={200} height={20} />
```

### 전체 너비

width에 "100%"를 사용할 수 있어요.

```tsx
<Skeleton width="100%" height={40} />
```

### 텍스트 라인

borderRadius를 조정해 텍스트 라인 모양을 만들 수 있어요.

```tsx
<View style={{ gap: 8 }}>
  <Skeleton width="100%" height={20} borderRadius={4} />
  <Skeleton width="80%" height={20} borderRadius={4} />
  <Skeleton width="90%" height={20} borderRadius={4} />
</View>
```

### 이미지 플레이스홀더

큰 borderRadius로 이미지 형태를 만들 수 있어요.

```tsx
<Skeleton width={200} height={200} borderRadius={8} />
```

### 원형 플레이스홀더

프로필 이미지 등 원형 플레이스홀더를 만들 수 있어요.

```tsx
<Skeleton width={48} height={48} borderRadius={24} />
```

### 리스트 아이템 Skeleton

ListRow 형태의 Skeleton을 만들 수 있어요.

```tsx
<View style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
  {/* 아바타 */}
  <Skeleton width={48} height={48} borderRadius={24} />

  {/* 텍스트 영역 */}
  <View style={{ flex: 1, gap: 8 }}>
    <Skeleton width="70%" height={18} borderRadius={4} />
    <Skeleton width="50%" height={14} borderRadius={4} />
  </View>
</View>
```

### 카드 Skeleton

카드 형태의 Skeleton을 만들 수 있어요.

```tsx
<View style={{ padding: 16, gap: 12 }}>
  {/* 이미지 */}
  <Skeleton width="100%" height={200} borderRadius={12} />

  {/* 제목 */}
  <Skeleton width="80%" height={24} borderRadius={4} />

  {/* 설명 */}
  <View style={{ gap: 6 }}>
    <Skeleton width="100%" height={16} borderRadius={4} />
    <Skeleton width="60%" height={16} borderRadius={4} />
  </View>

  {/* 버튼 */}
  <Skeleton width={120} height={40} borderRadius={8} />
</View>
```

### 그리드 Skeleton

그리드 레이아웃의 Skeleton을 만들 수 있어요.

```tsx
<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, padding: 16 }}>
  {Array.from({ length: 6 }).map((_, index) => (
    <View key={index} style={{ width: '48%' }}>
      <Skeleton width="100%" height={150} borderRadius={12} />
      <Skeleton width="80%" height={18} borderRadius={4} style={{ marginTop: 8 }} />
      <Skeleton width="60%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
    </View>
  ))}
</View>
```

### 로딩 상태 전환

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
  return (
    <View style={{ gap: 16, padding: 16 }}>
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={{ flexDirection: 'row', gap: 12 }}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="70%" height={18} borderRadius={4} />
            <Skeleton width="50%" height={14} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

return (
  <List>
    {data.map(item => (
      <ListRow key={item.id} {...item} />
    ))}
  </List>
);
```

### 프로필 페이지 Skeleton

프로필 페이지의 Skeleton을 만들 수 있어요.

```tsx
<View style={{ padding: 20, gap: 20 }}>
  {/* 헤더 */}
  <View style={{ alignItems: 'center', gap: 12 }}>
    <Skeleton width={80} height={80} borderRadius={40} />
    <Skeleton width={120} height={24} borderRadius={4} />
    <Skeleton width={200} height={16} borderRadius={4} />
  </View>

  {/* 정보 섹션 */}
  <View style={{ gap: 12 }}>
    <Skeleton width="100%" height={60} borderRadius={8} />
    <Skeleton width="100%" height={60} borderRadius={8} />
    <Skeleton width="100%" height={60} borderRadius={8} />
  </View>
</View>
```

## 인터페이스

### SkeletonProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| width* | - | number \| string | Skeleton의 너비를 지정해요 |
| height* | - | number \| string | Skeleton의 높이를 지정해요 |
| borderRadius | 6 | number | Skeleton의 테두리 둥글기를 지정해요 |
| style | - | StyleProp<ViewStyle> | Skeleton의 커스텀 스타일을 지정해요 |

*필수 속성

## 관련 컴포넌트

- Loader: 로딩 스피너가 필요할 때 사용해요
- ProgressBar: 진행률 표시가 필요할 때 사용해요

---
*마지막 업데이트: 2025-11-28*

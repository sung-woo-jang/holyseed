# GridList

GridList 컴포넌트는 아이템을 그리드 형태로 배치하여 표시하는 컴포넌트예요. 갤러리, 상품 목록 등에 유용해요.

## 사용 예제

### 기본 사용

GridList를 사용하려면 데이터 배열과 렌더 함수를 지정하세요.

```tsx
import { GridList } from '@toss/tds-react-native';

const items = [
  { id: '1', title: '아이템 1' },
  { id: '2', title: '아이템 2' },
  { id: '3', title: '아이템 3' },
  { id: '4', title: '아이템 4' },
];

<GridList
  data={items}
  numColumns={2}
  renderItem={({ item }) => (
    <Card>
      <Txt>{item.title}</Txt>
    </Card>
  )}
/>
```

### 2열 그리드

가장 일반적인 2열 레이아웃이에요.

```tsx
const products = [
  { id: '1', name: '상품 1', image: 'url1' },
  { id: '2', name: '상품 2', image: 'url2' },
  { id: '3', name: '상품 3', image: 'url3' },
  { id: '4', name: '상품 4', image: 'url4' },
];

<GridList
  data={products}
  numColumns={2}
  gap={16}
  renderItem={({ item }) => (
    <Card>
      <Image source={{ uri: item.image }} style={{ width: '100%', height: 150 }} />
      <Txt typography="h5" style={{ marginTop: 8 }}>
        {item.name}
      </Txt>
    </Card>
  )}
/>
```

### 3열 그리드

작은 아이템이나 썸네일을 표시할 때 3열을 사용할 수 있어요.

```tsx
const photos = [
  { id: '1', url: 'photo1.jpg' },
  { id: '2', url: 'photo2.jpg' },
  { id: '3', url: 'photo3.jpg' },
  { id: '4', url: 'photo4.jpg' },
  { id: '5', url: 'photo5.jpg' },
  { id: '6', url: 'photo6.jpg' },
];

<GridList
  data={photos}
  numColumns={3}
  gap={8}
  renderItem={({ item }) => (
    <Image
      source={{ uri: item.url }}
      style={{ width: '100%', aspectRatio: 1, borderRadius: 8 }}
    />
  )}
/>
```

### 아이템 간격 조정

gap 속성을 사용해 아이템 사이의 간격을 조정할 수 있어요.

```tsx
<GridList
  data={items}
  numColumns={2}
  gap={20}
  renderItem={({ item }) => (
    <Card>{item.title}</Card>
  )}
/>
```

### 상품 목록

상품 정보를 그리드로 표시할 수 있어요.

```tsx
const products = [
  { id: '1', name: '상품명 1', price: 10000, image: 'url1' },
  { id: '2', name: '상품명 2', price: 20000, image: 'url2' },
];

<GridList
  data={products}
  numColumns={2}
  gap={16}
  renderItem={({ item }) => (
    <Pressable onPress={() => navigate(`/product/${item.id}`)}>
      <Card>
        <Image source={{ uri: item.image }} style={{ width: '100%', height: 150, borderRadius: 8 }} />
        <Txt typography="h5" style={{ marginTop: 8 }}>
          {item.name}
        </Txt>
        <Txt typography="t5" fontWeight="bold" style={{ marginTop: 4 }}>
          {item.price.toLocaleString()}원
        </Txt>
      </Card>
    </Pressable>
  )}
/>
```

### 카테고리 그리드

아이콘과 함께 카테고리를 표시할 수 있어요.

```tsx
const categories = [
  { id: '1', name: '송금', icon: 'transfer' },
  { id: '2', name: '결제', icon: 'payment' },
  { id: '3', name: '카드', icon: 'card' },
  { id: '4', name: '투자', icon: 'invest' },
];

<GridList
  data={categories}
  numColumns={4}
  gap={12}
  renderItem={({ item }) => (
    <Pressable
      onPress={() => handleCategory(item.id)}
      style={{ alignItems: 'center' }}
    >
      <Asset.Icon name={item.icon} size={40} />
      <Txt typography="t6" style={{ marginTop: 8 }}>
        {item.name}
      </Txt>
    </Pressable>
  )}
/>
```

### 빈 상태 처리

데이터가 없을 때 표시할 내용을 지정할 수 있어요.

```tsx
<GridList
  data={items}
  numColumns={2}
  gap={16}
  renderItem={({ item }) => <Card>{item.title}</Card>}
  ListEmptyComponent={
    <View style={{ padding: 40, alignItems: 'center' }}>
      <Txt typography="h5" color={colors.grey700}>
        표시할 아이템이 없어요
      </Txt>
    </View>
  }
/>
```

## 인터페이스

### GridListProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| data* | - | T[] | 표시할 데이터 배열을 지정해요 |
| renderItem* | - | (info: {item: T, index: number}) => React.ReactElement | 각 아이템을 렌더링하는 함수예요 |
| numColumns | 2 | number | 열의 개수를 지정해요 |
| gap | 16 | number | 아이템 사이의 간격을 픽셀 단위로 지정해요 |
| ListEmptyComponent | - | React.ReactElement | 데이터가 없을 때 표시할 컴포넌트예요 |
| ListHeaderComponent | - | React.ReactElement | 그리드 상단에 표시할 컴포넌트예요 |
| ListFooterComponent | - | React.ReactElement | 그리드 하단에 표시할 컴포넌트예요 |
| keyExtractor | - | (item: T, index: number) => string | 각 아이템의 고유 키를 생성하는 함수예요 |
| onEndReached | - | () => void | 스크롤이 끝에 도달했을 때 호출되는 함수예요 |
| style | - | StyleProp<ViewStyle> | 그리드의 커스텀 스타일을 지정해요 |

*필수 속성

---
*마지막 업데이트: 2025-11-28*

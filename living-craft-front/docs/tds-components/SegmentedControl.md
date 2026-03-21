# SegmentedControl

SegmentedControl 컴포넌트는 여러 옵션 중 하나를 선택할 수 있는 탭 형태의 UI 요소예요. 시각적으로 명확하게 구분되는 옵션들을 제공해요.

## 사용 예제

### 기본 사용

SegmentedControl을 사용하려면 options, selectedIndex, onChange를 지정하세요.

```tsx
import { SegmentedControl } from '@toss/tds-react-native';
import { useState } from 'react';

const [selectedIndex, setSelectedIndex] = useState(0);
const options = ['옵션 1', '옵션 2', '옵션 3'];

<SegmentedControl
  options={options}
  selectedIndex={selectedIndex}
  onChange={setSelectedIndex}
/>
```

### 두 개 옵션

두 개의 옵션으로 이진 선택을 구현할 수 있어요.

```tsx
const [selectedIndex, setSelectedIndex] = useState(0);

<SegmentedControl
  options={['일간', '월간']}
  selectedIndex={selectedIndex}
  onChange={setSelectedIndex}
/>
```

### 여러 개 옵션

세 개 이상의 옵션도 사용할 수 있어요.

```tsx
const [selectedIndex, setSelectedIndex] = useState(0);

<SegmentedControl
  options={['전체', '진행중', '완료', '취소']}
  selectedIndex={selectedIndex}
  onChange={setSelectedIndex}
/>
```

### 탭 컨텐츠 전환

SegmentedControl과 함께 컨텐츠를 전환할 수 있어요.

```tsx
const [selectedIndex, setSelectedIndex] = useState(0);
const tabs = ['뉴스', '인기', '팔로잉'];

<View>
  <SegmentedControl
    options={tabs}
    selectedIndex={selectedIndex}
    onChange={setSelectedIndex}
  />

  <View style={{ marginTop: 20 }}>
    {selectedIndex === 0 && <NewsContent />}
    {selectedIndex === 1 && <PopularContent />}
    {selectedIndex === 2 && <FollowingContent />}
  </View>
</View>
```

### 통계 기간 선택

통계나 차트의 기간을 선택할 때 유용해요.

```tsx
const [period, setPeriod] = useState(0);
const periods = ['1주일', '1개월', '3개월', '1년'];

<View>
  <SegmentedControl
    options={periods}
    selectedIndex={period}
    onChange={setPeriod}
  />

  <View style={{ marginTop: 20 }}>
    <Chart period={periods[period]} />
  </View>
</View>
```

### 필터 선택

목록 필터링에 사용할 수 있어요.

```tsx
const [filter, setFilter] = useState(0);
const filters = ['전체', '읽지 않음', '중요'];

const filteredItems = items.filter(item => {
  if (filter === 0) return true;
  if (filter === 1) return !item.isRead;
  if (filter === 2) return item.isImportant;
  return true;
});

<View>
  <SegmentedControl
    options={filters}
    selectedIndex={filter}
    onChange={setFilter}
  />

  <List>
    {filteredItems.map(item => (
      <ListRow key={item.id} {...item} />
    ))}
  </List>
</View>
```

### 전체 너비

fullWidth를 사용해 부모 컨테이너의 전체 너비를 차지하도록 할 수 있어요.

```tsx
<SegmentedControl
  options={['옵션 1', '옵션 2', '옵션 3']}
  selectedIndex={selectedIndex}
  onChange={setSelectedIndex}
  fullWidth
/>
```

## 인터페이스

### SegmentedControlProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| options* | - | string[] | 선택 가능한 옵션들의 배열을 지정해요 |
| selectedIndex* | - | number | 현재 선택된 옵션의 인덱스를 지정해요 |
| onChange* | - | (index: number) => void | 선택이 변경될 때 호출되는 함수예요 |
| fullWidth | false | boolean | 전체 너비를 차지할지 여부를 지정해요 |
| disabled | false | boolean | 컴포넌트를 비활성화할지 여부를 지정해요 |
| style | - | StyleProp<ViewStyle> | 컴포넌트의 커스텀 스타일을 지정해요 |

*필수 속성

## 관련 컴포넌트

- Radio: 라디오 버튼 형태의 선택이 필요할 때 사용해요
- Tab: 페이지 상단의 탭 네비게이션이 필요할 때 사용해요

---
*마지막 업데이트: 2025-11-28*

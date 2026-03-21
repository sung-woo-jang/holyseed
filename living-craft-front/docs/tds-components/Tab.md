# Tab

Tab 컴포넌트는 페이지 상단의 탭 네비게이션을 제공하는 컴포넌트예요. 여러 섹션을 전환하며 탐색할 때 사용해요.

## 사용 예제

### 기본 사용

Tab을 사용하려면 tabs, selectedIndex, onChange를 지정하세요.

```tsx
import { Tab } from '@toss/tds-react-native';
import { useState } from 'react';

const [selectedIndex, setSelectedIndex] = useState(0);
const tabs = ['홈', '검색', '알림', '프로필'];

<Tab
  tabs={tabs}
  selectedIndex={selectedIndex}
  onChange={setSelectedIndex}
/>
```

### 컨텐츠와 함께

탭과 연결된 컨텐츠를 표시할 수 있어요.

```tsx
const [selectedIndex, setSelectedIndex] = useState(0);
const tabs = ['전체', '진행중', '완료'];

<View>
  <Tab
    tabs={tabs}
    selectedIndex={selectedIndex}
    onChange={setSelectedIndex}
  />

  <View style={{ padding: 20 }}>
    {selectedIndex === 0 && <AllContent />}
    {selectedIndex === 1 && <InProgressContent />}
    {selectedIndex === 2 && <CompletedContent />}
  </View>
</View>
```

### 배지와 함께

탭에 배지를 추가할 수 있어요.

```tsx
<Tab
  tabs={[
    { label: '전체', badge: 5 },
    { label: '읽지 않음', badge: 3 },
    { label: '중요', badge: 1 },
  ]}
  selectedIndex={selectedIndex}
  onChange={setSelectedIndex}
/>
```

### 아이콘과 함께

아이콘을 포함한 탭을 만들 수 있어요.

```tsx
<Tab
  tabs={[
    { label: '홈', icon: 'home' },
    { label: '검색', icon: 'search' },
    { label: '프로필', icon: 'user' },
  ]}
  selectedIndex={selectedIndex}
  onChange={setSelectedIndex}
/>
```

### 스크롤 가능한 탭

많은 탭이 있을 때 스크롤 가능하게 만들 수 있어요.

```tsx
<Tab
  tabs={['전체', '뉴스', '스포츠', '연예', '경제', '정치', '사회', '문화', '과학', 'IT']}
  selectedIndex={selectedIndex}
  onChange={setSelectedIndex}
  scrollable
/>
```

### 하단 탭 네비게이션

화면 하단에 탭 네비게이션을 배치할 수 있어요.

```tsx
<View style={{ flex: 1 }}>
  <View style={{ flex: 1 }}>
    {/* 메인 콘텐츠 */}
    {selectedIndex === 0 && <HomeScreen />}
    {selectedIndex === 1 && <SearchScreen />}
    {selectedIndex === 2 && <NotificationScreen />}
    {selectedIndex === 3 && <ProfileScreen />}
  </View>

  <Tab
    tabs={[
      { label: '홈', icon: 'home' },
      { label: '검색', icon: 'search' },
      { label: '알림', icon: 'bell' },
      { label: '프로필', icon: 'user' },
    ]}
    selectedIndex={selectedIndex}
    onChange={setSelectedIndex}
    position="bottom"
  />
</View>
```

### 고정 너비 탭

각 탭의 너비를 고정할 수 있어요.

```tsx
<Tab
  tabs={['탭 1', '탭 2', '탭 3']}
  selectedIndex={selectedIndex}
  onChange={setSelectedIndex}
  fixedWidth
/>
```

### 전체 너비

전체 너비에 맞춰 탭을 균등하게 배치할 수 있어요.

```tsx
<Tab
  tabs={['옵션 1', '옵션 2', '옵션 3']}
  selectedIndex={selectedIndex}
  onChange={setSelectedIndex}
  fullWidth
/>
```

### 커스텀 스타일

activeColor와 inactiveColor를 사용해 색상을 커스터마이즈할 수 있어요.

```tsx
import { colors } from '@toss/tds-react-native';

<Tab
  tabs={['탭 1', '탭 2', '탭 3']}
  selectedIndex={selectedIndex}
  onChange={setSelectedIndex}
  activeColor={colors.blue500}
  inactiveColor={colors.grey500}
/>
```

### 페이지 네비게이션

페이지 전환 네비게이션으로 사용할 수 있어요.

```tsx
const [selectedIndex, setSelectedIndex] = useState(0);
const sections = ['개요', '리뷰', '상세정보', 'Q&A'];

<View>
  <Tab
    tabs={sections}
    selectedIndex={selectedIndex}
    onChange={setSelectedIndex}
  />

  <ScrollView>
    {selectedIndex === 0 && <OverviewSection />}
    {selectedIndex === 1 && <ReviewSection />}
    {selectedIndex === 2 && <DetailSection />}
    {selectedIndex === 3 && <QnaSection />}
  </ScrollView>
</View>
```

## 인터페이스

### TabProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| tabs* | - | string[] \| TabItem[] | 탭 레이블 배열 또는 탭 아이템 배열을 지정해요 |
| selectedIndex* | - | number | 현재 선택된 탭의 인덱스를 지정해요 |
| onChange* | - | (index: number) => void | 탭이 변경될 때 호출되는 함수예요 |
| scrollable | false | boolean | 탭을 스크롤 가능하게 할지 여부를 지정해요 |
| fullWidth | false | boolean | 전체 너비에 맞춰 탭을 배치할지 여부를 지정해요 |
| fixedWidth | false | boolean | 각 탭의 너비를 고정할지 여부를 지정해요 |
| position | 'top' | "top" \| "bottom" | 탭의 위치를 지정해요 |
| activeColor | colors.blue500 | string | 선택된 탭의 색상을 지정해요 |
| inactiveColor | colors.grey600 | string | 선택되지 않은 탭의 색상을 지정해요 |
| style | - | StyleProp<ViewStyle> | 컴포넌트의 커스텀 스타일을 지정해요 |

*필수 속성

### TabItem

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| label* | - | string | 탭의 레이블을 지정해요 |
| icon | - | string | 탭의 아이콘을 지정해요 |
| badge | - | number | 탭에 표시할 배지 숫자를 지정해요 |

*필수 속성

## 관련 컴포넌트

- SegmentedControl: 세그먼트 형태의 선택이 필요할 때 사용해요
- Dropdown: 드롭다운 메뉴가 필요할 때 사용해요

---
*마지막 업데이트: 2025-11-28*

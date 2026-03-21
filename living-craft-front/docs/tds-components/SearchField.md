# SearchField

SearchField 컴포넌트는 검색 기능에 특화된 입력 필드예요. 검색 아이콘과 클리어 버튼이 기본으로 포함되어 있어요.

## 사용 예제

### 기본 사용

SearchField를 사용하려면 value와 onChange를 지정하세요.

```tsx
import { SearchField } from '@toss/tds-react-native';
import { useState } from 'react';

const [query, setQuery] = useState('');

<SearchField
  value={query}
  onChange={setQuery}
  placeholder="검색어를 입력하세요"
/>
```

### 검색 실행

onSearch를 사용해 검색 버튼 클릭이나 엔터 키 입력 시 검색을 실행할 수 있어요.

```tsx
const [query, setQuery] = useState('');

const handleSearch = (searchQuery: string) => {
  console.log('검색:', searchQuery);
  // 검색 API 호출
};

<SearchField
  value={query}
  onChange={setQuery}
  onSearch={handleSearch}
  placeholder="상품을 검색하세요"
/>
```

### 자동 완성 제안

검색어에 따라 자동 완성 제안을 표시할 수 있어요.

```tsx
const [query, setQuery] = useState('');
const [suggestions, setSuggestions] = useState<string[]>([]);

const handleChange = (value: string) => {
  setQuery(value);

  // 검색어에 따른 제안 생성
  if (value.length > 0) {
    const filtered = allItems.filter(item =>
      item.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 5);
    setSuggestions(filtered);
  } else {
    setSuggestions([]);
  }
};

<View>
  <SearchField
    value={query}
    onChange={handleChange}
    placeholder="검색어를 입력하세요"
  />

  {suggestions.length > 0 && (
    <View style={{ marginTop: 8 }}>
      {suggestions.map((suggestion, index) => (
        <Pressable
          key={index}
          onPress={() => {
            setQuery(suggestion);
            handleSearch(suggestion);
          }}
          style={{ padding: 12 }}
        >
          <Txt>{suggestion}</Txt>
        </Pressable>
      ))}
    </View>
  )}
</View>
```

### 최근 검색어

최근 검색어 목록을 표시할 수 있어요.

```tsx
const [query, setQuery] = useState('');
const [recentSearches, setRecentSearches] = useState(['토스', '송금', '카드']);

const handleSearch = (searchQuery: string) => {
  // 최근 검색어에 추가
  setRecentSearches(prev => [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0, 5));
  // 검색 실행
  performSearch(searchQuery);
};

<View>
  <SearchField
    value={query}
    onChange={setQuery}
    onSearch={handleSearch}
    placeholder="검색"
  />

  {query === '' && recentSearches.length > 0 && (
    <View style={{ marginTop: 16 }}>
      <Txt typography="t6" color={colors.grey600}>최근 검색어</Txt>
      <View style={{ marginTop: 8 }}>
        {recentSearches.map((search, index) => (
          <Pressable
            key={index}
            onPress={() => {
              setQuery(search);
              handleSearch(search);
            }}
            style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Txt>{search}</Txt>
            <IconButton
              icon="close"
              size="small"
              onPress={() => setRecentSearches(prev => prev.filter((_, i) => i !== index))}
            />
          </Pressable>
        ))}
      </View>
    </View>
  )}
</View>
```

### 클리어 버튼 숨기기

showClearButton을 false로 설정해 클리어 버튼을 숨길 수 있어요.

```tsx
<SearchField
  value={query}
  onChange={setQuery}
  showClearButton={false}
  placeholder="검색"
/>
```

### 자동 포커스

autoFocus를 사용해 컴포넌트가 렌더링될 때 자동으로 포커스를 맞출 수 있어요.

```tsx
<SearchField
  value={query}
  onChange={setQuery}
  autoFocus
  placeholder="검색"
/>
```

### 검색 결과 없음

검색 결과가 없을 때 안내 메시지를 표시할 수 있어요.

```tsx
const [query, setQuery] = useState('');
const [results, setResults] = useState([]);

<View>
  <SearchField
    value={query}
    onChange={setQuery}
    onSearch={handleSearch}
    placeholder="검색"
  />

  {query !== '' && results.length === 0 && (
    <View style={{ alignItems: 'center', padding: 40 }}>
      <Txt typography="h5" color={colors.grey700}>
        검색 결과가 없어요
      </Txt>
      <Txt typography="t6" color={colors.grey600} style={{ marginTop: 8 }}>
        다른 검색어를 입력해보세요
      </Txt>
    </View>
  )}
</View>
```

## 인터페이스

### SearchFieldProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| value* | - | string | 검색 필드의 현재 값을 지정해요 |
| onChange* | - | (value: string) => void | 값이 변경될 때 호출되는 함수예요 |
| onSearch | - | (value: string) => void | 검색을 실행할 때 호출되는 함수예요 |
| placeholder | '검색' | string | 입력 전에 표시될 안내 텍스트를 지정해요 |
| showClearButton | true | boolean | 클리어 버튼을 표시할지 여부를 지정해요 |
| autoFocus | false | boolean | 자동으로 포커스를 맞출지 여부를 지정해요 |
| disabled | false | boolean | 검색 필드를 비활성화할지 여부를 지정해요 |
| style | - | StyleProp<ViewStyle> | 컴포넌트의 커스텀 스타일을 지정해요 |

*필수 속성

## 관련 컴포넌트

- TextField: 일반 텍스트 입력이 필요할 때 사용해요

---
*마지막 업데이트: 2025-11-28*

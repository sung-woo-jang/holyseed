# Highlight

Highlight 컴포넌트는 텍스트나 요소를 강조하기 위한 하이라이트 효과를 제공하는 컴포넌트예요. 중요한 정보를 시각적으로 돋보이게 만들어요.

## 사용 예제

### 기본 사용

Highlight를 사용하려면 children을 전달하세요.

```tsx
import { Highlight } from '@toss/tds-react-native';

<Highlight>
  <Txt>강조된 텍스트예요</Txt>
</Highlight>
```

### 색상 설정

color 속성을 사용해 하이라이트 색상을 지정할 수 있어요.

```tsx
import { colors } from '@toss/tds-react-native';

<Highlight color={colors.yellow200}>
  <Txt>노란색 하이라이트</Txt>
</Highlight>

<Highlight color={colors.blue200}>
  <Txt>파란색 하이라이트</Txt>
</Highlight>

<Highlight color={colors.green200}>
  <Txt>초록색 하이라이트</Txt>
</Highlight>
```

### 텍스트 강조

문장 중 특정 단어를 강조할 수 있어요.

```tsx
<Txt typography="h5">
  이 부분은 <Highlight color={colors.yellow200}>중요한 내용</Highlight>이에요
</Txt>
```

### 검색 결과 하이라이트

검색어를 하이라이트할 수 있어요.

```tsx
const highlightSearchTerm = (text: string, searchTerm: string) => {
  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));

  return (
    <Txt>
      {parts.map((part, index) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <Highlight key={index} color={colors.yellow200}>
            <Txt>{part}</Txt>
          </Highlight>
        ) : (
          <Txt key={index}>{part}</Txt>
        )
      )}
    </Txt>
  );
};

{highlightSearchTerm('토스 송금 서비스', '송금')}
```

### 블록 하이라이트

전체 블록을 하이라이트할 수 있어요.

```tsx
<Highlight color={colors.blue100}>
  <View style={{ padding: 16 }}>
    <Txt typography="h5">공지사항</Txt>
    <Txt typography="t6" style={{ marginTop: 8 }}>
      중요한 공지사항 내용이 여기에 표시돼요
    </Txt>
  </View>
</Highlight>
```

### 강조 스타일 변형

intensity 속성을 사용해 강조 정도를 조절할 수 있어요.

```tsx
<Highlight intensity="light">
  <Txt>연한 하이라이트</Txt>
</Highlight>

<Highlight intensity="medium">
  <Txt>중간 하이라이트</Txt>
</Highlight>

<Highlight intensity="strong">
  <Txt>강한 하이라이트</Txt>
</Highlight>
```

### 둥근 모서리

borderRadius를 사용해 모서리를 둥글게 할 수 있어요.

```tsx
<Highlight color={colors.yellow200} borderRadius={8}>
  <Txt>둥근 하이라이트</Txt>
</Highlight>
```

### 리스트 아이템 강조

특정 리스트 아이템을 강조할 수 있어요.

```tsx
<List>
  <Highlight color={colors.blue100}>
    <ListRow
      contents={<ListRow.Texts texts={[{ text: '강조된 항목' }]} />}
    />
  </Highlight>
  <ListRow
    contents={<ListRow.Texts texts={[{ text: '일반 항목' }]} />}
  />
  <ListRow
    contents={<ListRow.Texts texts={[{ text: '일반 항목' }]} />}
  />
</List>
```

## 인터페이스

### HighlightProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| children* | - | React.ReactNode | 하이라이트할 콘텐츠를 지정해요 |
| color | colors.yellow200 | string | 하이라이트 배경 색상을 지정해요 |
| intensity | 'medium' | "light" \| "medium" \| "strong" | 하이라이트 강도를 지정해요 |
| borderRadius | 4 | number | 모서리 둥글기를 픽셀 단위로 지정해요 |
| style | - | StyleProp<ViewStyle> | 컴포넌트의 커스텀 스타일을 지정해요 |

*필수 속성

## 관련 컴포넌트

- Badge: 작은 레이블 형태의 강조가 필요할 때 사용해요

---
*마지막 업데이트: 2025-11-28*

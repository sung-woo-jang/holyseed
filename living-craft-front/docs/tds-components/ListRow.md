# ListRow

ListRow 컴포넌트는 List의 개별 아이템을 표시하는 컴포넌트예요. 왼쪽, 중앙, 오른쪽 영역으로 구성되어 다양한 레이아웃을 만들 수 있어요.

## 사용 예제

### 기본 사용

ListRow를 사용하려면 contents를 지정하세요.

```tsx
import { ListRow } from '@toss/tds-react-native';

<ListRow
  contents={<ListRow.Texts texts={[{ text: '아이템 제목' }]} />}
/>
```

### 제목과 설명

texts 배열을 사용해 제목과 설명을 함께 표시할 수 있어요.

```tsx
<ListRow
  contents={
    <ListRow.Texts
      texts={[
        { text: '아이템 제목' },
        { text: '아이템에 대한 설명이에요', typography: 't6', color: colors.grey600 }
      ]}
    />
  }
/>
```

### 왼쪽 아이콘

left 속성을 사용해 왼쪽에 아이콘이나 이미지를 추가할 수 있어요.

```tsx
<ListRow
  left={<Asset.Icon name="notification" />}
  contents={
    <ListRow.Texts
      texts={[
        { text: '새 알림' },
        { text: '알림 내용이 도착했어요' }
      ]}
    />
  }
/>
```

### 오른쪽 화살표

right 속성과 onPress를 사용해 클릭 가능한 항목을 만들 수 있어요.

```tsx
<ListRow
  contents={<ListRow.Texts texts={[{ text: '설정' }]} />}
  right={<ListRow.RightIcon name="chevron-right" />}
  onPress={() => navigate('/settings')}
/>
```

### 오른쪽 텍스트

오른쪽에 텍스트를 표시할 수 있어요.

```tsx
<ListRow
  contents={<ListRow.Texts texts={[{ text: '버전' }]} />}
  right={<Txt typography="t5" color={colors.grey600}>1.0.0</Txt>}
/>
```

### Switch와 함께

오른쪽에 Switch를 배치할 수 있어요.

```tsx
const [enabled, setEnabled] = useState(true);

<ListRow
  contents={<ListRow.Texts texts={[{ text: '알림 받기' }]} />}
  right={<Switch checked={enabled} onCheckedChange={setEnabled} />}
/>
```

### Badge와 함께

오른쪽에 Badge를 표시할 수 있어요.

```tsx
<ListRow
  contents={<ListRow.Texts texts={[{ text: '새 메시지' }]} />}
  right={<Badge type="red" size="small">5</Badge>}
  onPress={() => navigate('/messages')}
/>
```

### 프로필 이미지

왼쪽에 프로필 이미지를 표시할 수 있어요.

```tsx
<ListRow
  left={
    <Asset.Image
      source={{ uri: 'https://example.com/profile.jpg' }}
      frameShape={Asset.frameShape.CircleMedium}
    />
  }
  contents={
    <ListRow.Texts
      texts={[
        { text: '홍길동' },
        { text: 'hong@example.com', typography: 't6', color: colors.grey600 }
      ]}
    />
  }
  onPress={() => navigate('/profile')}
/>
```

### 여러 정보 표시

복잡한 정보를 표시할 수 있어요.

```tsx
<ListRow
  left={<Asset.Icon name="card" />}
  contents={
    <View>
      <Txt typography="t5">토스 체크카드</Txt>
      <Txt typography="t6" color={colors.grey600}>**** 1234</Txt>
    </View>
  }
  right={
    <View style={{ alignItems: 'flex-end' }}>
      <Txt typography="t5" fontWeight="bold">150,000원</Txt>
      <Txt typography="t7" color={colors.grey600}>한도 500,000원</Txt>
    </View>
  }
  onPress={() => navigate('/card/detail')}
/>
```

### 비활성화 상태

disabled 속성을 사용해 항목을 비활성화할 수 있어요.

```tsx
<ListRow
  contents={<ListRow.Texts texts={[{ text: '사용 불가' }]} />}
  disabled
/>
```

## 인터페이스

### ListRowProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| contents* | - | React.ReactNode | 중앙 영역에 표시될 콘텐츠를 지정해요 |
| left | - | React.ReactNode | 왼쪽 영역에 표시될 콘텐츠를 지정해요 |
| right | - | React.ReactNode | 오른쪽 영역에 표시될 콘텐츠를 지정해요 |
| onPress | - | () => void | 항목을 클릭했을 때 호출되는 함수예요 |
| disabled | false | boolean | 항목을 비활성화할지 여부를 지정해요 |
| style | - | StyleProp<ViewStyle> | 항목의 커스텀 스타일을 지정해요 |

*필수 속성

### ListRowTextsProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| texts* | - | Array<{text: string, typography?: string, color?: string}> | 표시할 텍스트 배열을 지정해요 |

*필수 속성

## 관련 컴포넌트

- List: 여러 ListRow를 묶어서 표시해요
- ListHeader: 리스트 섹션의 헤더를 표시해요

---
*마지막 업데이트: 2025-11-28*

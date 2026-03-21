# TableRow

TableRow 컴포넌트는 테이블 형태의 데이터를 행으로 표시하는 컴포넌트예요. 여러 열의 데이터를 정렬하여 표시할 때 사용해요.

## 사용 예제

### 기본 사용

TableRow를 사용하려면 cells 배열을 지정하세요.

```tsx
import { TableRow } from '@toss/tds-react-native';

<TableRow
  cells={[
    { content: '항목 1' },
    { content: '값 1' },
    { content: '100' },
  ]}
/>
```

### 테이블 헤더

TableRow.Header를 사용해 테이블 헤더를 만들 수 있어요.

```tsx
<View>
  <TableRow.Header
    cells={[
      { content: '이름' },
      { content: '금액' },
      { content: '날짜' },
    ]}
  />
  <TableRow
    cells={[
      { content: '송금' },
      { content: '10,000원' },
      { content: '2025-11-28' },
    ]}
  />
  <TableRow
    cells={[
      { content: '입금' },
      { content: '50,000원' },
      { content: '2025-11-27' },
    ]}
  />
</View>
```

### 열 너비 조정

각 셀의 flex나 width를 조정할 수 있어요.

```tsx
<TableRow
  cells={[
    { content: '긴 텍스트 내용', flex: 2 },
    { content: '짧음', flex: 1 },
    { content: '중간', flex: 1.5 },
  ]}
/>
```

### 정렬 설정

각 셀의 align 속성으로 텍스트 정렬을 지정할 수 있어요.

```tsx
<TableRow
  cells={[
    { content: '왼쪽', align: 'left' },
    { content: '가운데', align: 'center' },
    { content: '오른쪽', align: 'right' },
  ]}
/>
```

### 거래 내역 테이블

금융 거래 내역을 표시할 수 있어요.

```tsx
const transactions = [
  { name: '카페 결제', amount: -4500, date: '11/28 14:30' },
  { name: '급여 입금', amount: 3000000, date: '11/25 09:00' },
  { name: '편의점', amount: -12000, date: '11/24 18:20' },
];

<View>
  <TableRow.Header
    cells={[
      { content: '내역', flex: 2 },
      { content: '금액', flex: 1, align: 'right' },
      { content: '시간', flex: 1, align: 'right' },
    ]}
  />
  {transactions.map((tx, index) => (
    <TableRow
      key={index}
      cells={[
        { content: tx.name, flex: 2 },
        {
          content: `${tx.amount > 0 ? '+' : ''}${tx.amount.toLocaleString()}원`,
          flex: 1,
          align: 'right',
          color: tx.amount > 0 ? colors.blue500 : colors.red500,
        },
        { content: tx.date, flex: 1, align: 'right' },
      ]}
      onPress={() => navigate(`/transaction/${index}`)}
    />
  ))}
</View>
```

### 색상 적용

셀에 커스텀 색상을 적용할 수 있어요.

```tsx
<TableRow
  cells={[
    { content: '일반', color: colors.grey900 },
    { content: '경고', color: colors.yellow600 },
    { content: '위험', color: colors.red500 },
  ]}
/>
```

### 클릭 가능한 행

onPress를 사용해 행 전체를 클릭할 수 있게 만들 수 있어요.

```tsx
<TableRow
  cells={[
    { content: '클릭 가능한 행' },
    { content: '상세보기' },
  ]}
  onPress={() => navigate('/detail')}
/>
```

### 구분선 스타일

separator 속성으로 구분선을 표시할 수 있어요.

```tsx
<View>
  <TableRow
    cells={[{ content: '행 1' }, { content: '값 1' }]}
    separator
  />
  <TableRow
    cells={[{ content: '행 2' }, { content: '값 2' }]}
    separator
  />
  <TableRow
    cells={[{ content: '행 3' }, { content: '값 3' }]}
  />
</View>
```

## 인터페이스

### TableRowProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| cells* | - | TableCell[] | 행에 표시할 셀들의 배열을 지정해요 |
| onPress | - | () => void | 행을 클릭했을 때 호출되는 함수예요 |
| separator | false | boolean | 행 하단에 구분선을 표시할지 여부를 지정해요 |
| style | - | StyleProp<ViewStyle> | 행의 커스텀 스타일을 지정해요 |

*필수 속성

### TableCell

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| content* | - | string \| React.ReactNode | 셀에 표시할 콘텐츠를 지정해요 |
| flex | 1 | number | 셀의 flex 비율을 지정해요 |
| width | - | number | 셀의 고정 너비를 픽셀 단위로 지정해요 |
| align | 'left' | "left" \| "center" \| "right" | 텍스트 정렬을 지정해요 |
| color | - | string | 텍스트 색상을 지정해요 |
| typography | 't5' | string | 텍스트 타이포그래피를 지정해요 |

*필수 속성

## 관련 컴포넌트

- List: 세로 리스트를 표시해요
- ListRow: 간단한 리스트 아이템을 표시해요

---
*마지막 업데이트: 2025-11-28*

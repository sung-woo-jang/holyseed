# BarChart

BarChart 컴포넌트는 막대 그래프를 표시하는 컴포넌트예요. 데이터 비교, 통계, 분석 결과를 시각적으로 보여줄 때 사용해요.

## 사용 예제

### 기본 사용

BarChart를 사용하려면 data를 지정하세요.

```tsx
import { BarChart } from '@toss/tds-react-native';

const data = [
  { label: '월', value: 30 },
  { label: '화', value: 45 },
  { label: '수', value: 60 },
  { label: '목', value: 35 },
  { label: '금', value: 80 },
];

<BarChart data={data} />
```

### 세로 막대 그래프

기본적으로 세로 방향 막대 그래프를 표시해요.

```tsx
const salesData = [
  { label: '1월', value: 150 },
  { label: '2월', value: 200 },
  { label: '3월', value: 180 },
  { label: '4월', value: 250 },
  { label: '5월', value: 300 },
  { label: '6월', value: 280 },
];

<BarChart
  data={salesData}
  height={200}
  color={colors.blue500}
/>
```

### 가로 막대 그래프

horizontal 속성을 사용해 가로 방향 막대 그래프를 만들 수 있어요.

```tsx
const rankingData = [
  { label: '홍길동', value: 95 },
  { label: '김철수', value: 88 },
  { label: '이영희', value: 82 },
  { label: '박민수', value: 76 },
  { label: '최지은', value: 70 },
];

<BarChart
  data={rankingData}
  horizontal
  color={colors.green500}
/>
```

### 색상 커스터마이즈

각 막대의 색상을 개별적으로 지정할 수 있어요.

```tsx
const categoryData = [
  { label: '식비', value: 400000, color: colors.red400 },
  { label: '교통비', value: 150000, color: colors.blue400 },
  { label: '쇼핑', value: 300000, color: colors.purple400 },
  { label: '문화생활', value: 200000, color: colors.green400 },
];

<BarChart data={categoryData} />
```

### 값 레이블 표시

showValues를 사용해 막대 위에 값을 표시할 수 있어요.

```tsx
<BarChart
  data={data}
  showValues
  valueFormatter={(value) => `${value.toLocaleString()}원`}
/>
```

### 그리드 라인

showGrid를 사용해 그리드 라인을 표시할 수 있어요.

```tsx
<BarChart
  data={data}
  showGrid
  gridColor={colors.grey200}
/>
```

### 최소/최대값 설정

minValue와 maxValue를 설정할 수 있어요.

```tsx
<BarChart
  data={data}
  minValue={0}
  maxValue={100}
/>
```

### 월별 매출 차트

월별 매출 데이터를 표시할 수 있어요.

```tsx
const monthlySales = [
  { label: '1월', value: 12500000 },
  { label: '2월', value: 13200000 },
  { label: '3월', value: 15800000 },
  { label: '4월', value: 14300000 },
  { label: '5월', value: 16500000 },
  { label: '6월', value: 18200000 },
];

<View>
  <Txt typography="h4" style={{ marginBottom: 16 }}>
    월별 매출 현황
  </Txt>

  <BarChart
    data={monthlySales}
    height={250}
    color={colors.blue500}
    showValues
    showGrid
    valueFormatter={(value) => `${(value / 10000).toFixed(0)}만원`}
  />
</View>
```

### 카테고리별 지출

카테고리별 지출을 비교할 수 있어요.

```tsx
const expenses = [
  { label: '식비', value: 450000, color: colors.red400 },
  { label: '교통비', value: 120000, color: colors.blue400 },
  { label: '통신비', value: 80000, color: colors.purple400 },
  { label: '쇼핑', value: 350000, color: colors.orange400 },
  { label: '문화', value: 180000, color: colors.green400 },
];

<View>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
    <Txt typography="h4">카테고리별 지출</Txt>
    <Txt typography="h5" color={colors.blue500}>
      총 {expenses.reduce((sum, item) => sum + item.value, 0).toLocaleString()}원
    </Txt>
  </View>

  <BarChart
    data={expenses}
    showValues
    valueFormatter={(value) => `${value.toLocaleString()}원`}
  />
</View>
```

### 애니메이션

animated를 사용해 차트를 애니메이션할 수 있어요.

```tsx
<BarChart
  data={data}
  animated
  animationDuration={800}
/>
```

### 클릭 이벤트

onBarPress를 사용해 막대 클릭 이벤트를 처리할 수 있어요.

```tsx
<BarChart
  data={data}
  onBarPress={(item, index) => {
    console.log(`${item.label}: ${item.value}`);
  }}
/>
```

## 인터페이스

### BarChartProps

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| data* | - | BarChartData[] | 차트에 표시할 데이터 배열을 지정해요 |
| height | 200 | number | 차트의 높이를 픽셀 단위로 지정해요 |
| horizontal | false | boolean | 가로 방향 차트로 표시할지 여부를 지정해요 |
| color | colors.blue500 | string | 막대의 기본 색상을 지정해요 |
| showValues | false | boolean | 막대 위에 값을 표시할지 여부를 지정해요 |
| showGrid | false | boolean | 그리드 라인을 표시할지 여부를 지정해요 |
| gridColor | colors.grey200 | string | 그리드 라인 색상을 지정해요 |
| minValue | - | number | 차트의 최소값을 지정해요 |
| maxValue | - | number | 차트의 최대값을 지정해요 |
| valueFormatter | - | (value: number) => string | 값을 포맷팅하는 함수를 지정해요 |
| animated | false | boolean | 애니메이션을 활성화할지 여부를 지정해요 |
| animationDuration | 500 | number | 애니메이션 지속 시간을 밀리초 단위로 지정해요 |
| onBarPress | - | (item: BarChartData, index: number) => void | 막대를 클릭했을 때 호출되는 함수예요 |
| style | - | StyleProp<ViewStyle> | 컴포넌트의 커스텀 스타일을 지정해요 |

*필수 속성

### BarChartData

| 속성 | 기본값 | 타입 | 설명 |
|------|--------|------|------|
| label* | - | string | 막대의 레이블을 지정해요 |
| value* | - | number | 막대의 값을 지정해요 |
| color | - | string | 개별 막대의 색상을 지정해요 |

*필수 속성

## 관련 컴포넌트

- ProgressBar: 단일 진행률을 표시해요

---
*마지막 업데이트: 2025-11-28*

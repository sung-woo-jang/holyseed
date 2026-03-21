# Colors

Colors는 TDS 디자인 시스템의 색상 팔레트를 제공하는 Foundation이에요. 통일된 색상 네이밍으로 일관된 UI를 구현할 수 있어요.

## 사용 예제

### 기본 사용

colors 객체를 import하여 색상을 사용하세요.

```tsx
import { colors } from '@toss/tds-react-native';

<View style={{ backgroundColor: colors.blue500 }}>
  <Txt color={colors.white}>파란색 배경</Txt>
</View>
```

## 색상 팔레트

TDS는 10개의 메인 색상군을 제공하며, 각 색상군은 9개의 음영(50-900)을 가져요.

### Grey

회색 팔레트는 배경, 테두리, 텍스트 등에 사용돼요.

```tsx
<View style={{ backgroundColor: colors.grey50 }}>가장 밝은 회색</View>
<View style={{ backgroundColor: colors.grey100 }}>밝은 회색</View>
<View style={{ backgroundColor: colors.grey200 }}>연한 회색</View>
<View style={{ backgroundColor: colors.grey300 }}>중간 밝은 회색</View>
<View style={{ backgroundColor: colors.grey400 }}>중간 회색</View>
<View style={{ backgroundColor: colors.grey500 }}>회색</View>
<View style={{ backgroundColor: colors.grey600 }}>중간 어두운 회색</View>
<View style={{ backgroundColor: colors.grey700 }}>어두운 회색</View>
<View style={{ backgroundColor: colors.grey800 }}>매우 어두운 회색</View>
<View style={{ backgroundColor: colors.grey900 }}>가장 어두운 회색</View>
```

### Blue

파란색 팔레트는 주요 브랜드 색상과 강조에 사용돼요.

```tsx
<View style={{ backgroundColor: colors.blue50 }} />
<View style={{ backgroundColor: colors.blue100 }} />
<View style={{ backgroundColor: colors.blue200 }} />
<View style={{ backgroundColor: colors.blue300 }} />
<View style={{ backgroundColor: colors.blue400 }} />
<View style={{ backgroundColor: colors.blue500 }} /> {/* 주로 사용되는 파란색 */}
<View style={{ backgroundColor: colors.blue600 }} />
<View style={{ backgroundColor: colors.blue700 }} />
<View style={{ backgroundColor: colors.blue800 }} />
<View style={{ backgroundColor: colors.blue900 }} />
```

### Red

빨간색 팔레트는 오류, 삭제, 경고 등에 사용돼요.

```tsx
<Button type="danger" style={{ backgroundColor: colors.red500 }}>
  삭제
</Button>

<Txt color={colors.red500}>오류 메시지</Txt>
```

### Green

초록색 팔레트는 성공, 완료, 긍정적인 상태에 사용돼요.

```tsx
<Badge type="green" style={{ backgroundColor: colors.green500 }}>
  완료
</Badge>

<Txt color={colors.green500}>성공했어요</Txt>
```

### Orange

주황색 팔레트는 주의, 진행 중인 상태에 사용돼요.

```tsx
<Badge style={{ backgroundColor: colors.orange500 }}>진행중</Badge>
```

### Yellow

노란색 팔레트는 경고, 강조에 사용돼요.

```tsx
<View style={{ backgroundColor: colors.yellow100, padding: 12 }}>
  <Txt color={colors.yellow700}>주의사항</Txt>
</View>
```

### Teal

청록색 팔레트는 보조 강조 색상으로 사용돼요.

```tsx
<Button style={{ backgroundColor: colors.teal500 }}>버튼</Button>
```

### Purple

보라색 팔레트는 프리미엄, 특별한 기능에 사용돼요.

```tsx
<Badge style={{ backgroundColor: colors.purple500 }}>프리미엄</Badge>
```

## 특수 색상

### Grey Opacity

투명도가 있는 회색으로, 오버레이나 구분선에 사용돼요.

```tsx
<View style={{ backgroundColor: colors.greyOpacity50 }}>2% 불투명도</View>
<View style={{ backgroundColor: colors.greyOpacity100 }}>5% 불투명도</View>
<View style={{ backgroundColor: colors.greyOpacity200 }}>10% 불투명도</View>
// ... 900까지 (91% 불투명도)
```

### 배경 색상

```tsx
import { colors } from '@toss/tds-react-native';

// 기본 배경
<View style={{ backgroundColor: colors.background }} />

// 회색 배경
<View style={{ backgroundColor: colors.greyBackground }} />

// 레이어 배경
<View style={{ backgroundColor: colors.layeredBackground }} />

// 플로팅 배경
<View style={{ backgroundColor: colors.floatedBackground }} />
```

## 사용 가이드

### 텍스트 색상

```tsx
{/* 주 텍스트 */}
<Txt color={colors.grey900}>주요 내용</Txt>

{/* 보조 텍스트 */}
<Txt color={colors.grey600}>부가 설명</Txt>

{/* 비활성 텍스트 */}
<Txt color={colors.grey400}>비활성 상태</Txt>
```

### 테두리 색상

```tsx
<View style={{ borderColor: colors.grey200, borderWidth: 1 }}>
  연한 테두리
</View>

<View style={{ borderColor: colors.grey300, borderWidth: 1 }}>
  중간 테두리
</View>
```

### 버튼 색상

```tsx
{/* 주요 액션 */}
<Button style={{ backgroundColor: colors.blue500 }}>확인</Button>

{/* 위험 액션 */}
<Button style={{ backgroundColor: colors.red500 }}>삭제</Button>

{/* 보조 액션 */}
<Button style={{ backgroundColor: colors.grey100 }}>취소</Button>
```

### 상태 색상

```tsx
{/* 성공 */}
<View style={{ backgroundColor: colors.green50 }}>
  <Txt color={colors.green700}>성공</Txt>
</View>

{/* 경고 */}
<View style={{ backgroundColor: colors.yellow50 }}>
  <Txt color={colors.yellow700}>주의</Txt>
</View>

{/* 오류 */}
<View style={{ backgroundColor: colors.red50 }}>
  <Txt color={colors.red700}>오류</Txt>
</View>
```

## 색상 팔레트 전체 목록

각 색상군은 50, 100, 200, 300, 400, 500, 600, 700, 800, 900의 음영을 가져요.

- **Grey**: #f9fafb ~ #191f28
- **Blue**: #e8f3ff ~ #194aa6
- **Red**: #ffeeee ~ #a51926
- **Orange**: #fff3e0 ~ #e45600
- **Yellow**: #fff9e7 ~ #dd7d02
- **Green**: #f0faf6 ~ #027648
- **Teal**: #edf8f8 ~ #076565
- **Purple**: #f9f0fc ~ #65237b
- **Pink**: 추가 색상
- **Elephant**: 회색 계열 추가 색상

## 중요 사항

- 색상을 직접 하드코딩하지 말고 colors 객체를 사용하세요
- 디자인 가이드라인에 맞춰 일관된 UI를 구현할 수 있어요
- 다크모드 대응을 위해 색상 변수를 사용하는 것이 중요해요

---
*마지막 업데이트: 2025-11-28*

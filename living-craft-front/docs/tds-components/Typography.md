# Typography

Typography는 TDS 디자인 시스템의 타이포그래피 토큰을 제공하는 Foundation이에요. 텍스트 가독성, 일관성, 브랜드 아이덴티티를 유지하면서 정보 계층을 명확하게 표현해요.

## 사용 예제

### 기본 사용

Txt 컴포넌트의 typography 속성으로 타이포그래피 토큰을 사용하세요.

```tsx
import { Txt } from '@toss/tds-react-native';

<Txt typography="h1">매우 큰 제목</Txt>
<Txt typography="t5">본문 텍스트</Txt>
```

## 타이포그래피 토큰

### 주요 타이포그래피 레벨

TDS는 계층적 토큰 구조를 사용해요. 구체적인 값을 외우지 말고 토큰을 직접 사용하세요.

| 토큰 | 폰트 크기 | 줄 높이 | 용도 |
|------|----------|---------|------|
| h1 | 30px | 40px | 매우 큰 제목 |
| h2 | 26px | 35px | 큰 제목 |
| h3 | 22px | 31px | 일반 제목 |
| h4 | 20px | 29px | 작은 제목 |
| h5 | 17px | 25.5px | 본문 제목 |
| t5 | 17px | 25.5px | 본문 텍스트 |
| t6 | 15px | 22.5px | 작은 본문 |
| t7 | 13px | 19.5px | 최소 텍스트 |

### 사용 예제

```tsx
{/* 제목 계층 */}
<Txt typography="h1">매우 큰 제목</Txt>
<Txt typography="h2">큰 제목</Txt>
<Txt typography="h3">일반 제목</Txt>
<Txt typography="h4">작은 제목</Txt>
<Txt typography="h5">본문 제목</Txt>

{/* 본문 텍스트 */}
<Txt typography="t5">일반 본문 텍스트예요</Txt>
<Txt typography="t6">작은 본문 텍스트예요</Txt>
<Txt typography="t7">최소 크기 텍스트예요</Txt>
```

## 확대 텍스트 지원

### iOS 설정

iOS는 제한된 텍스트 크기 단계를 제공해요. 시스템은 이를 비율로 추상화해요:

- **100%** (Large): 기본 크기
- **110%** (xLarge): 10% 확대
- **120%** (xxLarge): 20% 확대
- **135%** (xxxLarge): 35% 확대
- **160%-310%** (접근성 레벨): 추가 확대

### Android 공식

Android는 연속적인 스케일링을 지원해요:

**공식**: `기본 크기 × NN% × 0.01`

**예시**: "h1을 110%로 설정하면 = 30 × 110 × 0.01 = 33px"

## 실전 사용 가이드

### 페이지 제목

```tsx
<View style={{ padding: 20 }}>
  <Txt typography="h2" fontWeight="bold">
    페이지 제목
  </Txt>
  <Txt typography="t6" color={colors.grey600} style={{ marginTop: 8 }}>
    페이지 설명
  </Txt>
</View>
```

### 카드 제목과 내용

```tsx
<Card>
  <Txt typography="h4" fontWeight="bold">
    카드 제목
  </Txt>
  <Txt typography="t6" style={{ marginTop: 8 }}>
    카드의 상세 내용이 여기에 표시돼요
  </Txt>
</Card>
```

### 리스트 아이템

```tsx
<ListRow
  contents={
    <View>
      <Txt typography="t5">주요 텍스트</Txt>
      <Txt typography="t6" color={colors.grey600} style={{ marginTop: 4 }}>
        부가 설명
      </Txt>
    </View>
  }
/>
```

### 버튼 텍스트

```tsx
<Button>
  <Txt typography="t5" fontWeight="semiBold">
    버튼 텍스트
  </Txt>
</Button>
```

### 폼 레이블

```tsx
<View style={{ gap: 8 }}>
  <Txt typography="t5" fontWeight="semiBold">
    이름
  </Txt>
  <TextField
    value={name}
    onChange={setName}
    placeholder="이름을 입력하세요"
  />
  <Txt typography="t7" color={colors.grey600}>
    본명을 입력해주세요
  </Txt>
</View>
```

### 통계 숫자

```tsx
<View style={{ alignItems: 'center', gap: 4 }}>
  <Txt typography="h1" fontWeight="bold" color={colors.blue500}>
    1,234
  </Txt>
  <Txt typography="t6" color={colors.grey600}>
    총 방문자
  </Txt>
</View>
```

### 시간 표시

```tsx
<Txt typography="t7" color={colors.grey500}>
  2시간 전
</Txt>
```

## 폰트 굵기

fontWeight 속성으로 텍스트 굵기를 조절할 수 있어요.

```tsx
<Txt typography="h3" fontWeight="regular">일반</Txt>
<Txt typography="h3" fontWeight="medium">중간</Txt>
<Txt typography="h3" fontWeight="semiBold">약간 굵게</Txt>
<Txt typography="h3" fontWeight="bold">굵게</Txt>
```

## 중요 사항

**하드코딩 금지**: "아래 표에 나온 값을 직접 하드코딩하지 않길 권장해요"

❌ 잘못된 사용:
```tsx
<Txt style={{ fontSize: 17, lineHeight: 25.5 }}>텍스트</Txt>
```

✅ 올바른 사용:
```tsx
<Txt typography="t5">텍스트</Txt>
```

## 서브 타이포그래피

중간 크기가 필요한 경우 서브 타이포그래피 변형(h6-h13)을 사용할 수 있어요. 이는 주요 레벨 사이의 중간 크기를 제공해요.

## 접근성

- 텍스트 크기 모드에서 유연성을 유지하기 위해 토큰을 사용하세요
- 사용자가 텍스트 크기를 조정해도 레이아웃이 깨지지 않도록 설계하세요
- 최소 텍스트 크기(t7)는 접근성을 고려하여 신중하게 사용하세요

## 관련 컴포넌트

- Txt: 타이포그래피를 적용하는 텍스트 컴포넌트예요
- Colors: 텍스트 색상을 지정할 때 사용해요

---
*마지막 업데이트: 2025-11-28*
